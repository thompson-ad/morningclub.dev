/**
 * Per-article evolution at `/<slug>/history.md` (FR-5).
 *
 * The capability this exists for: an agent being able to answer "how has Aaron's
 * thinking on this changed?" — from a curated record, with a pointer down into
 * raw git history for anyone who wants the receipts.
 */
import type { APIRoute } from 'astro';
import { loadBench, type Article } from '../../lib/bench.ts';
import { historyDocument } from '../../lib/agent-surface.ts';

export async function getStaticPaths() {
  const { articles } = await loadBench();
  return articles.map((article) => ({
    params: { slug: article.slug },
    props: { article },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(historyDocument(props.article as Article), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
