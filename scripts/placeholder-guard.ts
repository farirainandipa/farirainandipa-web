import type { Plugin } from 'vite';
import * as content from '../src/data/destinations';

// Fails the production build while any live string in src/data/destinations.ts
// still contains "[", the marker for owner-to-fill placeholders such as
// "[XXXX] theatre" or "[MON YYYY]". Set ALLOW_PLACEHOLDERS=1 to build anyway
// (local previews only; never set it in Netlify).

function findPlaceholders(value: unknown, path: string, out: string[]) {
  if (typeof value === 'string') {
    if (value.includes('[')) out.push(`${path}: ${value}`);
  } else if (typeof value === 'function') {
    // Template helpers like briefTitle(name) build copy from a name.
    findPlaceholders(value('Name'), `${path}()`, out);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => findPlaceholders(v, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) findPlaceholders(v, `${path}.${k}`, out);
  }
}

export default function placeholderGuard(): Plugin {
  return {
    name: 'destinations-placeholder-guard',
    apply: 'build',
    buildStart() {
      const found: string[] = [];
      if (content.destinationPagesLive) {
        for (const [name, value] of Object.entries(content)) {
          if (name === 'getDestination') continue;
          findPlaceholders(value, name, found);
        }
      } else {
        // Only the hub is live, so check just what it shows: the hub copy,
        // the guide, and each destination's card and comparison row.
        findPlaceholders(content.hub, 'hub', found);
        findPlaceholders(content.guide, 'guide', found);
        findPlaceholders(content.EVENT_TYPE_LABELS, 'EVENT_TYPE_LABELS', found);
        content.destinations.forEach((d, i) => {
          const { name, cities, bestFor, comparison } = d;
          findPlaceholders({ name, cities, bestFor, card: d.photos.card, comparison }, `destinations[${i}]`, found);
        });
      }
      if (found.length === 0) return;

      const summary = `${found.length} placeholder(s) still in src/data/destinations.ts`;
      if (process.env.ALLOW_PLACEHOLDERS === '1') {
        this.warn(`${summary} (allowed by ALLOW_PLACEHOLDERS=1)`);
        return;
      }
      const sample = found.slice(0, 15).map((f) => `  - ${f}`).join('\n');
      const more = found.length > 15 ? `\n  ...and ${found.length - 15} more` : '';
      this.error(
        `${summary}. Fill them in before a production build, ` +
          `or set ALLOW_PLACEHOLDERS=1 for a local preview build.\n${sample}${more}`
      );
    },
  };
}
