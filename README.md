# morningclub.dev

A working bench. Ideas arrive rough, get honed against real work, and stay sharp
only because I keep coming back to them.

**Site:** <https://morningclub.dev>

This is the public bench for [Morning Club](https://github.com/thompson-ad/morning-club) —
a project about staying sharp as an engineer while agents do the typing. Every
article lives at a permanent URL and carries a *stage* — rough (just off the
saw), honed (taking an edge, still moving), keen (sharp, and kept that way) —
plus a record of what each pass changed. Nothing here is finished; that isn't a
state a blade has.

## For agents and LLMs

Start at **<https://morningclub.dev/llms.txt>**. It indexes every article as raw
markdown with its stage and last-honed date.

| Surface | What it is |
|---|---|
| `/llms.txt` | Index of every article, linking to raw markdown |
| `/llms-full.txt` | The entire bench in one fetch |
| `/<slug>.md` | One article's actual source, frontmatter included |
| `/<slug>/history.md` | What each pass at that article changed, with links into git history |
| `/graph.json` | The link graph between articles (nodes and edges) |
| `/rss.xml` | Full-content feed, ordered by last honed |

Crawling and training are explicitly welcome — see [robots.txt](public/robots.txt).

`updated` dates come from the last git commit that touched each file, never from
build time, so freshness signals here are accurate rather than decorative.

## Writing

Articles are plain CommonMark + GFM in [`bench/`](bench/), one file per article,
filename is the slug. Publishing is a push:

```bash
git add bench/some-idea.md && git commit -m "another pass" && git push
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

- `bench/` — every article, flat
- `images/` — article images, referenced root-relative as `/images/x.png`
- `src/lib/` — the bench model: git dates, link graph, agent surfaces
- `scripts/subset-fonts.sh` — regenerates the two Literata subsets (outputs are
  committed; the build needs no Python)
- `scripts/verify.sh` — the acceptance suite, runnable against any base URL

Deploys to Cloudflare Pages from `main` via GitHub Actions. One-time platform
setup is documented in [MANUAL-SETUP.md](MANUAL-SETUP.md).

> [!IMPORTANT]
> This repository is public and its history is permanent — the history surface
> depends on commit SHAs staying valid. Nothing private, no secrets, no
> unpublished personal notes.

## Licence

Prose is © Aaron Thompson, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) —
quote and cite freely, attribution appreciated. Site code is MIT.
Literata is licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/).
