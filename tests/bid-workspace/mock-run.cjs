// Mocked end-to-end run of the Bid Workspace UI: intercepts Supabase auth + REST calls
// and serves fixture data, so every view can be rendered and screenshotted without credentials.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixture.json'), 'utf8'));
const ROLE = process.argv[2] || 'admin'; // admin | client
const OUT = path.join(__dirname, 'shots', ROLE); fs.mkdirSync(OUT, { recursive: true });

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const uid = ROLE === 'admin' ? '1e689aca-f4c2-400b-a1a3-9d3b97946f8d' : '7b193957-3240-46aa-8d76-031cdd52e887';
const email = ROLE === 'admin' ? 'nandie@farirainandipa.co.zw' : 'client@tbcz.test';
const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: uid, email, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const user = { id: uid, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const session = { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r', user };
const clientOrg = fx.orgs.find(o => o.kind === 'client');
const visible = rows => ROLE === 'admin' ? rows : rows.filter(r => r.client_visible !== false && (r.visibility === undefined || r.visibility === 'client'));

const tables = {
  bw_bids: fx.bids, bw_requirements: fx.reqs, bw_stakeholders: fx.sh, bw_milestones: fx.ms, bw_documents: fx.docs, bw_messages: fx.msgs,
  bw_activity: fx.act, bw_orgs: fx.orgs, bw_letter_templates: fx.templates, countries: fx.countries, bw_members: [], bw_scores: [], events: [],
};
function rest(url, method, headers, body) {
  const u = new URL(url); const parts = u.pathname.split('/'); const table = parts[3];
  if (parts[3] === 'rpc') {
    const fn = parts[4];
    if (fn === 'bw_my_role') return ROLE === 'admin' ? { role: 'admin', email } : { role: 'client', email, orgs: [{ id: clientOrg.id, name: clientOrg.name, kind: 'client' }] };
    if (fn === 'bw_bid_list') return ROLE === 'admin' ? fx.bid_list : fx.bid_list.filter(b => b.client_org_id === clientOrg.id);
    if (fn === 'bw_add_requirements') return (body.rows || []).length;
    return 0;
  }
  let rows = (tables[table] || []).slice();
  if (ROLE !== 'admin') { rows = visible(rows); if (table === 'bw_bids') rows = rows.filter(b => b.client_org_id === clientOrg.id); }
  for (const [k, v] of u.searchParams) { if (k === 'select' || k === 'order' || k === 'limit') continue; const m = v.match(/^(eq|ilike)\.(.*)$/); if (!m) continue;
    if (m[1] === 'eq') rows = rows.filter(r => String(r[k]) === m[2]); else rows = rows.filter(r => String(r[k] || '').toLowerCase().includes(m[2].replace(/%/g, '').toLowerCase())); }
  if (method === 'POST') { const r = Array.isArray(body) ? body : [{ id: 'new-' + Date.now(), ...body }]; return headers['accept']?.includes('object') ? r[0] : r; }
  if (method === 'PATCH' || method === 'DELETE') return headers['prefer']?.includes('return=representation') ? rows : [];
  if (headers['accept']?.includes('object')) return rows[0] || null;
  return rows;
}

(async () => {
  const server = http.createServer((req, res) => { res.setHeader('content-type', 'text/html'); res.end(fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'bids', 'index.html'))); }).listen(8787);
  const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const local = { 'supabase-js@2.45.4/dist/umd/supabase.js': 'node_modules/@supabase/supabase-js/dist/umd/supabase.js', 'pdf.js/3.11.174/pdf.min.js': 'node_modules/pdfjs-dist/build/pdf.min.js', 'pdf.worker.min.js': 'node_modules/pdfjs-dist/build/pdf.worker.min.js', 'mammoth.browser.min.js': 'node_modules/mammoth/mammoth.browser.min.js' };
  await page.route(/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.g)/, route => { const u = route.request().url(); const k = Object.keys(local).find(k => u.includes(k));
    if (k) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(__dirname, local[k])) }); return route.fulfill({ status: 200, contentType: 'text/css', body: '' }); });
  await page.route(/upzkvszgoqhoefkiwoep\.supabase\.co/, async route => {
    const req = route.request(); const url = req.url(); const method = req.method(); const headers = req.headers();
    let body = null; try { body = req.postDataJSON(); } catch {}
    const json = (o, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, body: JSON.stringify(o) });
    if (method === 'OPTIONS') return json({});
    if (url.includes('/auth/v1/token')) return json(session);
    if (url.includes('/auth/v1/user')) return json(user);
    if (url.includes('/auth/v1/logout')) return json({});
    if (url.includes('/functions/v1/bid-extract')) return json({ ai: false });
    if (url.includes('/functions/v1/bid-admin')) return json({ ok: true, email: body?.email || 'x@y.z', temp_password: 'Temp1234!7' });
    if (url.includes('/storage/v1/')) return json({ signedUrl: 'about:blank', Key: 'k' });
    if (url.includes('/rest/v1/')) return json(rest(url, method, headers, body));
    return json({});
  });
  const shot = async name => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true }); console.log('shot', name); };

  await page.goto('http://localhost:8787/'); await page.waitForSelector('#authf'); await shot('00-auth');
  await page.fill('[name=email]', email); await page.fill('[name=password]', 'x'); await page.click('#authf button');
  await page.waitForSelector('.bidcard', { timeout: 15000 }); await shot('01-bids');
  await page.click('.bidcard:has-text("AAS8")'); await page.waitForSelector('.stepper'); await shot('02-bid-overview');
  const tabs = ROLE === 'admin' ? ['decide', 'fee', 'requirements', 'stakeholders', 'schedule', 'documents', 'messages'] : ['requirements', 'stakeholders', 'schedule', 'documents', 'messages'];
  for (const t of tabs) { await page.click(`.subtabs button[data-t="${t}"]`); await page.waitForTimeout(200); await shot('03-' + t); }
  if (ROLE === 'admin') {
    // letter generation
    await page.click('.subtabs button[data-t="stakeholders"]'); await page.waitForTimeout(200);
    const lb = await page.$('[data-letter]'); if (lb) { await lb.click(); await page.waitForSelector('pre.letter'); await shot('04-letter'); await page.keyboard.press('Escape'); }
    // requirement import with heuristic parser on the AAS7 text
    await page.click('.subtabs button[data-t="requirements"]'); await page.waitForTimeout(200); await page.click('#importreq'); await page.waitForSelector('#rtext');
    await page.fill('#rtext', fs.readFileSync(path.join(__dirname, 'aas7.txt'), 'utf8')); await page.click('#go'); await page.waitForSelector('#doimport', { timeout: 10000 });
    const n = await page.$$eval('#preview tbody tr', r => r.length); console.log('heuristic rows extracted:', n);
    const types = await page.$$eval('#preview select', s => s.map(x => x.value)); console.log('types:', types.reduce((a, t) => (a[t] = (a[t] || 0) + 1, a), {}));
    await shot('05-import-preview'); await page.keyboard.press('Escape');
    // new bid modal, edit modal, scorecard interaction
    await page.click('#editbid'); await page.waitForSelector('#save'); await shot('06-edit-bid'); await page.keyboard.press('Escape');
    await page.click('.subtabs button[data-t="decide"]'); await page.waitForTimeout(200);
    await page.click('#bnb .score[data-k="eligibility"] .pts button[data-n="1"]'); await page.waitForTimeout(100); await shot('07-decide-override');
    await page.click('.subtabs button[data-t="fee"]'); await page.waitForTimeout(200); await page.check('[data-adj="design"]'); await page.waitForTimeout(100); await shot('08-fee-adjusted');
    await page.goto('http://localhost:8787/#clients'); await page.waitForSelector('#neworg'); await shot('09-clients');
    await page.click('#newuser'); await page.waitForSelector('#go'); await shot('10-new-login'); await page.keyboard.press('Escape');
    await page.goto('http://localhost:8787/#bids'); await page.waitForSelector('#newbid'); await page.click('#newbid'); await page.waitForSelector('#save'); await shot('11-new-bid'); await page.keyboard.press('Escape');
  }
  await page.goto('http://localhost:8787/#stages'); await page.waitForTimeout(400); await shot('12-stages');
  await ctx.close(); await browser.close(); server.close();
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No JS errors');
})();
