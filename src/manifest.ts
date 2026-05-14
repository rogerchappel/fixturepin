import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadConfig, resolveInsideCwd } from "./config.js";
import { redactSecrets } from "./redact.js";
import { inferSchemaHint } from "./schema.js";
import type { DiffEntry, FixturePinConfig, Manifest, ManifestEntry, ScanResult } from "./types.js";
import { walkFiles } from "./walk.js";

export function buildManifest(cwd: string, config: FixturePinConfig = loadConfig(cwd)): Manifest {
  const entries: ManifestEntry[] = [];
  for (const dir of config.fixtureDirs) {
    resolveInsideCwd(cwd, dir, config.allowHome);
    for (const relative of walkFiles(cwd, dir, config.ignore)) {
      const absolute = path.join(cwd, relative);
      const raw = readFileSync(absolute);
      const { content, redacted } = redactSecrets(raw);
      const sha256 = createHash("sha256").update(content).digest("hex");
      entries.push({
        path: relative.split(path.sep).join("/"),
        bytes: raw.byteLength,
        sha256,
        redacted,
        schema: inferSchemaHint(relative, content)
      });
    }
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return {
    schemaVersion: 1,
    tool: "fixturepin",
    generatedAt: "1970-01-01T00:00:00.000Z",
    root: ".",
    fixtureDirs: config.fixtureDirs,
    entries
  };
}

export function readManifest(cwd: string, manifestPath = loadConfig(cwd).manifestPath): Manifest | undefined {
  const absolute = path.join(cwd, manifestPath);
  if (!existsSync(absolute)) return undefined;
  return JSON.parse(readFileSync(absolute, "utf8")) as Manifest;
}

export function writeManifest(cwd: string, manifest: Manifest, manifestPath = loadConfig(cwd).manifestPath): void {
  const absolute = path.join(cwd, manifestPath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function scan(cwd: string, config: FixturePinConfig = loadConfig(cwd)): ScanResult {
  const manifest = buildManifest(cwd, config);
  const previous = readManifest(cwd, config.manifestPath);
  const diffs = diffManifests(previous, manifest);
  const summary = { added: 0, changed: 0, missing: 0, unchanged: 0 } satisfies ScanResult["summary"];
  for (const diff of diffs) summary[diff.status] += 1;
  return { manifest, previous, diffs, summary };
}

export function diffManifests(previous: Manifest | undefined, current: Manifest): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const previousByPath = new Map(previous?.entries.map((entry) => [entry.path, entry]) ?? []);
  const currentByPath = new Map(current.entries.map((entry) => [entry.path, entry]));
  for (const entry of current.entries) {
    const old = previousByPath.get(entry.path);
    if (!old) diffs.push({ path: entry.path, status: "added", currentSha256: entry.sha256 });
    else if (old.sha256 !== entry.sha256) diffs.push({ path: entry.path, status: "changed", previousSha256: old.sha256, currentSha256: entry.sha256 });
    else diffs.push({ path: entry.path, status: "unchanged", previousSha256: old.sha256, currentSha256: entry.sha256 });
  }
  for (const entry of previous?.entries ?? []) {
    if (!currentByPath.has(entry.path)) diffs.push({ path: entry.path, status: "missing", previousSha256: entry.sha256 });
  }
  return diffs.sort((a, b) => `${a.status}:${a.path}`.localeCompare(`${b.status}:${b.path}`));
}
