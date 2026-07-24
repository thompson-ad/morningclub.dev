#!/usr/bin/env bash
# Live domain health check for morningclub.dev.
#
# These are the production checks — the ones run against the DEPLOYED site and
# its DNS, not the build. Run this any time you want to confirm the domain, the
# site, and (critically) your email are all still healthy:
#
#   bash scripts/healthcheck.sh
#   bash scripts/healthcheck.sh https://staging.example.com   # a different base
#
# Needs only `curl` and `dig` (both ship with macOS). Exits non-zero if any
# check fails, so it works in a cron/monitor too.

set -uo pipefail

BASE="${1:-https://morningclub.dev}"
DOMAIN="$(printf '%s' "$BASE" | sed -E 's#^https?://##; s#/.*$##')"

pass=0
fail=0

check() { # description, shell-expression
  local desc="$1" expr="$2"
  if eval "$expr" >/dev/null 2>&1; then
    printf '  \033[32m✓\033[0m %s\n' "$desc"; pass=$((pass + 1))
  else
    printf '  \033[31m✗\033[0m %s\n' "$desc"; fail=$((fail + 1))
  fi
}

hdr() { curl -sI --max-time 15 "$1" 2>/dev/null; }
body() { curl -s  --max-time 15 "$1" 2>/dev/null; }

# Pick the newest article straight from llms.txt, so this never hardcodes a slug.
ART_URL="$(body "$BASE/llms.txt" | grep -oE 'https?://[^ )]+\.md' | head -1)"
SLUG="$(basename "${ART_URL:-none.md}" .md)"

echo
echo "Health check: $BASE   (newest article: ${SLUG})"

echo
echo "Reachability & TLS"
check "apex loads over HTTPS (valid cert)" "hdr '$BASE/' | grep -q '200'"
check "homepage is the site"                    "body '$BASE/' | grep -qi 'morning club'"
check "an article page renders" "hdr '$BASE/$SLUG' | grep -q '200'"
check "custom 404 works" "hdr '$BASE/no-such-page-xyz' | grep -qE '404'"

echo
echo "www → apex redirect"
check "www root 301s to apex" "hdr 'https://www.$DOMAIN/' | grep -i '^location' | grep -q 'https://$DOMAIN/'"
check "www keeps path + query on redirect" "hdr 'https://www.$DOMAIN/$SLUG?utm=x' | grep -i '^location' | grep -q 'https://$DOMAIN/$SLUG?utm=x'"

echo
echo "DNS & email (the important one)"
check "nameservers are Cloudflare"              "dig NS $DOMAIN +short | grep -qi cloudflare"
check "Google MX still resolving (inbound mail)" "dig MX $DOMAIN +short | grep -qi 'aspmx.l.google.com'"
check "all 5 Google MX present"                 "[ \$(dig MX $DOMAIN +short | grep -ci 'aspmx') -ge 5 ]"
check "DMARC record present"                    "dig TXT _dmarc.$DOMAIN +short | grep -qi 'DMARC1'"

echo
echo "Agent surface"
check ".md sibling served as markdown" "hdr '$BASE/$SLUG.md' | grep -qi 'text/markdown'"
check ".md sibling keeps frontmatter"           "body '$BASE/$SLUG.md' | head -1 | grep -q '^---'"
check "llms.txt has the spec H1 shape"          "body '$BASE/llms.txt' | head -1 | grep -q '^# '"
check "llms-full.txt serves"                    "body '$BASE/llms-full.txt' | grep -q '$SLUG'"
check "history.md points at git history"        "body '$BASE/$SLUG/history.md' | grep -q 'commits/main/notes'"
check "graph.json serves"                       "body '$BASE/graph.json' | grep -q '\"nodes\"'"
check "sitemap index serves" "hdr '$BASE/sitemap-index.xml' | grep -q '200'"
check "rss has items"                           "body '$BASE/rss.xml' | grep -q '<item>'"
check "robots.txt welcomes AI crawlers"         "body '$BASE/robots.txt' | grep -q 'ClaudeBot'"

echo
echo "SEO & headers"
check "apex is INDEXABLE (no noindex here)"     "! hdr '$BASE/$SLUG' | grep -qi 'x-robots-tag: *noindex'"
check "canonical points at the apex"            "body '$BASE/$SLUG' | grep -q 'rel=\"canonical\" href=\"$BASE/$SLUG\"'"
check "security headers present" "hdr '$BASE/$SLUG' | grep -qi 'content-security-policy'"
check "an article image loads"                  "body '$BASE/$SLUG' | grep -oE '/images/[^\" ]+' | head -1 | xargs -I{} curl -s -o /dev/null -w '%{http_code}' '$BASE'{} | grep -q 200"

echo
printf 'Passed %d, failed %d\n\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
