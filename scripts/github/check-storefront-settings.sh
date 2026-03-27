#!/usr/bin/env bash
set -euo pipefail

repo="${1:-xiaojiou176-open/prooftrail}"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh is required"
  exit 2
fi

json="$(gh api "repos/${repo}")"

description="$(jq -r '.description // ""' <<<"$json")"
homepage="$(jq -r '.homepage // ""' <<<"$json")"
has_discussions="$(jq -r '.has_discussions' <<<"$json")"
topics="$(jq -r '.topics | join(",")' <<<"$json")"

echo "repo=${repo}"
echo "description=${description}"
echo "homepage=${homepage}"
echo "has_discussions=${has_discussions}"
echo "topics=${topics}"

failures=0

if [[ "$description" != "Auditable browser automation platform for repeatable runs, inspectable evidence, and recovery-ready workflows." ]]; then
  echo "fail: description is not aligned to storefront copy"
  failures=$((failures + 1))
fi

if [[ "$has_discussions" != "true" ]]; then
  echo "fail: discussions are not enabled"
  failures=$((failures + 1))
fi

if [[ -n "$homepage" ]]; then
  echo "fail: homepage should be blank until a real external docs/site exists"
  failures=$((failures + 1))
fi

for topic in browser-automation developer-tools e2e-testing fastapi mcp playwright reproducibility workflow-automation; do
  if [[ ",${topics}," != *",${topic},"* ]]; then
    echo "fail: missing topic ${topic}"
    failures=$((failures + 1))
  fi
done

echo "manual-check: verify GitHub Social Preview uses assets/storefront/prooftrail-social-preview.png"
echo "manual-check: verify community profile recognizes issue templates after next push"

if ((failures > 0)); then
  exit 1
fi

echo "storefront-settings ok"
