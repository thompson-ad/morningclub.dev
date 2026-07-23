# Manual setup

Everything the repository can't do for itself: the Cloudflare project, DNS, and
the two secrets. All one-time. Nothing below needs to be repeated per deploy.

Do these in order — step 4 is what makes the first deploy actually succeed.

---

## 1. Create the Cloudflare Pages project

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
**Create using direct upload**.

- **Project name:** `morningclub-dev`

  This exact name matters — it's hardcoded in
  [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) as
  `--project-name=morningclub-dev`. (It can't be `morningclub.dev`; Pages
  project names don't take dots.) If you pick something else, change the
  workflow to match.

- **Do not** connect it to GitHub. Deploys come from GitHub Actions instead,
  because the build needs full git history to derive article dates and
  Cloudflare's git integration shallow-clones. Direct upload is correct here.

You can skip uploading anything at creation time — the first Actions run will
populate it.

## 2. Create the API token

Cloudflare dashboard → **My Profile** → **API Tokens** → **Create Token** →
**Custom token**.

- **Permissions:** `Account` → `Cloudflare Pages` → `Edit`
- **Account Resources:** include your account

Copy the token now; Cloudflare won't show it again.

You also need your **Account ID** — it's on the right-hand side of the Workers &
Pages overview page.

## 3. Add the two repository secrets

GitHub → the repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**:

| Secret name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | The token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

Names must match exactly — the workflow reads them by name.

## 4. Move DNS to Cloudflare and attach the domain

The registrar can stay wherever it is; only the nameservers move.

1. Cloudflare dashboard → **Add a site** → `morningclub.dev` → Free plan.
2. Cloudflare gives you two nameservers. Set them at your registrar, replacing
   the existing ones. Propagation is usually minutes, occasionally hours.
3. Once the zone is active: **Workers & Pages** → `morningclub-dev` →
   **Custom domains** → **Set up a custom domain**. Add **both**:
   - `morningclub.dev`
   - `www.morningclub.dev`

   Cloudflare creates the records itself, including apex CNAME flattening.

### If `www` doesn't redirect

[`public/_redirects`](public/_redirects) already contains the host-level rule.
If it isn't applied (Pages is inconsistent about cross-host rules), add a
redirect rule instead: **Rules** → **Redirect Rules** → **Create rule**:

- **If:** Hostname equals `www.morningclub.dev`
- **Then:** Dynamic redirect, `301`, expression:
  `concat("https://morningclub.dev", http.request.uri.path)`
- Preserve query string: on

TLS needs no attention — Cloudflare issues and renews automatically, and `.dev`
is on the browser HSTS preload list, so the whole TLD is HTTPS-only by fiat.

## 5. Add the null email records

The domain never sends mail. Without these, anyone can spoof
`@morningclub.dev`. Cloudflare dashboard → `morningclub.dev` → **DNS** →
**Records**:

| Type | Name | Value | Notes |
|---|---|---|---|
| `TXT` | `@` | `v=spf1 -all` | No host is authorised to send mail |
| `TXT` | `_dmarc` | `v=DMARC1; p=reject` | Reject anything that fails |
| `MX` | `@` | `.` | Priority `0` — the null MX, RFC 7505 |

For the null MX, enter `.` as the target with priority `0`. If Cloudflare's UI
rejects a bare dot, use the DNS records API or set it via the "Email" section's
"I don't want email" option, which provisions the same thing.

## 6. Trigger the first deploy

Push to `main`, or run the workflow manually: GitHub → **Actions** → **Deploy**
→ **Run workflow**.

Then check it landed:

```bash
curl -sI https://morningclub.dev/ | head -1
curl -s https://morningclub.dev/llms.txt | head -1
curl -sI https://www.morningclub.dev/ | grep -i location
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
  scanning and push protection. The repo's history is permanent and the
  evolution surface depends on commit SHAs staying valid, so a leaked secret
  would mean a history rewrite that breaks every `raw.githubusercontent.com`
  link ever published.
