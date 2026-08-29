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
---
```

That's the whole contract. It's the same on the day you cut the file and on the
twentieth pass over it — there is nothing to add when you come back.

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `description` | yes | ≤ 200 characters. It's the standfirst, the meta description, and the llms.txt line — write it as a real sentence. |
| `created` | yes | The date the idea was first written. |
| `stage` | yes | `exploratory` \| `developing` \| `established` (see Stages below) |
| `tags` | no | lowercase kebab-case |
| `seeds` | no | Brain citations (`file.md#key`) when the essay began as a Morning Club question — see below. |

There is **no `updated` field** — it's derived from the last git commit that
touched the file. A date you can forget to update is a date nobody should trust,
so it isn't yours to write.

The schema is enforced at build time, and it's strict: a typo, or a key that
isn't in the table above, fails `npm run build` naming the file and the key. It
can't reach the live site.

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

### History

There's nothing to write. The record of how an article changed is its commit
log, and every article publishes a `<slug>/history.md` alongside its source
pointing an agent at it — the full log, plus how to fetch any version that has
ever existed. Both are automatic.

That puts the weight on commit messages, which are now the only prose about what
a pass changed. Say what changed in the *thinking* where there's something to
say; nobody is checking, and a bare "another pass" is fine when there isn't.

## Essays seeded by Morning Club

Some essays start from a monthly question delivered by the Morning Club essays
routine (`morning-club` repo, `essays/`). The email names an entry-point unit
under the question and a handful of trailheads; those citations are the seeds.
When drafting or publishing one:

- carry the citations in frontmatter — `seeds: ["human-centered-code.md#connascence"]`
- append a completion line to `~/code/morning-club/essays/log.md`:
  `YYYY-MM-DD | written | hub:<file.md#key> | <note slug>`

The question is usually the title, and the slug follows from it. Neither field is
rendered — the `seeds` array exists so the routine can see which questions became
essays, and which shapes have stopped earning their place. The `written` line is
appended by hand from a local session, because the routine's cloud environment
only ever has the `morning-club` repo.

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
