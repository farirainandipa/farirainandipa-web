# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Project overview

Marketing website for Farirai Nandipa (event/MICE services). Vite + React +
TypeScript SPA styled with Tailwind, using React Router for client-side
routing and Supabase as the backend (Postgres + REST via `@supabase/supabase-js`).

Originally scaffolded with Bolt (`bolt-vite-react-ts` template, see `.bolt/`).

## Stack

- Vite 5, React 18, TypeScript 5
- Tailwind CSS, lucide-react icons
- react-router-dom v7
- Supabase (`src/lib/supabase.ts`) for data: articles, services, contact form

## Commands

```bash
npm install       # install deps
npm run dev        # start dev server
npm run build       # production build to dist/
npm run preview      # preview the production build
npm run lint        # eslint
npm run typecheck      # tsc --noEmit
```

## Structure

- `src/pages/` — one component per route (Home, About, Services, Destinations,
  DestinationPage, Insights, ArticleDetail, Contact)
- `src/components/` — shared layout pieces (Header, Footer, Layout, ScrollFade)
- `src/lib/supabase.ts` — Supabase client + row types (`Article`, `Service`,
  `ServiceItem`, `ContactSubmission`)
- `supabase/migrations/` — SQL migrations, applied directly to the linked
  Supabase project (see below)

## Environment variables

Required in `.env` (gitignored) for the app to run — `src/lib/supabase.ts`
throws at startup if either is missing:

```
VITE_SUPABASE_URL=https://upzkvszgoqhoefkiwoep.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable/anon key>
```

The anon/publishable key is safe to expose client-side; it is constrained by
the RLS policies below. Never put the `service_role` key in client code or
commit it anywhere.

The same two variables must be set in the Netlify site's environment
variables for production builds.

## Database (Supabase)

Project ref: `upzkvszgoqhoefkiwoep` (region eu-west-1).

Tables: `articles`, `contact_submissions`, `services`, `service_items`.
RLS is enabled on every table. Current policy shape:

- `articles`, `services`: public can `SELECT` only published/active rows;
  `authenticated` role can fully read/write.
- `service_items`: public read-all (no draft state on this table);
  `authenticated` can write.
- `contact_submissions`: public (anon) can `INSERT` only — this is how the
  Contact page submits the enquiry/consultation form. Only `authenticated`
  can read, update, or delete submissions.

There is currently **no sign-in flow in the app**, so nothing actually holds
the `authenticated` role today — writes to `articles`/`services`/`service_items`
and reads/updates on `contact_submissions` can only happen via the Supabase
dashboard, the `service_role` key, or a future admin login. If an admin UI or
auth flow is added, scope `authenticated` policies down further (e.g. to a
specific admin user/role claim) rather than leaving them open to any signed-in
user.

When changing schema, add a new file under `supabase/migrations/` (don't edit
existing ones) and apply it to the linked project. After any DDL change, check
Supabase security advisors for new RLS/lint warnings.

## Deployment

Deployed via Netlify, building from the `main` branch of
`github.com/farirainandipa/farirainandipa-web`. Build command `npm run build`,
publish directory `dist`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
in Netlify's site environment variables — the build will fail without them.

## Conventions

- Keep one page component per route under `src/pages/`; shared chrome goes in
  `src/components/Layout.tsx` (Header/Footer wrap `<Outlet />`).
- Icons: use `lucide-react` only (per `.bolt/prompt`); don't add another icon
  library.
- No test suite currently exists.

## Copy style

- No em dashes (—) anywhere in user-facing text. Use a comma, or rephrase.
- No Oxford colons (a colon before a list or explanatory clause in running
  prose, e.g. "We offer: planning, logistics"). Work the list into the
  sentence naturally instead.
