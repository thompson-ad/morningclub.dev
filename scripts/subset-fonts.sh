#!/usr/bin/env bash
# Regenerate the two self-hosted Literata subsets in src/assets/fonts/.
#
# The build does NOT run this — the .woff2 outputs are committed, so a fresh
# clone builds with `npm ci && npm run build` and no Python toolchain (NFR-4).
# Run this only when the source fonts or the subset definition change.
#
# Requires: python3 with fonttools + brotli
#   python3 -m venv .venv && .venv/bin/pip install "fonttools[woff]" brotli
#
# Source: Literata variable (SIL OFL 1.1) from github.com/google/fonts.
# The opsz (7-72) and wght axes MUST survive subsetting (design brief §6.1).
#
# What opsz actually buys, measured rather than assumed: §6.1 justifies it as
# the thing that makes small text work in a serif. That reasoning is wrong. The
# alternative to keeping the axis is pinning it at a text size (~14) — which IS
# the caption drawing, so metadata and captions render identically either way.
# What the axis buys is the *display* end: at h1 size the interpolated drawing
# is finer and tighter, where a pinned-at-14 drawing is visibly heavier and
# wider. On a monochrome site with no imagery, headings are the design, so the
# axis earns its cost there — and only there. Don't keep it "for the captions".
#
# Sizing note: opsz is the expensive axis (~52 KB/face). Keeping it across a
# Latin-1 charset costs ~200 KB for both faces, well over the 140 KB budget
# (NFR-2). Rather than cut characters or drop opsz, we narrow the *wght* axis
# to the range the design actually uses — it stays a continuous axis, just a
# shorter one. Roman spans 400-560 (body 400 through h1 560); italic spans
# 400-425 (its only roles are standfirst, emphasis and captions, at body
# weight, and 425 is the dark-theme body weight from §6.2). Result: 133 KB.
# Widening either range means re-checking the budget.

set -euo pipefail

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/src/assets/fonts"
WORK_DIR="${TMPDIR:-/tmp}/literata-subset"
PYFTSUBSET="${PYFTSUBSET:-pyftsubset}"

ROMAN_URL="https://github.com/google/fonts/raw/main/ofl/literata/Literata%5Bopsz%2Cwght%5D.ttf"
ITALIC_URL="https://github.com/google/fonts/raw/main/ofl/literata/Literata-Italic%5Bopsz%2Cwght%5D.ttf"

# Latin + Latin-1 Supplement + the punctuation/symbol ranges the prose actually
# uses (smart quotes and dashes arrive via SmartyPants, so U+2000-206F matters).
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,\
U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2193,U+2212,\
U+2215,U+FEFF,U+FFFD"

# tnum is not in pyftsubset's default feature set, and the design brief sets
# `font-variant-numeric: tabular-nums` everywhere dates appear.
FEATURES="tnum"

mkdir -p "$OUT_DIR" "$WORK_DIR"

INSTANCER="${INSTANCER:-fonttools}"

subset() {
  local url="$1" src="$2" out="$3" wght="$4"
  [ -f "$WORK_DIR/$src" ] || curl -sSL -o "$WORK_DIR/$src" "$url"
  # Narrow wght to the used range; opsz is passed through untouched (7-72).
  "$INSTANCER" varLib.instancer -q -o "$WORK_DIR/inst-$src" "$WORK_DIR/$src" "wght=$wght"
  "$PYFTSUBSET" "$WORK_DIR/inst-$src" \
    --output-file="$OUT_DIR/$out" \
    --flavor=woff2 \
    --unicodes="$UNICODES" \
    --layout-features+="$FEATURES" \
    --name-IDs="0,1,2,3,4,5,6" \
    --drop-tables+=DSIG \
    --no-hinting
  printf '  %-24s wght %-9s %4s KB\n' "$out" "$wght" "$(( $(wc -c < "$OUT_DIR/$out") / 1024 ))"
}

echo "Subsetting Literata (opsz 7-72 retained on both faces):"
subset "$ROMAN_URL"  "Literata.ttf"        "literata-roman.woff2"  "400:560"
subset "$ITALIC_URL" "Literata-Italic.ttf" "literata-italic.woff2" "400:425"

total=$(( ($(wc -c < "$OUT_DIR/literata-roman.woff2") + \
           $(wc -c < "$OUT_DIR/literata-italic.woff2")) / 1024 ))
echo "  total: ${total} KB (budget: 140 KB, NFR-2)"
[ "$total" -le 140 ] || { echo "OVER BUDGET" >&2; exit 1; }
