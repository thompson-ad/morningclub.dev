---
title: "Make publishing boring so honing stays cheap"
description: "If publishing costs anything — a review step, a checklist, a deploy you have to babysit — you will unconsciously batch it, and batching is what kills revision."
created: 2026-07-02
stage: exploratory
tags: [writing, tools, publishing]
changelog:
  - date: 2026-07-20
    note: "Realised the argument isn't about speed at all. A five-minute publish is fine; a five-minute publish that requires a decision is not. The cost that matters is the deciding, not the waiting."
---

Publishing should cost one `git push` and nothing else. Not because speed
matters, but because every gate you put in front of publishing gets paid *again*
on every revision — and revision is the whole point.

## The asymmetry nobody accounts for

A publishing checklist gets designed around the first publish. Pick a title,
write a summary, choose a category, preview it, ship it. That's a reasonable
five minutes for a finished essay.

But the first publish is the cheapest thing that will ever happen to an article
here. If coming back to it three months later means re-running that same
checklist, the checklist is now a tax on exactly the behaviour the whole model
depends on. You will pay it once or twice and then quietly stop.

So the test for any piece of publishing machinery is not "how long does the first
publish take?" It's "what does the four-hundredth pass cost?"

## What that ruled out

Working backwards from that test removed most of the obvious choices:

- **No CMS.** A CMS puts a UI between me and the text. The text is a file; I
  already have an editor.
- **No draft state.** A draft/published boundary is a decision, and decisions are
  the expensive part. Everything here is public from the moment it exists; the
  stage field carries the "how sharp is this" signal instead.
- **No manual dates.** An `updated` field in frontmatter is a thing you can
  forget, and a date you can forget is a date nobody should trust. It comes from
  the last commit that touched the file, so it cannot be wrong.

```bash
# the entire publishing pipeline
git add notes/some-idea.md && git commit -m "another pass" && git push
```

## Where the cost actually went

It didn't disappear — it moved into the build. Deriving dates from git,
inverting the link graph for backlinks, generating the raw markdown siblings and
the history documents: all of that is real complexity, and it all runs unattended
on every push.

That's the trade I wanted. Machinery that runs without me is cheap forever.
Machinery that needs a decision from me is expensive every single time.

This is the mechanical half of the argument in
[sharpening is a publishing model](./example-article.md) — that one makes the
case for correcting in place, and this one is about making sure it stays free.
