# morningclub.dev

Working notes on software and craft — revised in place and kept at permanent
URLs, so the current best version always lives at the same address.

**Site:** <https://morningclub.dev>

This is the public companion to [Morning Club](https://github.com/thompson-ad/morning-club) —
a project about staying sharp as an engineer while agents do the typing. Every
article lives at a permanent URL and carries a *stage* — exploratory, developing
or established — saying how much weight to give it today, plus a record of what
each revision changed. Nothing here is finished; revising in place is the point.

## For agents and LLMs

Start at **<https://morningclub.dev/llms.txt>**. It indexes every article as raw
markdown with its stage and last-revised date.

| Surface | What it is |
|---|---|
| `/llms.txt` | Index of every article, linking to raw markdown |
| `/llms-full.txt` | The entire corpus in one fetch |
| `/<slug>.md` | One article's actual source, frontmatter included |
| `/<slug>/history.md` | What each revision of that article changed, with links into git history |
| `/graph.json` | The link graph between articles (nodes and edges) |
| `/rss.xml` | Full-content feed, ordered by last revised |

Crawling and training are explicitly welcome — see [robots.txt](public/robots.txt).

`updated` dates come from the last git commit that touched each file, never from
build time, so freshness signals here are accurate rather than decorative.

## Writing

Articles are plain CommonMark + GFM in [`notes/`](notes/), one file per article,
filename is the slug. Publishing is a push:

```bash
git add notes/some-idea.md && git commit -m "another pass" && git push
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

- `notes/` — every article, flat
- `images/` — article images, referenced root-relative as `/images/x.png`
- `src/lib/` — the neutral domain: git dates, link graph, corpus, agent surfaces
- `src/lib/lexicon.ts` — **the one place the metaphor lives.** Stages are stored
  neutrally (`exploratory` / `developing` / `established`) and the code speaks of
  a corpus of notes; the presentation skin — the stage display labels, the date
  labels, the byline — is applied only at the rendered HTML, from here.
  Changing the metaphor is an edit to that one file plus, if you like, the stages
  diagram and any article whose prose is about it.
- `scripts/subset-fonts.sh` — regenerates the two Literata subsets (outputs are
  committed; the build needs no Python)
- `scripts/verify.sh` — local acceptance suite (build correctness; uses the
  local-only `example-*` fixtures, run against `npm run preview`)
- `scripts/healthcheck.sh` — live-domain health check (site, DNS, **email**,
  redirect, headers) — run against production any time

Deploys to Cloudflare Pages from `main` via GitHub Actions — a push publishes.
How it's wired, how to publish, and how to run the health checks live in
[MANUAL-SETUP.md](MANUAL-SETUP.md).

> [!IMPORTANT]
> This repository is public and its history is permanent — the history surface
> depends on commit SHAs staying valid. Nothing private, no secrets, no
> unpublished personal notes.

## Licence

Prose is © Aaron Thompson, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) —
quote and cite freely, attribution appreciated. Site code is MIT.
Literata is licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/).
