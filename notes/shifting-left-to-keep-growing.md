---
title: "Shifting left to keep growing"
description: "My AI growth arc as an early senior engineer"
created: 2026-07-24
stage: developing
tags: [ai, growth, spec-driven-development, agentic-coding]
---

I've read a lot about how junior engineers will struggle to learn in the age of
AI. I've read much less about how mid to early-senior engineers will adapt to
keep growing. That's the bucket I'm in. I spent my junior years writing code by
hand, and my career has since been roughly equal parts with AI and without it.
This post is about my growth arc through the AI half, and my hope is that
sharing how I'm adapting helps anyone else in the same boat.

It's a crazy time to be a software engineer. In the last 18 months, I've had to
drop old beliefs and recipes for success and rebuild my mental model for
personal growth to keep up, adapt, and hopefully even stay ahead.

I career-switched when bootcamps were at the height of fashion and were a
reliable path to employment. In those days, my recipe for success was clear:
code more.

The more I coded, the more I learned, the better I got at my job. I literally
tied success to reps on the keyboard, and it worked! So much so that my friend
and I had a name for it — Morning Club.

Morning Club was simple. Wake up before work and get the reps in. That could
have been a course, a side project, or the next 15 minutes of an 8-hour
freeCodeCamp YouTube video. Time writing code was a reliable forcing function
for improvement, but of course, this mental model has not survived the AI era.
In the last 18 months, I've barely written code at all and achieved most of my
career progression, shipped my proudest work, and had genuine impact.

So what's the problem? Why is it that I feel like something needs to change if
I'm progressing and doing good work?

You've probably heard that AI can act as an "amplifier" or a "mirror." It takes
what already exists and builds on it. This is most noticeable in codebases, but
I believe it happens with people too, and I believe that this is what I have
been experiencing — increasing levels of amplification, not growth.

My years of engineering without AI have given me a great base to leverage it for
more impact than I would have been able to produce otherwise. As AI got more
capable, I could feel myself developing more confidence and feeling braver to
tackle harder and harder problems. I stopped thinking about whether I *could* do
things and started thinking more about what I *should* do, and taking faster
action.

This is genuinely a good thing. But I couldn't shake this feeling that AI was
getting better and I was not. The completion of a big feature no longer left me
feeling more competent; it just left me feeling more dependent on Claude. My
skill and my confidence both felt like they were atrophying, and I needed to
make a change.

I started reading a bit wider on the problem, and it turned out I was not the
only person feeling this. I read articles like
[Comprehension Debt](https://addyosmani.com/blog/comprehension-debt/) by Addy
Osmani and
[Agentic Coding is a Trap](https://larsfaye.com/articles/agentic-coding-is-a-trap)
by Lars Faye. Both great reads — they touch on how agentic coding risks humans
losing touch with their codebase and their skills if they become overly reliant
on agents.

Eager to not fall into this trap, I went about solving my problem in the only
way I knew how — code more!

My first attempt was an agent skill that tried to round up all the "cognitive
debt" I had accrued that session and give me "homework" aimed at paying it back.
Honestly, it wasn't terrible; it just didn't stand the test of time. It lasted
about two weeks before I couldn't keep it up. Cracks in my old beliefs were
starting to show.

Determined that coding was still the answer, my next attempt was an extension
that introduced random friction at points where the agent would otherwise have
done the work for me. It would stop in its tracks halfway through execution, and
I'd code the rest. Shockingly, this didn't last long either. Finishing
half-baked work was actually slower and harder than doing the whole thing
yourself.

After a couple of months of failing to claw back this feeling of growth, I came
across a
[YouTube video](https://www.youtube.com/watch?v=q_Jq4IgYImk) on how some of
Google's top engineers are upskilling in the AI-native era.

It's a great watch, and it introduced me to something that totally transformed
how I view my workflow: "shifting left."

Unless you've heard the phrase before, it probably means nothing in isolation,
so let me show you.

Until recently, my ideal workflow for new feature development looked roughly
like this:

![A workflow diagram — Chat, Plan and Code in a row with a review loop running from Code back through a Rev diamond into Code; below it a crossed-out brain labelled "cognitive surrender, LLM owns engineering" and a curve marked "right shifted."](/images/right-shifted-workflow.png)

*My old workflow: the engineering — my contribution — is right-shifted, all of
it happening after the LLM has already written the plan and the code.*

The agent and I would chat. Once I was convinced it understood my intent, I'd
switch to plan mode, execute the plan, and review the output.

You'll notice that the engineering work — that is, my contribution — is, quite
literally, right-shifted. It all happens at the end: the reviewing of the code,
the back and forth post-execution. Pulling the magic slot machine until you get
what you want.

This way of working is, I've come to learn, more akin to vibe coding than it is
to engineering, and it's the main culprit behind this continued feeling of
professional atrophy.

When you cognitively surrender the engineering to the LLM (i.e. it writes the
plan, not you), you create an expensive downstream loop. Because you were
hands-off at the start, you spend time (and tokens) at the end clawing back poor
implementations and design smells to stop this feature from being tacked onto
the growing codebase as a lump. You accrue cognitive debt, and you've learned
nothing.

When you shift your contribution left, you take back control of the engineering,
and the workflow looks more like this:

![A workflow diagram — Specs/HLDs and Chat grouped inside a dotted boundary, a dashed arrow leading to Execute, and Execute and Review joined by a two-way arrow; below the boundary a brain labelled "I own engineering, productive struggle."](/images/left-shifted-workflow.png)

*Left-shifted: the contribution moves up front, into the spec, where I own the
engineering — and because I already know what to expect, the review loop stays
cheap.*

In left-shifted engineering, the work happens up front, in the spec or
high-level design doc. Critically, the magic is in the productive struggle of
writing that spec yourself, without an LLM (at least for the first draft).
That's where you own the engineering and learn by communicating your own intent.
It's more rewarding, and it's cheaper overall: because you were hands-on at the
start, you already know what to expect, so the review loop costs little in time
and tokens. You also get a real chance to fight codebase entropy, which is
something LLMs are terrible at.

I know — I'm incredibly late to the party with spec-driven development. But
honestly, I didn't see the point until I viewed it through the lens of
professional growth and cognitive surrender.

I'm still experimenting with this, but my hope is that by shifting left and
putting a meaningful, productive, human-owned struggle into the engineering up
front — by way of a spec or some similar artefact — I can keep growing as an
engineer and finally let go of "code more" as my means to growth, while still
shipping.

The great thing about a spec is that you can get pretty detailed with it if you
want. I like to be the one designing the module structure, the function
signatures, or whatever the relevant interface is.

Shifting left has honestly been harder than I imagined, and I do still find
myself slipping right from time to time.

What's that saying… "what got you here won't get you there"?

Will I give up coding? Probably not, but it's a hobby now, not the engine of my
growth.

If you related to this in any way, I'd love to hear from you. Ping me a DM and
let me know what your journey has been like.

## References

1. [Comprehension Debt](https://addyosmani.com/blog/comprehension-debt/) — Addy Osmani
2. [Agentic Coding is a Trap](https://larsfaye.com/articles/agentic-coding-is-a-trap) — Lars Faye
3. [Build core skills to thrive as an AI-era developer](https://www.youtube.com/watch?v=q_Jq4IgYImk)
