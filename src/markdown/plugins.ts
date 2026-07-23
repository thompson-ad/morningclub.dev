/**
 * Markdown pipeline plugins for the HTML surface (FR-7, FR-8).
 *
 * These run on Astro 7's native Sätteri processor and touch only the rendered
 * HTML — the markdown source is never rewritten, which is what keeps the `.md`
 * siblings byte-faithful (NFR-7).
 *
 *   - internalLinks:   `./other-slug.md` → `/other-slug`, and dangling links
 *                      degrade to plain text instead of failing the build.
 *   - imageAttributes: adds loading/decoding/width/height so images don't
 *                      shift the layout, and warns about missing alt text.
 */
import { defineMdastPlugin, defineHastPlugin } from 'satteri';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { internalTarget, articleHref } from '../lib/links.ts';
import { imageSize } from '../lib/imagesize.ts';
import { BENCH_DIR, ROOT } from '../lib/site.ts';

/** Build-log warnings, drained and printed once by the bench integration. */
export interface BuildWarnings {
  /** slug → the not-yet-written slugs it links to (the author's to-write list). */
  dangling: Map<string, Set<string>>;
  /** Human-readable image problems: missing alt, oversized files. */
  images: Set<string>;
}

export const warnings: BuildWarnings = {
  dangling: new Map(),
  images: new Set(),
};

/** Slugs that currently exist on the bench, re-read per compile so dev stays live. */
function existingSlugs(): Set<string> {
  try {
    return new Set(
      readdirSync(path.join(ROOT, BENCH_DIR))
        .filter((name) => name.endsWith('.md'))
        .map((name) => name.slice(0, -3)),
    );
  } catch {
    return new Set();
  }
}

function sourceSlug(fileURL: URL | undefined): string {
  if (!fileURL) return '(unknown)';
  return path.basename(fileURLToPath(fileURL), '.md');
}

/**
 * Rewrite sibling-file links to their HTML URLs.
 *
 * Linking to an article that doesn't exist yet is normal here, so a dangling
 * link is a warning and a plain-text render — never a build failure.
 */
export const internalLinks = () =>
  defineMdastPlugin({
    name: 'bench:internal-links',
    link(node, ctx) {
      const target = internalTarget(node.url);
      if (!target) return;

      if (existingSlugs().has(target.slug)) {
        ctx.setProperty(node, 'url', articleHref(target));
        return;
      }

      const from = sourceSlug(ctx.fileURL);
      const list = warnings.dangling.get(from) ?? new Set<string>();
      list.add(target.slug);
      warnings.dangling.set(from, list);

      // Unwrap to plain text: the words stay, the link affordance goes.
      ctx.replaceNode(node, { type: 'text', value: ctx.textContent(node) });
    },
  });

/**
 * Add the attributes that keep images cheap and stable, with dimensions probed
 * from the file at build time. Images stay at their authored `/images/...` URL
 * so the HTML page, the `.md` sibling, and GitHub all resolve them identically.
 */
export const imageAttributes = () =>
  defineHastPlugin({
    name: 'bench:image-attributes',
    element: {
      filter: ['img'],
      visit(node, ctx) {
        const properties = node.properties ?? {};
        const src = typeof properties.src === 'string' ? properties.src : '';
        const alt = typeof properties.alt === 'string' ? properties.alt : '';
        const from = sourceSlug(ctx.fileURL);

        // Alt text is the machine surface — crawlers and agents read it, not
        // the bytes. Its absence is a content bug, so say so.
        if (!alt.trim()) {
          warnings.images.add(`${from}: image \`${src || '(no src)'}\` has no alt text`);
        }

        if (properties.loading === undefined) ctx.setProperty(node, 'loading', 'lazy');
        if (properties.decoding === undefined) ctx.setProperty(node, 'decoding', 'async');

        if (!src.startsWith('/images/')) return;

        const absPath = path.join(ROOT, decodeURIComponent(src.slice(1)));

        // Real dimensions are what actually prevent layout shift; without the
        // optimizer we probe the file ourselves.
        const size = imageSize(absPath);
        if (size) {
          if (properties.width === undefined) ctx.setProperty(node, 'width', size.width);
          if (properties.height === undefined) ctx.setProperty(node, 'height', size.height);
        }

        try {
          const bytes = statSync(absPath).size;
          if (bytes > 500 * 1024) {
            warnings.images.add(
              `${from}: ${src} is ${Math.round(bytes / 1024)} KB — pre-optimise to under 500 KB`,
            );
          }
        } catch {
          warnings.images.add(`${from}: ${src} not found in images/`);
        }
      },
    },
  });
