---
title: Engineering in the margins
description: Design as a competitive edge
created: 2026-08-08
stage: exploratory
tags:
  - software-design
  - tidying
  - refactoring
  - ai
---
Recently I've been reading a book called _Tidy First?_ by Kent Beck. It's not even 100 pages long but I've spent days re-reading certain chapters that have changed how I think about software design and my personal development lifecycle.

*Tidy First?* introduced me to an economic concept called options. My poor understanding of an option is that they are something you purchase that gives you the right to buy something at a certain price later on.

It maps well to software design. Spending time on design is kind of like buying options that charge different premiums and have varying upsides. The upside is normally future features that take less time to build which has a double payoff: 

1. Cash flow from the feature is realised sooner and cash sooner is more valuable than cash later (something I also learned from *Tidy First?*)
2. Features that are quicker to build carry lower opportunity cost and are more likely to be considered thereby giving you more options at any one time.

Software design swings on a spectrum around how sure you are about the next thing that's coming your way. If you're more sure, you're probably more willing to pay more to get the option and vice versa. 

On one end of the spectrum, large refactors charge significant premiums and they are hard to reverse. They have higher potential upside but the wrong abstraction makes things worse so you have to be sure it will pay off. Small tidyings on the other hand can happen at almost every commit. The premium is cheap, they are easy to reverse and have compounding, ripple effects throughout the codebase.

The options metaphor isn't perfect but it's got me thinking about my own workflow and where my attention has drifted with agentic engineering. 

In the past I had only really considered software design as marginal gains. Something that I knew was important for resilience but often didn’t get prioritised. Now I might even consider a well designed codebase a competitive edge. When everyone can ship maybe the margins are where all the value is.

"Feature drag" is a phenomenon where over time it get's harder to add features to a codebase. If you've spent any time coding with LLMs you'll know that they are very good at accelerating this feeling. 

Kent Beck did a great [talk](https://www.youtube.com/watch?v=sMujMp4h_EY) (yes, I'm a fan!) where he looks at feature drag through another lens. He shows a graph of options vs features. As the number of features increases, the number of options decreases creating this feeling of feature drag. He argues that, what if, instead of letting our agents jump from feature to feature, gradually burning our options to zero, we take the time needed to tend to the design to increase optionality so that what was once a rapid descent to zero is maybe a flat line or slow up-tick.

I quite like this way of thinking and I'm trying to do more of it everyday where it makes sense. Whether it's at spec time or at review time I try to think: “is there a way I can design this so that the codebase becomes 1% better in the immediate scope of this PR?” Or, “is there a premium I can pay now that buys us an option for another feature to be delivered quicker later down the line”.

I suppose this way of thinking was always good engineering but it’s never felt more urgent and achievable at the same time.

Even though LLMs have piled onto codebase entropy, they have also made it easier to achieve a descent structure right from the start when given the right constraints.

Pre-AI (whenever that was), there was a strong argument to be made that typical separations, like those popularised by domain driven design or hexagonal architecture, were overkill when starting out because it increased cognitive overhead and slowed us down. 

Now I’m starting to think that's no longer the case and that strong, structural opinions early on may even be beneficial because all the mental overhead shifts to the LLM providing it useful constraints.

As always, I might be totally wrong and I'm learning along the way. If you enjoyed this ramble or have any thoughts on it's contents do let me know!
### Inspired by:
- [_Tidy First?_ by Kent Beck](https://www.goodreads.com/en/book/show/171691901-tidy-first)
- [Sustainable Augmented Development - Kent Beck](https://www.youtube.com/watch?v=sMujMp4h_EY)
- [Addy Osmani - Earning Judgement](https://addyosmani.com/blog/earning-judgment/)
