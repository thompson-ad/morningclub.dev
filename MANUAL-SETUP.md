# Manual setup

Everything the repository can't do for itself. All one-time.

## Where things stand now

- ✅ The Cloudflare Pages project **`morningclub-dev`** exists.
- ✅ The site is **live at <https://morningclub-dev.pages.dev>** (deployed manually
  via `wrangler`; noindexed, so it won't show up in search).
- ⬜ **Automatic deploys** aren't wired yet (§1) — a push to `main` won't deploy
  until the two secrets exist. Until then, deploy manually:

  ```bash
  npm run build
  npx wrangler pages deploy dist --project-name=morningclub-dev --branch=main
  ```

- ⬜ The **custom domain** `morningclub.dev` isn't attached yet (§2). The domain
  currently runs on **Squarespace DNS** with **live Google + Amazon SES email**,
  so the plan below moves the zone to Cloudflare **without touching email**.

> **Do NOT add "null email" records** (null MX, `SPF -all`). An earlier draft of
> this file did — it would delete your ability to send and receive mail at
> `@morningclub.dev`. Your email stays exactly as it is.

---

## 1. Wire automatic deploys (recommended)

So a push to `main` deploys on its own instead of you running wrangler. The
GitHub Action needs two repo secrets.

**a. Create an API token.** Cloudflare dashboard → profile menu (top-right) →
**API Tokens** → **Create Token** → **Create Custom Token**:

- **Permissions:** `Account` · `Cloudflare Pages` · `Edit`
- **Account Resources:** your account

Copy it — Cloudflare shows it once.

**b. Add both secrets.** GitHub → repo → **Settings** → **Secrets and variables**
→ **Actions** → **New repository secret**:

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from (a) |
| `CLOUDFLARE_ACCOUNT_ID` | run `npx wrangler whoami` to get it |

Names must match exactly. Once both are set, re-run the **Deploy** workflow
(GitHub → Actions → Deploy → Run workflow) and it goes green.

---

## 2. Move the domain to Cloudflare — email-safe

