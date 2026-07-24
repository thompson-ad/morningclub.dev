/**
 * The raw markdown sibling at `/<slug>.md` (FR-4).
 *
 * This is the article's actual source, not a rendering of it — the surface a
 * pointed agent should be given when asked to summarise or quote the piece.
 */
import type { APIRoute } from 'astro';
import { loadCorpus, type Article } from '../lib/corpus.ts';
import { rawSibling } from '../lib/agent-surface.ts';

export async function getStaticPaths() {
  const { articles } = await loadCorpus();
  return articles.map((article) => ({
    params: { slug: article.slug },
    props: { article },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(rawSibling(props.article as Article), {
    // Static hosts serve by extension, so public/_headers is what actually
    // sets this in production; it is here so dev matches production.
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
