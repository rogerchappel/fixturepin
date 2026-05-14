#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/tests/fixtures"
cat > "$TMP/tests/fixtures/user.json" <<'JSON'
{"id":1,"name":"Smoke"}
JSON
(
  cd "$TMP"
  node "$ROOT/dist/src/cli.js" init >/dev/null
  node "$ROOT/dist/src/cli.js" record >/dev/null
  node "$ROOT/dist/src/cli.js" scan >/dev/null
  node "$ROOT/dist/src/cli.js" report --write >/dev/null
  test -f .fixturepin/manifest.json
  test -f .fixturepin/report.md
  echo '{"id":2,"name":"Drift"}' > tests/fixtures/user.json
  if node "$ROOT/dist/src/cli.js" scan >/tmp/fixturepin-smoke.txt; then
    echo "expected drift exit code" >&2
    exit 1
  fi
  grep -q changed /tmp/fixturepin-smoke.txt
)
echo "fixturepin smoke ok"
