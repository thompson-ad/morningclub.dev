/** Everything about the garden that more than one surface needs to agree on. */

/**
 * Absolute path to the repo root.
 *
 * Injected by astro.config via Vite `define`, because build-time code that
 * reads git history and image bytes gets bundled into dist/ — where
 * `import.meta.url` points at the bundle, not the source. The `process.cwd()`
 * arm covers anything importing this module outside an Astro build.
 */
declare const __GARDEN_ROOT__: string;
export const ROOT =
  typeof __GARDEN_ROOT__ !== 'undefined' ? __GARDEN_ROOT__ : process.cwd();

export const SITE = {
  url: 'https://morningclub.dev',
  name: 'morning club',
  /** Used in llms.txt, the RSS channel, and the index page. */
  tagline: 'A living digital garden by Aaron Thompson.',
  author: 'Aaron Thompson',
  repo: {
    owner: 'thompson-ad',
    name: 'morningclub.dev',
    branch: 'main',
  },
} as const;

export const STAGES = ['seedling', 'budding', 'evergreen'] as const;
export type Stage = (typeof STAGES)[number];

/** Where an article's source lives in the repo, relative to the root. */
export const DRAFTS_DIR = 'drafts';

export const repoUrl = () =>
  `https://github.com/${SITE.repo.owner}/${SITE.repo.name}`;

/** GitHub commit history for one article — the drill-down behind history.md. */
export const commitsUrl = (slug: string) =>
  `${repoUrl()}/commits/${SITE.repo.branch}/${DRAFTS_DIR}/${slug}.md`;

/** A specific historical version of an article, by commit sha. */
export const rawUrl = (slug: string, sha = '<commit-sha>') =>
  `https://raw.githubusercontent.com/${SITE.repo.owner}/${SITE.repo.name}/${sha}/${DRAFTS_DIR}/${slug}.md`;

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
