/**
 * `/rss.xml` — full content, latest 20 by `updated` (FR-3).
 *
 * Full content rather than summaries: a feed reader should be able to read the
 * article without a round trip. Ordered by when each was last tended, so a
 * substantially revised article legitimately resurfaces.
 *
 * This URL is permanent (§9.8).
 */
import rss from '@astrojs/rss';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { render } from 'astro:content';
import { loadGarden } from '../lib/garden.ts';
import { SITE } from '../lib/site.ts';

export async function GET() {
  const { articles } = await loadGarden();
  const container = await AstroContainer.create();

  const items = await Promise.all(
    articles.slice(0, 20).map(async (article) => {
      const { Content } = await render(article.entry);
      const html = await container.renderToString(Content);

      return {
        title: article.title,
        description: article.description,
        link: `/${article.slug}`,
        // The feed's date is the tended date — the thing that actually changed.
        pubDate: article.updated,
        categories: [article.stage, ...article.tags],
        content: html,
      };
    }),
  );

  return rss({
    title: SITE.name,
    description: SITE.tagline,
    site: SITE.url,
    items,
    // Citations and guids must match the canonical no-trailing-slash URLs (FR-6).
    trailingSlash: false,
    customData: '<language>en-gb</language>',
  });
}
