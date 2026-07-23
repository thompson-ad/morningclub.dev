# morningclub.dev

A living digital garden. Markdown articles that start rough and get revised in
place, public from the moment they exist.

**Site:** <https://morningclub.dev>

Every article lives at a permanent URL and carries a *stage* — seedling
(rough), budding (a real position, still moving), evergreen (settled) — plus a
curated record of how the thinking changed. Nothing here is "finished"; the
directory is called `drafts/` to keep that honest.

## For agents and LLMs

Start at **<https://morningclub.dev/llms.txt>**. It indexes every article as
raw markdown with its stage and last-tended date.

| Surface | What it is |
|---|---|
| `/llms.txt` | Index of every article, linking to raw markdown |
| `/llms-full.txt` | The entire corpus in one fetch |
| `/<slug>.md` | One article's actual source, frontmatter included |
| `/<slug>/history.md` | How that article's thinking changed, with links into git history |
| `/graph.json` | The link graph between articles (nodes and edges) |
| `/rss.xml` | Full-content feed, ordered by last tended |

Crawling and training are explicitly welcome — see [robots.txt](public/robots.txt).

`updated` dates come from the last git commit that touched each file, never
from build time, so freshness signals here are accurate rather than decorative.

## Writing

Articles are plain CommonMark + GFM in [`drafts/`](drafts/), one file per
article, filename is the slug. Publishing is a push:

```bash
git add drafts/some-idea.md && git commit -m "plant" && git push
```

See [AUTHORING.md](AUTHORING.md) for the writing guidance, frontmatter schema,
and cross-linking conventions.

## Developing

```bash
npm ci && npm run dev
```

Built with [Astro](https://astro.build) as a fully static site with zero client
JavaScript. `npm run build` produces `dist/`; a frontmatter schema violation
fails the build rather than the site.

- `drafts/` — every article, flat
- `images/` — article images, referenced root-relative as `/images/x.png`
- `src/lib/` — the garden model: git dates, link graph, agent surfaces
- `scripts/subset-fonts.sh` — regenerates the two Literata subsets (outputs are
  committed; the build needs no Python)

Deploys to Cloudflare Pages from `main` via GitHub Actions. One-time platform
setup is documented in [MANUAL-SETUP.md](MANUAL-SETUP.md).

> [!IMPORTANT]
> This repository is public and its history is permanent — the evolution
> surface depends on commit SHAs staying valid. Nothing private, no secrets, no
> unpublished personal notes.

## Licence

Prose is © Aaron Thompson, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) —
quote and cite freely, attribution appreciated. Site code is MIT.
Literata is licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/).
