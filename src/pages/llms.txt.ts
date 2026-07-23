/**
 * `/llms.txt` — the index for agents pointed at this site (FR-4).
 *
 * Mass crawlers demonstrably don't fetch these; the population that does is
 * pointed agents and IDE tools, which is exactly this site's second audience.
 */
import type { APIRoute } from 'astro';
import { loadBench } from '../lib/bench.ts';
import { llmsIndex } from '../lib/agent-surface.ts';

export const GET: APIRoute = async () =>
  new Response(llmsIndex(await loadBench()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
