---
title: How apps and their agents connect to other apps
description: The layers that compose connections and what integrating with software you don't own does to yours.
created: 2026-08-22
stage: developing
tags:
  - integrations
  - oauth
  - webhooks
  - mcp
  - agents
---
In 2026 it feels like table stakes to be building a context layer for your apps users. For many systems, this is a central pool of data, synced from third-party systems, that helps AI agents take actions, stay aware of what's going on and do work on your behalf. The better the context, the better the outcomes.

You'll see this capability show up as "connect" buttons in the apps you use. For example, Claude lets you connect your Notion workspace; Fyxer lets you connect your Gmail or Google Calendar.

It's fascinating how these connections work and this is the first article in a series where I try to demystify these little connect buttons and peek under the hood at the layers of software that keep a connection alive. Here we'll cover these layers at a high level, for both apps and the agents that live inside them. In later articles I hope to go deeper on each layer, how they work and how they scale, and then on the fascinating effects that show up in a system when you don't own part of it, and the part you don't own runs at scale too.

Before we dive in, a few terms are worth defining up front (my definitions, not industry standards):

- **Provider** - The external software your app or your agent wants to connect to. Your user works here too.
- **Integration** - A provider exposes functionality that you can use once you have permission. The bits of it your app chooses to use, and the code you write to use it, is your integration with that provider.
- **Connection** - What the user experiences: the feeling that the two apps are linked. As long as the integration works, the connection is alive.

## What is a connection?

To the user, a connection feels like a tether between two apps - a permanently open line of communication... like a pipeline or a tunnel.

It sounds ridiculous now, but when I first started working on connections I expected the software to look like that too. Spoiler alert, it (mostly) doesn't. Under the hood, a connection is usually a stored credential plus layers of machinery that work in unison to keep the connection alive and performant. How many and their shape depends on what the provider demands and how much data you need. Deep, complex integrations have more layers than shallow, simple ones.

Regardless of complexity, they boil down to two:

1. Permission
2. Transport

Let's run through a hypothetical example and watch them take shape.

Imagine you're building an app that connects to your users to-do list app. You want to read and write to-do items, listen for updates, and give your users an agent that uses this context and capability to help them manage their priorities.

## Layer 1: permission

You'll want one of those connect buttons in your app that a user can click to start the connection. When they click it, your app asks the user for permission to access their to-do data on their behalf.

**This is layer 1**: getting permission, keeping it and linking it back to the user.

Unfortunately, you can't just add a connect button for any provider you like. The provider decides how permission works, and the two most common mechanisms are:

1. [OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749) and, increasingly, [OAuth 2.1](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) 
2. API keys (or personal access tokens)

OAuth has a few more moving parts than an API key. It has two layers of credential where an API key only has one. 

First, you register your app with the provider, which gives it a secret identity. This is how the provider knows your users will be connecting. Sometimes this step can even come with a security review and sometimes this review is not just a one-off. Second, each user gets their own tokens through a consent flow. An API key is a single, generated key that gets copy-pasted into your application, either by you as the developer or by your user, and the provider doesn't need to know your app exists.

Back to the connect button. With registration done, this button can offer a connection flow. For providers that use OAuth (which is most of the big ones), this button will redirect your users to a consent screen hosted by the provider. When they approve, the provider redirects back to your app with a short-lived code, which your server swaps for an access token and, usually, a refresh token. For API-key connections, you might provide a form to accept the key from the user.

Assuming all goes well, your app now has one or more credentials that give it permission to access the user's data. *Keeping* that permission is its own job. Access tokens are short-lived (often around an hour), so your app uses the refresh token to get new ones, and it needs a plan for when the user or the provider revokes access and the connection dies.

It's also important to consider where you store the credential. Encrypt it at rest, and make your schema accurately reflect the permission scope of the credential. For example, access to a Notion workspace affects many users, while access to an inbox affects one. In each case, store the credential in a way that helps you resolve the correct level of ownership.

Technically, you now have a connection, and that button can go from "connect" to "connected ✅". But until you actually doing stuff with this permission, the user won't feel anything happen.

## Layer 2: transport

Back to the to-do app. Remember the capabilities we wanted:

1. Read and write to-do items (do stuff)
2. Listen for updates to the list (know stuff)

