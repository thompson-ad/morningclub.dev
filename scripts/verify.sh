#!/usr/bin/env bash
# Acceptance checks (spec §11). Runs against any base URL:
#
#   bash scripts/verify.sh https://morningclub.dev     # production
#   npm run build && npm run preview &                 # or locally
#   bash scripts/verify.sh http://localhost:4321
#
# Exits non-zero if anything fails, so it works as a smoke test in CI too.

set -uo pipefail

BASE="${1:-http://localhost:4321}"
ARTICLE="${2:-example-article}"

pass=0
fail=0

check() { # description, shell-expression
  local desc="$1" expression="$2"
  # eval, not `bash -c`: the helpers below are shell functions and would not
  # survive into a child shell.
  if eval "$expression" >/dev/null 2>&1; then
    printf '  \033[32m✓\033[0m %s\n' "$desc"
    pass=$((pass + 1))
  else
    printf '  \033[31m✗\033[0m %s\n' "$desc"
    fail=$((fail + 1))
  fi
}

body() { curl -s "$BASE$1" 2>/dev/null; }
headers() { curl -sI "$BASE$1" 2>/dev/null; }

echo
echo "Verifying $BASE"
echo
echo "Human surface"
check "index renders statically"            "body '/' | grep -q '<article\|<main'"
check "index lists the article"             "body '/' | grep -q '$ARTICLE'"
check "article advertises its .md sibling"  "body '/$ARTICLE' | grep -q 'rel=\"alternate\" type=\"text/markdown\"'"
check "article embeds JSON-LD"              "body '/$ARTICLE' | grep -q 'application/ld+json'"
check "JSON-LD carries dateModified"        "body '/$ARTICLE' | grep -q 'dateModified'"
check "article has a canonical URL"         "body '/$ARTICLE' | grep -q 'rel=\"canonical\"'"
check "rss.xml has items"                   "body '/rss.xml' | grep -q '<item>'"
check "rss.xml carries full content"        "body '/rss.xml' | grep -q 'content:encoded'"
check "sitemap index exists"                "body '/sitemap-index.xml' | grep -q 'sitemap'"
check "sitemap has real lastmod dates"      "body '/sitemap-0.xml' | grep -q '<lastmod>'"
check "404 page exists"                     "body '/404' | grep -qi 'slugs here are permanent'"

echo
echo "Agent surface"
check ".md sibling is served as markdown"   "headers '/$ARTICLE.md' | grep -qi 'text/markdown'"
check ".md sibling keeps its frontmatter"   "body '/$ARTICLE.md' | head -1 | grep -q '^---'"
check ".md sibling injects updated"         "body '/$ARTICLE.md' | grep -q '^updated:'"
check ".md sibling injects canonical"       "body '/$ARTICLE.md' | grep -q '^canonical:'"
check ".md sibling injects history"         "body '/$ARTICLE.md' | grep -q '^history:'"
check ".md sibling injects linked_from"     "body '/$ARTICLE.md' | grep -q '^linked_from:'"
check ".md sibling keeps relative links"    "body '/$ARTICLE.md' | grep -q '](\./'"
check "llms.txt has the spec H1 shape"      "body '/llms.txt' | head -1 | grep -q '^# '"
check "llms.txt has a blockquote"           "body '/llms.txt' | grep -q '^> '"
check "llms.txt mentions per-article history" "body '/llms.txt' | grep -q 'history.md'"
check "llms.txt lists an Articles section"  "body '/llms.txt' | grep -q '^## Articles'"
check "llms.txt links .md not .html"        "body '/llms.txt' | grep -q '/$ARTICLE.md)'"
check "llms.txt lists graph.json"           "body '/llms.txt' | grep -q 'graph.json'"
check "llms-full.txt contains the corpus"   "body '/llms-full.txt' | grep -q '$ARTICLE'"
check "history.md points at git history"    "body '/$ARTICLE/history.md' | grep -q 'commits/main/notes'"
check "history.md explains raw fetching"    "body '/$ARTICLE/history.md' | grep -q 'raw.githubusercontent.com'"
check "robots.txt names GPTBot"             "body '/robots.txt' | grep -q 'GPTBot'"
check "robots.txt names ClaudeBot"          "body '/robots.txt' | grep -q 'ClaudeBot'"
check "robots.txt declares the sitemap"     "body '/robots.txt' | grep -q '^Sitemap:'"
check "graph.json exposes edges"            "body '/graph.json' | grep -q '\"edges\"'"
check "graph.json exposes nodes"            "body '/graph.json' | grep -q '\"nodes\"'"

echo
echo "Integrity"
# NFR-1: the only <script> permitted is the non-executing JSON-LD block.
check "zero executable scripts on article"  "
  total=\$(body '/$ARTICLE' | grep -o '<script' | wc -l)
  ld=\$(body '/$ARTICLE' | grep -o '<script type=\"application/ld+json\"' | wc -l)
  [ \"\$total\" -eq \"\$ld\" ]"
check "images carry width and height"       "body '/$ARTICLE' | grep -o '<img[^>]*' | grep -q 'width='"
check "images are lazy-loaded"              "body '/$ARTICLE' | grep -o '<img[^>]*' | grep -q 'loading=\"lazy\"'"
check "images keep unhashed /images/ paths" "body '/$ARTICLE' | grep -q 'src=\"/images/'"
check "sibling link renders as clean URL"   "body '/$ARTICLE' | grep -q 'href=\"/honing-over-publishing\"'"
check "backlinks section is present"        "body '/honing-over-publishing' | grep -q 'Linked from'"
check "dangling link is not a link"         "! body '/$ARTICLE' | grep -q 'writing-for-strangers'"
check "no trailing-slash canonical"         "! body '/$ARTICLE' | grep -q 'rel=\"canonical\" href=\"[^\"]*/\"'"
check "font is self-hosted, no CDN"         "! body '/$ARTICLE' | grep -qE 'fonts\.(googleapis|gstatic)\.com'"

echo
printf 'Passed %d, failed %d\n\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
