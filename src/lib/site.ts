/**
 * The neutral domain — everything more than one surface must agree on.
 *
 * Nothing here knows the site's metaphor. Stage values are epistemic states,
 * notes live in a directory, and the collection is a corpus. The metaphor is
 * applied only at the rendered-HTML layer, from [[lexicon]].
 */

import path from 'node:path';

/**
 * Absolute path to the repo root.
 *
 * Injected by astro.config via Vite `define`, because build-time code that
 * reads git history and image bytes gets bundled into dist/ — where
 * `import.meta.url` points at the bundle, not the source. The `process.cwd()`
 * arm covers anything importing this module outside an Astro build.
 */
declare const __REPO_ROOT__: string;
export const ROOT =
  typeof __REPO_ROOT__ !== 'undefined' ? __REPO_ROOT__ : process.cwd();

export const SITE = {
  url: 'https://morningclub.dev',
  name: 'morning club',
  /**
   * The site description, used in meta tags, JSON-LD, the feed and llms.txt —
   * all data surfaces, so it stays metaphor-neutral. The metaphorical byline is
   * the masthead's, and lives in the lexicon.
   */
  tagline: 'Working notes by Aaron Thompson, revised in place and never finished.',
  author: 'Aaron Thompson',
  repo: {
    owner: 'thompson-ad',
    name: 'morningclub.dev',
    branch: 'main',
  },
} as const;

/**
 * An article's epistemic status — how much weight a reader should give it
 * today, and the only metadata that claim needs.
 *
 * These three values are the permanent frontmatter contract (spec §9.4): they
 * are stored in every article, exposed byte-faithfully to agents, and keyed by
 * the stage-mark CSS. They are deliberately metaphor-free so the surface skin
 * can change without touching a single article. The reader-facing words are the
 * lexicon's job, not this file's.
 *
 * Ordered low → high confidence; the stage mark's fill follows that order.
 */
export const STAGES = ['exploratory', 'developing', 'established'] as const;
export type Stage = (typeof STAGES)[number];

/** Where an article's source lives in the repo, relative to the root. */
export const NOTES_DIR = 'notes';

export const repoUrl = () =>
  `https://github.com/${SITE.repo.owner}/${SITE.repo.name}`;

/** GitHub commit history for one article — the drill-down behind history.md. */
export const commitsUrl = (slug: string) =>
  `${repoUrl()}/commits/${SITE.repo.branch}/${NOTES_DIR}/${slug}.md`;

/** A specific historical version of an article, by commit sha. */
export const rawUrl = (slug: string, sha = '<commit-sha>') =>
  `https://raw.githubusercontent.com/${SITE.repo.owner}/${SITE.repo.name}/${sha}/${NOTES_DIR}/${slug}.md`;

/** Machine-facing date format. Dates are days, never times, in every surface. */
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Human-facing date format: 22 July 2026. */
export const humanDay = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
