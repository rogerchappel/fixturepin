# FixturePin Orchestration

FixturePin is intentionally boring to orchestrate: run it locally, inspect the manifest, and fail before tests if fixtures drifted without review.

## Suggested CI order

1. Install dependencies.
2. Build FixturePin or install it from npm.
3. Run `fixturepin scan`.
4. Run the project test suite.

`fixturepin scan` exits with code `2` when fixtures were added, changed, or removed compared with `.fixturepin/manifest.json`.

## Agent workflow

For coding agents and maintenance bots:

1. Run `fixturepin scan --json` before modifying tests.
2. If drift exists, report it before touching files.
3. After intentional fixture changes, run tests.
4. Run `fixturepin record` and include `.fixturepin/manifest.json` plus `.fixturepin/report.md` in the review.
5. Explain why fixture changes were expected.

## Local-only contract

FixturePin does not call external APIs. Generated artifacts are deterministic and safe to review in a pull request, subject to the redaction limitations in the README.
