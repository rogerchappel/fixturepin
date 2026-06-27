#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cd "$repo_root"
npm run build >/dev/null
npm pack --dry-run >/dev/null
npm pack --pack-destination "$tmp" >/dev/null

package_tgz="$(find "$tmp" -maxdepth 1 -name 'fixturepin-*.tgz' -print -quit)"
test -n "$package_tgz"

mkdir -p "$tmp/app"
cd "$tmp/app"
npm init -y >/dev/null
npm install "$package_tgz" >/dev/null

installed_version="$(./node_modules/.bin/fixturepin --version)"
test "$installed_version" = "$(node -p "require('./node_modules/fixturepin/package.json').version")"

mkdir -p tests/fixtures
printf '{"id":1,"name":"Packaged"}\n' > tests/fixtures/user.json
./node_modules/.bin/fixturepin init >/dev/null
./node_modules/.bin/fixturepin record >/dev/null
./node_modules/.bin/fixturepin scan >/dev/null
./node_modules/.bin/fixturepin report --write >/dev/null
test -s .fixturepin/manifest.json
test -s .fixturepin/report.md

printf '{"id":2,"name":"Drift"}\n' > tests/fixtures/user.json
if ./node_modules/.bin/fixturepin scan > "$tmp/drift.txt"; then
  echo "expected fixture drift exit code" >&2
  exit 1
fi
grep -q changed "$tmp/drift.txt"

echo 'fixturepin package smoke passed'