"Doing" things and "knowing" things need different kinds of transport, and different systems to run them.

To *do* stuff, like write a to-do, your app or your agent makes an API call to the provider. To *know* stuff, your app needs to sync and probably persist data from the provider.

In both cases, your app will need to speak the language of the provider by mapping their API to an internal one. Domain-driven design calls this an *anti-corruption layer*: it stops the provider's quirks leaking into the rest of your codebase.

Read and write operations are simple enough; you'll just want to make sure the implementation details of communication with the provider's API are encapsulated. This includes:

- HTTP specifics, like required headers and API contract demands
- Pagination, so that "list my to-dos" returns all of them
- Attaching credentials to every request
- Rate-limit handling and backoff logic (driven by the [`Retry-After`](https://www.rfc-editor.org/rfc/rfc9110#field.retry-after) header when the provider sends one)

Syncing data to the point where your app has this feeling of "knowing" is a little more involved. First there's the backfill. When a user connects, you have to pull in everything that already exists. Doing this reliably is a challenge of itself! You might have to process thousands of records whilst juggling rate-limits and latency. 

After that, you keep up with changes. Depending on what the provider offers, you might opt for a simple polling job or you might be able to create a subscription and register a webhook.

Deciding on the syncing mechanism is a balancing act that must take into account your scale, how much you want to know and how much actually happens.

In our to-do app, there's not a lot going on. The user might mark something as complete, maybe they move a few items around or delete something. There's a handful of events at any moment.

If we were to poll for the data, chances are we'd come back empty most of the time, wasting valuable requests. This might not matter with a small user base, but will be costly as it grows and will get out of hand quickly if we have to shorten the interval too.

Webhooks dodge the issue of wasted requests, because you get told what happens rather than having to ask. Their costs scale with how much happens, but they also carry an engineering tax. A webhook endpoint has to handle:

- **Public ingress:** anyone on the internet can call it, so verify every request's signature
- **At-least-once delivery:** the same event can arrive twice, so processing must be idempotent
- **Unordered delivery:** events can arrive out of order, so check timestamps or versions before overwriting newer data with older
- **Bursty delivery:** providers control the flow so queue events rather than processing them inline.
- **Dropped delivery:** retries eventually give up, so you still need occasional reconciliation
- **Subscription expiry:** Many subscriptions eventually expire and you can't let that happen

Robust webhooks tend to be "thin" where they tell you *something* changed, and you make an API call to find out what. 

With permission and transport engineered, your connection is alive, and you can build a pretty cool app on top of a rich pool of context and a lot of capability 😎.

## What about agents?

So far we've covered how apps connect to third-party systems and, in doing so, collect a lot of helpful data for the agents that live inside them. But what if the agent wants to talk to the provider directly? What if it thinks, "hmm, let me just fact check that…"? How does the agent connect directly?

Agents act through the tools they're given, and there are two common ways to give them tools. Either you author a tool that calls the provider's API directly, or the agent discovers tools through the provider's [MCP](https://modelcontextprotocol.io) server. The authored tool is essentially no different to what we have already discussed. It uses the permission and transport layers your app already built.

When an agent connects to a provider via an MCP server, the layers involved are similar for permission but very different for transport.

Remote MCP servers delegate authorisation to OAuth 2.1, and the user still approves access on a consent screen. What changes is discovery. You register a normal integration with the provider by hand, ahead of time, but an MCP client (the app the agent runs in, like Claude) meets most servers for the first time at runtime. So the [MCP spec](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) automates that step: the server's first `401` points the client to [metadata](https://datatracker.ietf.org/doc/html/rfc9728) naming its authorisation server, the client identifies itself, and then the familiar consent flow runs. The tokens end up with the client, not the model.

Transport is MCP itself, the Model Context Protocol: JSON-RPC messages sent over HTTP. This honestly warrants its own entire article but what matters here is that the provider wrote the server and runs it and decides which tools exist. In do/know terms, MCP is mostly about doing. There's no backfill and no persisted sync, so an agent connected this way knows only what it asks for, at the moment it asks.

That's all for this one! If you're building integrations and want to chat, feel free to [DM me on LinkedIn](https://www.linkedin.com/in/aaron-daniel-thompson/). Also, if you have anything you'd like me to write about let me know too :).
