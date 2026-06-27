# FixturePin 📌

Pin the fixture files your tests depend on, then fail fast when they drift quietly.

FixturePin is a local-first TypeScript CLI that records deterministic integrity manifests for fixture trees. It is for maintainers, test-heavy projects, and coding-agent workflows where a changed JSON blob or regenerated cassette can make tests pass for the wrong reason.

## Install

```bash
npm install --save-dev fixturepin
# or run from this repo during development
npm install && npm run build
```

## Quickstart

```bash
npx fixturepin init
npx fixturepin record
npx fixturepin scan
npx fixturepin --version
```

`record` writes:

- `.fixturepin/manifest.json` — deterministic machine-readable hashes and schema hints
- `.fixturepin/report.md` — a human-readable fixture inventory

Add `fixturepin scan` to CI before tests when you want fixture drift to be intentional.

## Commands

```bash
fixturepin init              # write .fixturepinrc.json
fixturepin record [--json]   # pin current fixture state
fixturepin scan [--json]     # compare current state with manifest
fixturepin report [--write]  # print or write a Markdown report
fixturepin doctor            # inspect local config and fixture dirs
fixturepin --version         # print the installed package version
```

Exit codes:

- `0` — ok
- `1` — command/config problem
- `2` — `scan` detected added, changed, or missing fixtures

## Practical examples

Pin checked-in fixtures:

```bash
fixturepin record
 git add .fixturepin/manifest.json .fixturepin/report.md
```

Review a suspected drift as JSON:

```bash
fixturepin scan --json | jq '.summary, .diffs[] | select(.status != "unchanged")'
```

Refresh after intentionally updating an API fixture:

```bash
npm test
fixturepin record
fixturepin report --write
```

Use custom fixture directories:

```json
{
  "fixtureDirs": ["tests/fixtures", "examples/cassettes"],
  "manifestPath": ".fixturepin/manifest.json",
  "reportPath": ".fixturepin/report.md",
  "ignore": ["**/*.tmp"],
  "allowHome": false
}
```


## CI example

Run `fixturepin scan` before the test suite so fixture drift is reviewed intentionally:

```yaml
name: fixture drift

on: [pull_request]

jobs:
  fixturepin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx fixturepin scan
      - run: npm test
```

If a fixture changed on purpose, run `fixturepin record`, commit the updated `.fixturepin/manifest.json`, and include the reason in the PR.

## Safety model

FixturePin does not require network access, does not upload repository content, and refuses to read outside the workspace unless `allowHome` is explicitly enabled. Defaults ignore `.git`, `node_modules`, build outputs, caches, and `.fixturepin` itself.

Before hashing text files, FixturePin redacts common token shapes such as GitHub tokens, OpenAI-style keys, AWS access key IDs, and `api_key`/`token`/`secret` assignments. The manifest stores hashes and lightweight schema hints, not raw fixture contents.

## JSON output notes

`fixturepin scan --json` returns:

- `manifest` — the current deterministic manifest
- `previous` — the pinned manifest when present
- `diffs` — per-path statuses: `added`, `changed`, `missing`, `unchanged`
- `summary` — counts by status

`generatedAt` is intentionally fixed to the Unix epoch in V1 so repeated scans of unchanged files produce stable output.

## Limitations

- V1 has simple ignore matching, not full gitignore semantics.
- Redaction is best-effort and pattern-based; do not commit real secrets as fixtures.
- Binary files are hashed but receive only a `binary` schema hint.
- FixturePin is a local gate, not a replacement for tests or code review.

## Development

Run the same checks locally before opening a change:

```sh
npm ci
npm run check
npm run build
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

`npm run package:smoke` packs the project, installs the tarball into a temporary
app, checks the installed binary version, records and scans a fixture tree, and
confirms intentional fixture drift exits non-zero.
