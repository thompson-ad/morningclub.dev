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
import type { Article, Bench } from './bench.ts';
import { SITE, commitsUrl, rawUrl, isoDay, BENCH_DIR } from './site.ts';

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
    const transition = entry.stage ? ` **${entry.stage} from here** — ` : ' ';
    return `- **${isoDay(entry.date)}** —${transition}${entry.note}`;
  });

  // The first pass closes the list; we assert only what we know, so no stage is
  // claimed for it unless a changelog entry recorded one.
  events.push(`- **${isoDay(article.created)}** — first cut.`);

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
    '> What each pass at this article changed, and why. The curated notes below are',
    '> the record; the raw git history linked at the bottom is the drill-down.',
    '> Entries are newest first, and record changes in the thinking rather than in',
    '> the prose.',
    '',
    '## Passes',
    '',
    ...events,
    '',
    '## Raw history',
    '',
    `Every revision of this article is a commit against \`${BENCH_DIR}/${article.slug}.md\`:`,
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
export function llmsIndex(bench: Bench): string {
  const articles = bench.articles.map(
    (article) =>
      `- [${article.title}](${sourceUrl(article.slug)}): ${article.description} — ` +
      `${article.stage}, updated ${isoDay(article.updated)}`,
  );

  return [
    `# ${SITE.name}`,
    '',
    `> ${SITE.tagline} Everything here is a working note kept at a permanent URL and`,
    '> honed in place, rather than superseded by a newer post. Each carries a stage —',
    '> rough (just off the saw), honed (taking an edge, still moving), or keen',
    '> (sharp, and kept that way) — saying how much weight to put on it today, and a',
    '> companion document at `<slug>/history.md` recording what each pass changed and',
    '> why. `updated` dates come from the last commit that touched the file, so they',
    '> are accurate rather than aspirational. The links below point at raw markdown.',
    '',
    '## Articles',
    '',
    ...articles,
    '',
    '## Whole bench',
    '',
    `- [llms-full.txt](${absolute('/llms-full.txt')}): every article above concatenated into one fetch.`,
    `- [graph.json](${absolute('/graph.json')}): the link graph between articles, as nodes and edges.`,
    `- [rss.xml](${absolute('/rss.xml')}): the feed, ordered by when each article was last honed.`,
    '',
    '## Optional',
    '',
    `- [Source repository](${`https://github.com/${SITE.repo.owner}/${SITE.repo.name}`}): full public history of every article.`,
    '',
  ].join('\n');
}

/**
 * The entire bench in one fetch, newest first.
 *
 * The header dates the *corpus*, not the build. Stamping build time here would
 * make a no-op rebuild change a date, which is exactly the dishonesty NFR-5
 * exists to prevent — so we report when the content last actually changed.
 */
export function llmsFull(bench: Bench): string {
  const { articles } = bench;
  const lastChanged = articles[0]?.updated;

  const header = [
    `# ${SITE.name} — complete bench`,
    '',
    `> ${SITE.tagline} This file is every article on the bench, concatenated,`,
    '> ordered by when each was last honed (most recent first). Each article is',
    '> preceded by a metadata block giving its canonical URL, stage and dates.',
    '',
    `Articles: ${articles.length}`,
    ...(lastChanged ? [`Bench last changed: ${isoDay(lastChanged)}`] : []),
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
export function graphExport(bench: Bench) {
  return {
    nodes: bench.articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      stage: article.stage,
      updated: isoDay(article.updated),
      url: articleUrl(article.slug),
      source: sourceUrl(article.slug),
    })),
    edges: bench.edges,
  };
}
