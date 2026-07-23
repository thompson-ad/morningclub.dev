/**
 * Internal link resolution (FR-7).
 *
 * Articles cross-link with a relative link to the sibling *file*:
 *
 *     [forcing functions](./spaced-repetition.md)
 *
 * That one authoring form has to resolve in three places: on GitHub (file to
 * file), in the served raw `.md` siblings (`/a.md` → `./b.md` → `/b.md`, so an
 * agent can walk the whole network without leaving markdown), and on the HTML
 * page (rewritten to `/spaced-repetition` at build time).
 *
 * This module is the single definition of "is that an internal article link?",
 * imported by both the render-time mdast plugin and the backlink graph builder,
 * so what the HTML links to and what "Linked from" claims can never drift.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A markdown link destination that points at a sibling article file. */
export interface InternalTarget {
  slug: string;
  /** Any `#anchor` on the link, preserved through the rewrite. */
  hash: string;
}

/**
 * Parse a link destination as an internal article reference, or return null.
 *
 * Accepts `./slug.md`, `slug.md`, and either with a `#fragment`.
 * Rejects absolute URLs, protocol-relative URLs, `/images/...`, `../escapes`,
 * and anything whose stem is not a valid slug — those pass through untouched.
 */
export function internalTarget(rawUrl: string): InternalTarget | null {
  if (!rawUrl) return null;

  // Strip the angle-bracket form: [x](<./a b.md>)
  let url = rawUrl.trim();
  if (url.startsWith('<') && url.endsWith('>')) url = url.slice(1, -1);

  // A scheme, a protocol-relative URL, or a root-absolute path is external.
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('/')) {
    return null;
  }

  const hashAt = url.indexOf('#');
  const hash = hashAt === -1 ? '' : url.slice(hashAt);
  let pathPart = hashAt === -1 ? url : url.slice(0, hashAt);

  // Only a bare sibling or an explicit `./` sibling — never `../`, never nested.
  if (pathPart.startsWith('./')) pathPart = pathPart.slice(2);
  if (!pathPart.endsWith('.md') || pathPart.includes('/')) return null;

  const slug = decodeURIComponent(pathPart.slice(0, -3));
  if (!SLUG.test(slug)) return null;

  return { slug, hash };
}

/** Where an internal link points on the HTML surface. */
export const articleHref = (target: InternalTarget) => `/${target.slug}${target.hash}`;

/**
 * Extract every internal link target from raw markdown source.
 *
 * Used to build the link graph for backlinks and `/graph.json`. Code is stripped
 * first so a link inside a fenced block or `` `backtick span` `` is not counted
 * as a real edge.
 */
export function extractInternalLinks(markdown: string): InternalTarget[] {
  const prose = stripCode(stripFrontmatter(markdown));
  const found: InternalTarget[] = [];

  // Inline links and images: [text](dest) / [text](dest "title")
  const inline = /(!?)\[(?:[^\]\\]|\\.)*\]\(\s*(<[^>]*>|[^\s)]+)/g;
  for (const match of prose.matchAll(inline)) {
    if (match[1] === '!') continue; // an image, not a link
    const target = internalTarget(match[2]);
    if (target) found.push(target);
  }

  // Reference definitions: [id]: ./slug.md "title"
  const reference = /^[ ]{0,3}\[[^\]]+\]:[ \t]*(\S+)/gm;
  for (const match of prose.matchAll(reference)) {
    const target = internalTarget(match[1]);
    if (target) found.push(target);
  }

  return found;
}

function stripFrontmatter(markdown: string): string {
  return markdown.startsWith('---')
    ? markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    : markdown;
}

/** Blank out fenced blocks, indented code, and inline spans, preserving offsets. */
function stripCode(markdown: string): string {
  let out = markdown.replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n[ \t]*\2[^\n]*|$)/gm, (block) =>
    block.replace(/[^\n]/g, ' '),
  );
  out = out.replace(/(`+)(?:[^`]|(?!\1)`)*\1/g, (span) => span.replace(/[^\n]/g, ' '));
  return out;
}
