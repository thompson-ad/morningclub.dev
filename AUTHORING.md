# Authoring

How to write here, and why the conventions are what they are.

## The shape of an article

One file per article, flat in `notes/`, filename is the slug:

```
notes/spaced-repetition-forcing-function.md  →  https://morningclub.dev/spaced-repetition-forcing-function
```

**Slugs are permanent.** They're what citations, training corpora and agents hold
onto. Prefer a concept-named slug (`spaced-repetition-forcing-function`) over a
clever title that will churn. Renaming one means shipping a 301 in
`public/_redirects` in the same commit, and that entry never gets removed.

Slugs are lowercase kebab-case: `a-z`, `0-9`, `-`.

## Frontmatter

```yaml
---
title: "Spaced repetition is a forcing function, not a memory trick"
description: "One-sentence summary used in indexes, meta tags and llms.txt."
created: 2026-07-22
stage: exploratory
tags: [learning, practice]
changelog:
  - date: 2026-08-10
    note: "Reversed the core claim after testing against three months of review data."
    stage: developing
---
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `description` | yes | ≤ 200 characters. It's the standfirst, the meta description, and the llms.txt line — write it as a real sentence. |
| `created` | yes | The date the idea was first written. |
| `stage` | yes | `exploratory` \| `developing` \| `established` (see Stages below) |
| `tags` | no | lowercase kebab-case |
| `changelog` | no | See below. |

There is **no `updated` field** — it's derived from the last git commit that
touched the file. A date you can forget to update is a date nobody should trust,
so it isn't yours to write.

The schema is enforced at build time. A typo fails `npm run build` naming the
file and the field; it can't reach the live site.

### Stages

You store one of three values. Each is an epistemic claim — how much weight a
reader should give the piece today, not a measure of effort spent:

- **`exploratory`** — thinking out loud, might be wrong.
- **`developing`** — a real position, argued, but still moving.
- **`established`** — settled; you'd defend it.

Plenty of ideas deserve to sit at `exploratory` forever. Don't add new stages —
these three are the permanent frontmatter contract (they appear byte-for-byte in
every `.md` sibling, llms.txt and the graph). The site renders each with a
display label defined in `src/lib/lexicon.ts`; write the neutral value, never the
label.

### The changelog

This is the layer of record, and arguably the most valuable thing on the site:
anyone can tell you what they think, few can show you what they used to think and
what moved them.

Record changes **in the thinking**, not in the prose:

```yaml
changelog:
  # good — says what changed and why
  - date: 2026-08-10
    note: "Reversed the core claim. Three months of review data showed the effect I attributed to spacing was mostly retrieval difficulty."
    stage: developing

  # noise — don't
  - date: 2026-08-11
    note: "Fixed typos, tightened intro."
```

Add a `stage:` key only when that pass changed the stage. Together with the
current `stage`, those entries reconstruct the whole timeline.

Commit hygiene is *not* required. Messy commits are fine — the changelog is the
signal, and raw git history is just the drill-down beneath it.

## Cross-linking

Link to another article with a **relative link to the sibling file**:

```markdown
Spacing works because it's a [forcing function](./spaced-repetition.md).
```

That one form resolves everywhere: on GitHub (file to file), in the raw `.md`
siblings an agent is reading (`./b.md` → `/b.md`, so it can walk the network
without leaving markdown), and on the HTML page (rewritten to
`/spaced-repetition` at build).

- **Link liberally**, including to articles you haven't cut yet. Dangling links
  don't fail the build — they render as plain text and the build prints them as
  your to-write queue.
- **No `[[wikilinks]]`.** Dead syntax on GitHub, non-standard in the raw
  siblings.
- Backlinks are automatic: every article's page lists what links to it.

## Images

Store them in `images/` at the repo root, reference them root-relative:

```markdown
![A line chart showing review accuracy climbing from 60% to 88% over twelve weeks.](/images/review-accuracy.png)

*Accuracy across twelve weeks of daily reviews.*
```

- **Alt text is required on every image.** It is the machine surface — crawlers
  and most agents read the alt, never the bytes. One sentence describing what the
  image shows. The build warns when it's missing.
- An italic paragraph immediately after an image renders as its caption.
- Pre-optimise: ≤ 1600 px wide, WebP/AVIF/JPEG for photos, SVG for diagrams. The
  build warns above 500 KB. There is no optimisation pipeline, deliberately — it
  would rewrite image URLs and break parity between the HTML and the `.md`.

## Plain markdown only

CommonMark + GFM. **No MDX, no components.** The raw `.md` sibling has to be the
actual source — the moment one article uses a component, that stops being true
and the agent surface starts lying.

## Writing for retrieval

Evidence-backed practices for work that gets found and cited:

- **Front-load the answer.** The first paragraph states the claim. Sections
  should be self-contained enough to be quoted alone, because that's how they'll
  be extracted.
- **Be concrete.** Statistics, direct quotations and citations to primary sources
  measurably increase how often generative engines cite a page. Link out
  liberally.
- **Phrase headings as the questions people actually ask.**
- **Come back to things.** Another pass is distribution, not housekeeping —
  recently updated content earns several times more AI citations than stale
  content. Revising an old article is often worth more than writing a new one.
- **One idea per article.** Link between articles rather than nesting ideas
  inside one.

## Publishing

```bash
git add notes/some-idea.md && git commit -m "another pass" && git push
```

CI builds and deploys. There is no draft state, no review step, and no preview
environment — everything is public from the moment it exists, and the stage field
carries the "how settled is this" signal instead.

Local preview:

```bash
npm run dev
```
