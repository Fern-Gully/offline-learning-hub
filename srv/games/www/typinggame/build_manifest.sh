#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WL="$DIR/wordlists"
OUT="$WL/index.json"
echo '{ "wordlists": [' > "$OUT"
first=1
shopt -s nullglob
for f in "$WL"/*.txt; do
  fname="$(basename "$f")"
  title="$(echo "$fname" | sed -E 's/\.txt$//' | sed -E 's/[_-]+/ /g' | sed -E 's/\b(.)/\U\1/g')"
  count=$(grep -cve '^\s*$' "$f" || true)
  if [ $first -eq 0 ]; then echo ',' >> "$OUT"; fi
  first=0
  printf '  { "id":"%s", "filename":"%s", "title":"%s", "count":%d }' "$fname" "$fname" "$title" "$count" >> "$OUT"
done
echo '] }' >> "$OUT"
echo "Wrote $OUT"
