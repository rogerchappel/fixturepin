# FixturePin Tasks

## V1 scaffold

- [x] Create StackForge OSS CLI skeleton.
- [x] Copy product PRD into `docs/PRD.md`.
- [x] Add TypeScript build, check, test, and smoke scripts.
- [x] Add safety and contributing metadata.

## CLI MVP

- [x] Implement `init` for `.fixturepinrc.json`.
- [x] Implement `record` to write deterministic JSON and Markdown.
- [x] Implement `scan` with drift exit code `2`.
- [x] Implement `report` and `doctor`.
- [x] Keep network access out of runtime behavior.

## Integrity model

- [x] Walk configured fixture directories deterministically.
- [x] Ignore repo internals, dependency folders, build outputs, caches, and FixturePin output.
- [x] Redact common secret patterns before hashing text files.
- [x] Infer schema hints for JSON arrays, JSON objects, CSV, text, and binary files.

## Validation

- [x] Add fixture-backed unit tests.
- [x] Add a real CLI smoke test that records, scans, reports, and detects drift.
- [ ] Expand ignore matching to full gitignore-style globs.
- [ ] Add manifest signing or attestation experiments after V1.
