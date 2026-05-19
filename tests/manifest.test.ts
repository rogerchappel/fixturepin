import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, cpSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildManifest, scan, writeManifest } from "../src/index.js";

const fixtureRoot = path.join(process.cwd(), "tests", "fixtures");

function workspace(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "fixturepin-"));
  cpSync(fixtureRoot, path.join(dir, "tests", "fixtures"), { recursive: true });
  return dir;
}

test("buildManifest creates deterministic fixture entries with schema hints", () => {
  const cwd = workspace();
  const first = buildManifest(cwd);
  const second = buildManifest(cwd);
  assert.deepEqual(first, second);
  assert.equal(first.entries.length, 3);
  assert.equal(first.entries[0]?.path, "tests/fixtures/api/table.csv");
  assert.equal(first.entries.find((entry) => entry.path.endsWith("users.json"))?.schema.kind, "json-array");
});

test("secret-looking values are redacted before hashing", () => {
  const cwd = workspace();
  const manifest = buildManifest(cwd);
  const tokenEntry = manifest.entries.find((entry) => entry.path.endsWith("tokens.env"));
  assert.equal(tokenEntry?.redacted, true);
});

test("scan reports changed fixture drift against the pinned manifest", () => {
  const cwd = workspace();
  const original = buildManifest(cwd);
  writeManifest(cwd, original);
  writeFileSync(path.join(cwd, "tests", "fixtures", "api", "table.csv"), "id,name\n1,Ada\n");
  const result = scan(cwd);
  assert.equal(result.summary.changed, 1);
  assert.equal(result.diffs.some((diff) => diff.status === "changed" && diff.path.endsWith("table.csv")), true);
});

test("built CLI emits fixture-backed JSON scan output", () => {
  const cwd = workspace();
  execFileSync(process.execPath, [path.join(process.cwd(), "dist", "src", "cli.js"), "record"], { cwd });
  const output = execFileSync(process.execPath, [path.join(process.cwd(), "dist", "src", "cli.js"), "scan", "--json"], { cwd, encoding: "utf8" });
  const result = JSON.parse(output) as ReturnType<typeof scan>;
  assert.equal(result.summary.unchanged, 3);
  assert.equal(result.summary.changed, 0);
  assert.equal(result.manifest.entries.some((entry) => entry.path === "tests/fixtures/api/users.json"), true);
});
