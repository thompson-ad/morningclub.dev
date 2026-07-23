/**
 * The bench, assembled once and shared by every surface.
 *
 * One markdown file produces an HTML page, a raw `.md` sibling, an llms.txt
 * entry, a history document, an RSS item, a sitemap entry and a graph node.
 * They all read from here, so none of them can disagree about a date, a stage,
 * or who links to whom.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import path from 'node:path';
import { gitUpdated } from './git.ts';
import { extractInternalLinks } from './links.ts';
import { BENCH_DIR, ROOT, type Stage } from './site.ts';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ChangelogEntry {
  date: Date;
  note: string;
  stage?: Stage;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  /** When the idea first hit the bench. */
  created: Date;
  /** Derived from the file's last commit, never from frontmatter (NFR-5). */
  updated: Date;
  stage: Stage;
  tags: string[];
  /** Newest first. */
  changelog: ChangelogEntry[];
  /** The raw markdown source, exactly as authored. */
  body: string;
  /** Absolute path to the source file. */
  filePath: string;
  /** Slugs this article links to that exist. */
  links: string[];
  /** Slugs this article links to that don't exist yet — the to-write queue. */
  dangling: string[];
  /** Slugs that link here. */
  backlinks: string[];
  entry: CollectionEntry<'bench'>;
}

export interface Bench {
  /** Every article, most recently honed first. */
  articles: Article[];
  bySlug: Map<string, Article>;
  /** Every resolved internal link, for /graph.json. */
  edges: Array<{ from: string; to: string }>;
  /** Dangling links across the whole bench, for the build-log warning. */
  dangling: Array<{ from: string; to: string }>;
}

let cached: Promise<Bench> | undefined;

/** Memoised: the git and filesystem work happens once per build, not per page. */
export function loadBench(): Promise<Bench> {
  cached ??= build();
  return cached;
}

async function build(): Promise<Bench> {
  const entries = await getCollection('bench');

  const slugs = new Set(entries.map((entry) => entry.id));
  const articles: Article[] = entries.map((entry) => {
    if (!SLUG.test(entry.id)) {
      throw new Error(
        `Invalid slug "${entry.id}" in ${BENCH_DIR}/ — slugs are permanent public ` +
          `URLs and must be lowercase kebab-case (a-z, 0-9, -).`,
      );
    }

    const filePath = path.join(ROOT, BENCH_DIR, `${entry.id}.md`);
    const body = entry.body ?? '';

    // Resolve this article's outbound links once, splitting live from dangling.
    const links = new Set<string>();
    const dangling = new Set<string>();
    for (const target of extractInternalLinks(body)) {
      if (target.slug === entry.id) continue; // self-links aren't edges
      (slugs.has(target.slug) ? links : dangling).add(target.slug);
    }

    return {
      slug: entry.id,
      title: entry.data.title,
      description: entry.data.description,
      created: entry.data.created,
      updated: gitUpdated(filePath),
      stage: entry.data.stage,
      tags: entry.data.tags,
      changelog: [...entry.data.changelog].sort(
        (a, b) => b.date.getTime() - a.date.getTime(),
      ),
      body,
      filePath,
      links: [...links].sort(),
      dangling: [...dangling].sort(),
      backlinks: [],
      entry,
    };
  });

  articles.sort((a, b) => b.updated.getTime() - a.updated.getTime());

  const bySlug = new Map(articles.map((article) => [article.slug, article]));

  // Invert the link graph. Backlinks follow the same `updated`-desc order as
  // everything else, so "Linked from" reads most-recently-honed first.
  for (const article of articles) {
    for (const target of article.links) {
      bySlug.get(target)?.backlinks.push(article.slug);
    }
  }

  const edges = articles.flatMap((article) =>
    article.links.map((to) => ({ from: article.slug, to })),
  );
  const danglingAll = articles.flatMap((article) =>
    article.dangling.map((to) => ({ from: article.slug, to })),
  );

  return { articles, bySlug, edges, dangling: danglingAll };
}

/** Resolve slugs to articles, preserving the bench's `updated`-desc order. */
export function resolve(bench: Bench, slugs: string[]): Article[] {
  const wanted = new Set(slugs);
  return bench.articles.filter((article) => wanted.has(article.slug));
}
