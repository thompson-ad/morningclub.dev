/**
 * The surfaces built for agents rather than browsers (FR-4, FR-5).
 *
 * The contract these keep is byte-faithfulness (NFR-7): a `.md` sibling is the
 * source file exactly as authored, with a few build-derived frontmatter keys
 * added. Nothing in the body is rewritten — no entity escaping, no link
 * rewriting, no template residue — because the whole value of the raw surface
 * is that it is the real thing.
 */
import { readFileSync } from 'node:fs';
import type { Article, Garden } from './garden.ts';
import { SITE, commitsUrl, rawUrl, isoDay, DRAFTS_DIR } from './site.ts';

const absolute = (path: string) => new URL(path, SITE.url).href;

export const articleUrl = (slug: string) => absolute(`/${slug}`);
export const sourceUrl = (slug: string) => absolute(`/${slug}.md`);
export const historyUrl = (slug: string) => absolute(`/${slug}/history.md`);

/** Double-quoted YAML scalar — URLs carry colons, so never emit them bare. */
const yamlString = (value: string) => `"${value.replace(/["\\]/g, '\\$&')}"`;

/**
 * The raw markdown sibling: the source file, plus the metadata an agent can't
 * derive for itself (the git-derived date, where this lives canonically, where
 * its history is, and who links to it).
 */
export function rawSibling(article: Article): string {
  const source = readFileSync(article.filePath, 'utf8');

  const injected = [
    `updated: ${isoDay(article.updated)}`,
    `canonical: ${yamlString(articleUrl(article.slug))}`,
    `history: ${yamlString(historyUrl(article.slug))}`,
    `linked_from: [${article.backlinks.join(', ')}]`,
  ];

  // Splice the derived keys into the existing frontmatter block, leaving the
  // authored keys and the entire body untouched.
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n)/);
  if (!match) {
    // No frontmatter (schema validation should have caught this) — prepend one.
    return `---\n${injected.join('\n')}\n---\n\n${source}`;
  }

  const [block, authored, newline] = match;
  const rebuilt = `---${newline}${authored}${newline}${injected.join(newline)}${newline}---${newline}`;
  return rebuilt + source.slice(block.length);
}

/**
 * One article's evolution, as a document an agent can read in a single fetch.
 *
 * The curated changelog is the layer of record; raw git history is the
 * drill-down beneath it. Commit hygiene is explicitly not required — messy
 * commits are fine, because the changelog carries the signal.
 */
export function historyDocument(article: Article): string {
  const events = article.changelog.map((entry) => {
    const transition = entry.stage ? ` **became ${entry.stage}** — ` : ' ';
    return `- **${isoDay(entry.date)}** —${transition}${entry.note}`;
  });

  // The planting event closes the list; we assert only what we know, so no
  // stage is claimed for it unless a changelog entry recorded one.
  events.push(`- **${isoDay(article.created)}** — planted.`);

  const lines = [
    '---',
    `title: ${yamlString(`History — ${article.title}`)}`,
    `article: ${yamlString(articleUrl(article.slug))}`,
    `source: ${yamlString(sourceUrl(article.slug))}`,
    `stage: ${article.stage}`,
    `created: ${isoDay(article.created)}`,
    `updated: ${isoDay(article.updated)}`,
    '---',
    '',
    `# History — ${article.title}`,
    '',
    '> How this article changed, and why. The curated notes below are the record;',
    '> the raw git history linked at the bottom is the drill-down. Entries are',
    '> newest first, and record changes in the thinking rather than in the prose.',
    '',
    '## Changes',
    '',
    ...events,
    '',
    '## Raw history',
    '',
    `Every revision of this article is a commit against \`${DRAFTS_DIR}/${article.slug}.md\`:`,
    '',
    `<${commitsUrl(article.slug)}>`,
    '',
    'Any historical version can be fetched directly at the commit that produced it:',
    '',
    '```',
    rawUrl(article.slug),
    '```',
    '',
    `Substitute a full commit sha for \`<commit-sha>\`. The current version is always`,
    `at <${sourceUrl(article.slug)}>.`,
    '',
  ];

  return lines.join('\n');
}

/**
 * The index an agent is pointed at (FR-4), in the shape the llms.txt convention
 * specifies: H1, a blockquote of orientation, then H2 link sections. Links point
 * at the `.md` sources rather than the HTML, so following one lands in markdown.
 */
export function llmsIndex(garden: Garden): string {
  const articles = garden.articles.map(
    (article) =>
      `- [${article.title}](${sourceUrl(article.slug)}): ${article.description} — ` +
      `${article.stage}, updated ${isoDay(article.updated)}`,
  );

  return [
    `# ${SITE.name}`,
    '',
    `> ${SITE.tagline} Every article here is a living document, revised in place at a`,
    '> permanent URL rather than superseded by a newer post. Each carries a stage —',
    '> seedling (rough), budding (a real position, still moving), or evergreen',
    '> (settled) — saying how much weight to put on it today, and a companion',
    '> document at `<slug>/history.md` recording how the thinking changed and why.',
    '> `updated` dates come from the last commit that touched the file, so they are',
    '> accurate rather than aspirational. The links below point at raw markdown.',
    '',
    '## Articles',
    '',
    ...articles,
    '',
    '## Whole corpus',
    '',
    `- [llms-full.txt](${absolute('/llms-full.txt')}): every article above concatenated into one fetch.`,
    `- [graph.json](${absolute('/graph.json')}): the link graph between articles, as nodes and edges.`,
    `- [rss.xml](${absolute('/rss.xml')}): the feed, ordered by when each article was last tended.`,
    '',
    '## Optional',
    '',
    `- [Source repository](${`https://github.com/${SITE.repo.owner}/${SITE.repo.name}`}): full public history of every article.`,
    '',
  ].join('\n');
}

/**
 * The entire corpus in one fetch, newest first.
 *
 * The header dates the *corpus*, not the build. Stamping build time here would
 * make a no-op rebuild change a date, which is exactly the dishonesty NFR-5
 * exists to prevent — so we report when the content last actually changed.
 */
export function llmsFull(garden: Garden): string {
  const { articles } = garden;
  const lastChanged = articles[0]?.updated;

  const header = [
    `# ${SITE.name} — complete corpus`,
    '',
    `> ${SITE.tagline} This file is every article in the garden, concatenated,`,
    '> ordered by when each was last tended (most recent first). Each article is',
    '> preceded by a metadata block giving its canonical URL, stage and dates.',
    '',
    `Articles: ${articles.length}`,
    ...(lastChanged ? [`Corpus last changed: ${isoDay(lastChanged)}`] : []),
    '',
  ];

  const bodies = articles.map((article) =>
    [
      '',
      '='.repeat(72),
      `Title:     ${article.title}`,
      `URL:       ${articleUrl(article.slug)}`,
      `Source:    ${sourceUrl(article.slug)}`,
      `History:   ${historyUrl(article.slug)}`,
      `Stage:     ${article.stage}`,
      `Created:   ${isoDay(article.created)}`,
      `Updated:   ${isoDay(article.updated)}`,
      '='.repeat(72),
      '',
      readFileSync(article.filePath, 'utf8').trimEnd(),
      '',
    ].join('\n'),
  );

  return header.join('\n') + bodies.join('\n');
}

/** The link graph, for agents that want the shape of the network (FR-7). */
export function graphExport(garden: Garden) {
  return {
    nodes: garden.articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      stage: article.stage,
      updated: isoDay(article.updated),
      url: articleUrl(article.slug),
      source: sourceUrl(article.slug),
    })),
    edges: garden.edges,
  };
}
