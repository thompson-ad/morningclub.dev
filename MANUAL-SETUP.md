# Setup & operations

The one-time platform setup is **done** — the site is live at
<https://morningclub.dev> with automatic deploys and email intact. This file now
records how it's wired (for future-you and disaster recovery), how to publish,
and how to check it stays healthy.

## How it's wired

- **Hosting** — Cloudflare Pages project `morningclub-dev`. Served at
  `https://morningclub.dev` (apex, canonical) and `morningclub-dev.pages.dev`
  (an identical mirror, but `noindex`ed via `public/_headers` so only the real
  domain is indexed).
- **Deploys** — a push to `main` triggers GitHub Actions, which checks out with
  full git history (needed for the git-derived `updated` dates) and deploys via
  `wrangler`. The secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` live
  in the repo's **Settings → Secrets and variables → Actions**. Manual fallback:

  ```bash
  npm run build
  npx wrangler pages deploy dist --project-name=morningclub-dev --branch=main
  ```

- **DNS** — the zone is on **Cloudflare** now (nameservers `isaac` /
  `nelci.ns.cloudflare.com`), moved over from Squarespace.
  - **apex** → the Pages project (custom domain, proxied, CNAME-flattened).
  - **www** → 301 to the apex via a Redirect Rule (wildcard `https://www.*` →
    `https://${1}`, 301, preserve query string).
  - **email — untouched and live:** Google Workspace MX (inbound) + a `_dmarc`
    TXT, all **DNS-only** (grey cloud). The domain's old Amazon SES records were
    leftover from an abandoned setup, confirmed unused, and deliberately **not**
    migrated.
- **TLS** — automatic (Cloudflare universal SSL). `.dev` is on the browser HSTS
  preload list, so the whole domain is HTTPS-only by fiat.

> [!WARNING]
> This domain **receives real email** (Google Workspace). Never add a "null MX"
> or an `SPF -all` record, and keep the MX / `_dmarc` records DNS-only. An older
> draft of this doc suggested null-email records for a "domain that never sends
> mail" — that was wrong for this domain and would break your inbox.

## Publishing

```bash
git add notes/some-idea.md && git commit -m "another pass" && git push
```

CI builds and deploys in about a minute. That's the whole flow — see
[AUTHORING.md](AUTHORING.md) for the writing conventions.

## Health checks

Confirm the live domain, the site, and (most importantly) your email are all
healthy:

```bash
bash scripts/healthcheck.sh
```

23 checks across reachability + TLS, the www→apex redirect, **DNS + email**
(Google MX still resolving), the agent surfaces, and SEO/headers. It picks the
newest article straight from `llms.txt`, so it never hardcodes a slug. Run it
after any DNS change, or on a schedule.

The individual commands it automates, for quick spot-checks:

```bash
curl -sI https://morningclub.dev/ | head -1                 # site up?
dig MX morningclub.dev +short                               # email healthy? (expect Google aspmx.*)
dig NS morningclub.dev +short                               # nameservers? (expect *.ns.cloudflare.com)
curl -sI https://www.morningclub.dev/ | grep -i '^location' # www → apex redirect working?
```

> The **local** acceptance suite is a different tool: `scripts/verify.sh` checks
> *build* correctness against `npm run preview` and leans on the local-only
> `example-*` fixtures. Use `healthcheck.sh` for the live domain,
> `verify.sh` for the build.

## If you ever touch DNS again

DNS now lives in the **Cloudflare** dashboard (the domain → DNS → Records), not
Squarespace. Squarespace is just the registrar now. Keep the email records
(Google MX, `_dmarc`) DNS-only.

## Optional, later

- **Search Console / Bing Webmaster.** Verify the domain and submit
  `https://morningclub.dev/sitemap-index.xml` — AI engines largely cite what
  search indexes rank.
- **Secret scanning.** GitHub → Settings → Code security → enable secret scanning
  and push protection. History is permanent, so a leaked secret would mean a
  rewrite that breaks every `raw.githubusercontent.com` link ever published.
