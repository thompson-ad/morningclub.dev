/**
 * `/graph.json` — the article network as data (FR-7).
 *
 * No visual graph in v1, but the data layer ships now so adding one later is a
 * purely presentational change that touches no content.
 */
import type { APIRoute } from 'astro';
import { loadGarden } from '../lib/garden.ts';
import { graphExport } from '../lib/agent-surface.ts';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(graphExport(await loadGarden()), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