The bare `morningclub.dev` can only be served by Pages if the zone is on
Cloudflare (Squarespace can't point an apex at Pages). The order below keeps
email flowing the entire time: nothing about mail delivery changes until the
very last step, and that step is reversible.

### Step 1 — Add the site to Cloudflare (does NOT go live yet)

Dashboard → **Add a domain** → `morningclub.dev` → **Free** plan. Cloudflare
scans your existing Squarespace records and imports what it finds. **This does
nothing to live traffic** — the domain still resolves through Squarespace until
you change nameservers in Step 5.

### Step 2 — Verify every EMAIL record survived the import

This is the important one. In Cloudflare's DNS list, confirm all of these are
present, and that each is set to **DNS only** (grey cloud, *not* proxied — a
proxied MX or DKIM record breaks mail). Re-add by hand anything the scan missed.

**Google Workspace — inbound mail:**

| Type | Name | Priority | Data |
|---|---|---|---|
| MX | `@` | 1 | `aspmx.l.google.com` |
| MX | `@` | 5 | `alt1.aspmx.l.google.com` |
| MX | `@` | 5 | `alt2.aspmx.l.google.com` |
| MX | `@` | 10 | `alt3.aspmx.l.google.com` |
| MX | `@` | 10 | `alt4.aspmx.l.google.com` |

**Amazon SES — outbound / transactional mail:**

| Type | Name | Priority | Data |
|---|---|---|---|
| MX | `envelope` | 10 | `feedback-smtp.us-east-1.amazonses.com` |
| TXT | `envelope` | — | `v=spf1 include:amazonses.com ~all` |
| TXT | `_dmarc` | — | `v=DMARC1; p=none;` |
| CNAME | `qzjgnzjomsvu3hxhgwjjwdlxovcwc4af` | — | `qzjgnzjomsvu3hxhgwjjwdlxovcwc4af.dkim.amazonses.com` |
| CNAME | `3srv4v72mnmpsib4nm2gbo3nuqgyi55g` | — | `3srv4v72mnmpsib4nm2gbo3nuqgyi55g.dkim.amazonses.com` |
| CNAME | `bpsqczxnoo7v7jdop6kfw6u2mxlnktcj` | — | `bpsqczxnoo7v7jdop6kfw6u2mxlnktcj.dkim.amazonses.com` |

The three DKIM values were truncated in the Squarespace UI — cross-check them
against your Squarespace DNS (or the SES console) rather than trusting the ends
of these strings. Don't change any email record; just make sure each exists.

### Step 3 — Remove the dead Framer web records (in Cloudflare)

These pointed the old, decommissioned Framer site. Delete them from the
Cloudflare zone so they don't fight the Pages setup:

| Type | Name | Data |
|---|---|---|
| A | `@` | `52.223.52.2` |
| A | `@` | `35.71.142.77` |
| CNAME | `www` | `sites.framer.app` |

(The `_domainconnect` CNAME is a Squarespace-management helper — irrelevant once
you're off Squarespace DNS; ignore or delete it.)

### Step 4 — Point the apex and www at Pages

1. **Apex → Pages.** Workers & Pages → `morningclub-dev` → **Custom domains** →
   **Set up a domain** → `morningclub.dev`. Cloudflare creates the apex record
   (proxied, CNAME-flattened) pointing at the project.
2. **www → 301 to apex.** Don't attach `www` to Pages; redirect it instead:
   - **DNS** → add `CNAME` `www` → `morningclub.dev`, **Proxied** (orange), so
     www traffic reaches Cloudflare's edge.
   - **Rules → Redirect Rules → Create rule:**
     - When: `http.host eq "www.morningclub.dev"`
     - Then: *Dynamic redirect* → `concat("https://morningclub.dev", http.request.uri.path)`, **301**, preserve query string.

### Step 5 — Switch nameservers (this is go-live, and it's reversible)

Only now, after Steps 2–4 are verified. Cloudflare's **Add site** screen shows
you two nameservers (e.g. `xxx.ns.cloudflare.com`). In **Squarespace → your
domain → Nameservers**, replace the current nameservers with Cloudflare's two.

Propagation is usually minutes to a couple of hours. If anything looks wrong,
switch the nameservers back to Squarespace's and everything reverts.

TLS is automatic (Cloudflare issues + renews). `.dev` is HSTS-preloaded, so the
whole domain is HTTPS-only by fiat.

---

## 3. Verify after propagation

```bash
# site on the bare domain
curl -sI https://morningclub.dev/ | head -1
curl -s https://morningclub.dev/llms.txt | grep shifting-left

# www 301s to apex
curl -sI https://www.morningclub.dev/ | grep -i '^location'

# email records still resolve (must still point at Google + SES)
dig MX morningclub.dev +short
dig MX envelope.morningclub.dev +short
```

Then **send yourself a test email** at `@morningclub.dev` and send one *from* it,
to confirm both directions still work.

The full 41-check acceptance suite ([`scripts/verify.sh`](scripts/verify.sh))
runs against a **local** build — it leans on the local-only `example-*` fixtures
to exercise cross-linking and backlinks that a single live article can't:

```bash
npm run build && npm run preview &   # serves http://localhost:4321
bash scripts/verify.sh http://localhost:4321
```

---

## Optional, later

- **Search Console / Bing Webmaster.** Verify the domain and submit
  `https://morningclub.dev/sitemap-index.xml`. AI engines largely cite what
  search indexes rank, so being indexed is upstream of being cited.
- **Secret scanning.** GitHub → Settings → Code security → enable secret
  scanning and push protection. The repo's history is permanent and the history
  surface depends on commit SHAs staying valid, so a leaked secret would mean a
  history rewrite that breaks every `raw.githubusercontent.com` link ever
  published.
