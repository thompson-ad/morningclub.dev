/**
 * `/llms-full.txt` — the whole corpus in one fetch (FR-4).
 *
 * For the reader who tells their agent "grab everything from the root": one
 * request, sized for a context window, no crawling required.
 */
import type { APIRoute } from 'astro';
import { loadCorpus } from '../lib/corpus.ts';
import { llmsFull } from '../lib/agent-surface.ts';

export const GET: APIRoute = async () =>
  new Response(llmsFull(await loadCorpus()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
