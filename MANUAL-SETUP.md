# Manual setup

Everything the repository can't do for itself: the Cloudflare project, DNS, and
the two secrets. All one-time. Nothing below needs to be repeated per deploy.

Steps 1–3 get the first deploy working; step 4 attaches the domain; step 5 locks
down email.

> **Why the commands, not just the dashboard.** Cloudflare reorganises its
> dashboard often, and it's mid-migration folding Pages into Workers, so menu
> names drift. The `wrangler` commands below don't, so they're the primary path;
> dashboard equivalents are given as a fallback. Pages itself is not going away —
> existing and new Pages projects keep working; you can ignore any dashboard
> nudge toward "Workers".

---

## 1. Create the Pages project — it must exist before the first deploy

The GitHub Action deploys *into* an existing project. In a non-interactive CI
run, `wrangler pages deploy` does **not** create a missing project — it fails
with "project not found". So create it once, first.

**CLI (recommended — deterministic):**

```bash
npx wrangler login
npx wrangler pages project create morningclub-dev --production-branch=main
```

- The name **must** be `morningclub-dev` — it's hardcoded in
  [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) as
  `--project-name=morningclub-dev`. (Pages names can't contain dots, so it can't
  be `morningclub.dev`.) If you change it, change the workflow to match.
- `--production-branch=main` **must** match the workflow's `--branch=main`, or
  deploys land as "preview" and never serve on the custom domain.
- Multiple Cloudflare accounts? `wrangler` will ask which; or export
  `CLOUDFLARE_ACCOUNT_ID` first (see step 2).

**Dashboard (alternative):** sidebar **Workers & Pages** (recent dashboards nest
this under **Compute**) → **Create application** → **Pages** → **drag and drop**
your local `dist/` folder (run `npm run build` first) → name it
`morningclub-dev`. That both creates the project and does a first deploy; CI
takes over afterwards.

**Do not** connect the project to Git. Deploys come from GitHub Actions, which
checks out full history so article dates are correct; Cloudflare's own Git
integration shallow-clones and would break every date.

## 2. Create the API token and find the account ID

Dashboard → **profile menu** (top-right avatar) → **API Tokens** → **Create
Token** → **Create Custom Token** (**Get started**).

- **Permissions:** `Account` · `Cloudflare Pages` · `Edit`
- **Account Resources:** include your account

Copy the token now — Cloudflare shows it only once.

For the **account ID**, easiest from the CLI:

```bash
npx wrangler whoami
```

(Dashboard equivalent: open any domain's **Overview**, then the **API** panel on
the right.)

## 3. Add the two repository secrets

GitHub → the repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**:

| Secret name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | The token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | The account ID from step 2 |

Names must match exactly — the workflow reads them by name.

## 4. Move DNS to Cloudflare and attach the domain

The registrar can stay wherever it is; only the nameservers move.

1. Dashboard → **Add a domain** → `morningclub.dev` → Free plan.
2. Cloudflare gives you two nameservers. Set them at your registrar, replacing
   the existing ones. Propagation is usually minutes, occasionally hours.
3. Once the zone is **Active**, attach the **apex only** to the Pages project:
   **Workers & Pages** → `morningclub-dev` → **Custom domains** → **Set up a
   domain** → `morningclub.dev`. Cloudflare creates the record and flattens the
   CNAME at the apex. (Do **not** attach `www` here — it's handled by a redirect
   below, which is Cloudflare's recommended pattern for Pages.)

### Redirect www → apex

`www` isn't a Pages domain, so the redirect lives at the zone level, not in
`public/_redirects` (a `_redirects` file can't reliably do cross-host on Pages).
Two small pieces:

1. **DNS** → **Records** → add a record so www traffic reaches Cloudflare's edge:
   - Type `CNAME`, Name `www`, Target `morningclub.dev`, **Proxied** (orange cloud).
2. **Rules** → **Redirect Rules** → **Create rule**:
   - **When incoming requests match:** `http.host eq "www.morningclub.dev"`
   - **Then:** *Dynamic redirect* → expression
     `concat("https://morningclub.dev", http.request.uri.path)`, status **301**,
     **Preserve query string** on.

Verify once DNS is live:

```bash
curl -sI https://www.morningclub.dev/ | grep -i '^location'
```

TLS needs no attention — Cloudflare issues and renews automatically, and `.dev`
is on the browser HSTS preload list, so the whole TLD is HTTPS-only by fiat.

## 5. Add the null email records

The domain never sends mail. Without these, anyone can spoof `@morningclub.dev`.
Dashboard → `morningclub.dev` → **DNS** → **Records**:

| Type | Name | Value | Notes |
|---|---|---|---|
| `TXT` | `@` | `v=spf1 -all` | No host is authorised to send mail |
| `TXT` | `_dmarc` | `v=DMARC1; p=reject` | Reject anything that fails |
| `MX` | `@` | `.` (priority `0`) | The null MX, RFC 7505 |

For the null MX, enter `.` as the target with priority `0`. If the UI rejects a
bare dot, Cloudflare's **Email** section has a "disable email / I don't send
email" toggle that provisions the same protection.

## 6. Trigger the first deploy

The project exists (step 1) and the secrets are set (step 3), so just run the
workflow: push to `main`, or GitHub → **Actions** → **Deploy** → **Run
workflow**.

Then check it landed:

```bash
curl -sI https://morningclub.dev/ | head -1
curl -s https://morningclub.dev/llms.txt | head -1
```

The full acceptance suite is in [`scripts/verify.sh`](scripts/verify.sh):

```bash
bash scripts/verify.sh https://morningclub.dev
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
