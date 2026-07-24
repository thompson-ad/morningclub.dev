import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { readdirSync, readFileSync, existsSync, cpSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { internalLinks, imageAttributes, warnings } from './src/markdown/plugins.ts';
import { gitUpdated } from './src/lib/git.ts';
import { SITE, NOTES_DIR, isoDay } from './src/lib/site.ts';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)));

/**
 * slug → last-commit date, read straight from git.
 *
 * The sitemap integration can't infer per-page dates, and build time is not an
 * honest answer (NFR-5), so we hand it the same git-derived dates every other
 * surface uses. Computed here rather than from the content collection because
 * astro.config runs before collections are available.
 */
function updatedBySlug(): Map<string, Date> {
  const dir = path.join(ROOT, NOTES_DIR);
  const dates = new Map<string, Date>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    dates.set(name.slice(0, -3), gitUpdated(path.join(dir, name)));
  }
  return dates;
}

const IMAGE_MIME: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const mimeFor = (file: string) =>
  IMAGE_MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';

/**
 * Serves images/ in dev, copies it to dist/ at build, and prints the warnings
 * the markdown plugins collected.
 *
 * Images live at the repo root and are referenced root-relative (`/images/x.png`)
 * so the one authored form resolves identically on GitHub, on the HTML page and
 * in the raw .md sibling (FR-8). They deliberately skip Astro's optimizer, which
 * would rewrite them to hashed /_astro/ paths and break that parity (NFR-7).
 */
const site = () => ({
  name: 'site',
  hooks: {
    'astro:server:setup': ({ server }: { server: { middlewares: any } }) => {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const url: string = req.url ?? '';
        if (!url.startsWith('/images/')) return next();
        const rel = decodeURIComponent(url.split('?')[0]).replace(/^\/+/, '');
        // Refuse anything that climbs out of images/.
        const abs = path.join(ROOT, rel);
        if (!abs.startsWith(path.join(ROOT, 'images') + path.sep)) return next();
        try {
          const body = readFileSync(abs);
          res.setHeader('Content-Type', mimeFor(abs));
          res.end(body);
        } catch {
          next();
        }
      });
    },

    'astro:build:done': ({
      dir,
      logger,
    }: {
      dir: URL;
      logger: { warn: (m: string) => void };
    }) => {
      const from = path.join(ROOT, 'images');
      if (existsSync(from)) {
        cpSync(from, path.join(fileURLToPath(dir), 'images'), { recursive: true });
      }
      if (warnings.dangling.size > 0) {
        // Not an error: linking to a piece you haven't cut yet is normal.
        // This list doubles as the to-write queue.
        const lines = [...warnings.dangling.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([from, targets]) => `  ${from} → ${[...targets].sort().join(', ')}`);
        logger.warn(`Dangling internal links (articles not written yet):\n${lines.join('\n')}`);
      }
      if (warnings.images.size > 0) {
        logger.warn(`Image issues:\n${[...warnings.images].map((w) => `  ${w}`).join('\n')}`);
      }
    },
  },
});

export default defineConfig({
  site: SITE.url,
  output: 'static',

  // `/slug` and `/slug.md` need to sit as clean sibling URLs (FR-6).
  trailingSlash: 'never',
  build: { format: 'file' },

  markdown: {
    processor: satteri({
      mdastPlugins: [internalLinks()],
      hastPlugins: [imageAttributes()],
    }),
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Literata',
      cssVariable: '--font-literata',
      // Subsetted ahead of time by scripts/subset-fonts.sh, retaining the opsz
      // axis so the same family reads well from caption to title size (§6.1).
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/literata-roman.woff2'],
            weight: '400 560',
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/literata-italic.woff2'],
            weight: '400 425',
            style: 'italic',
          },
        ],
      },
      display: 'swap',
      fallbacks: ['Charter', 'Georgia', 'serif'],
    },
  ],

  vite: {
    // Build-time code that reads git and image bytes is bundled into dist/,
    // where import.meta.url no longer points at the repo. Bake the root in.
    define: { __REPO_ROOT__: JSON.stringify(ROOT) },
  },

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const slug = new URL(item.url).pathname.replace(/^\/|\/$/g, '');
        const updated = updatedBySlug().get(slug);
        if (updated) item.lastmod = isoDay(updated);
        return item;
      },
    }),
    site(),
  ],
});
