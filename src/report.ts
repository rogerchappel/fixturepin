import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Manifest, ScanResult } from "./types.js";

export function renderMarkdownReport(result: ScanResult): string {
  const lines = [
    "# FixturePin Report",
    "",
    `Fixture files: ${result.manifest.entries.length}`,
    `Added: ${result.summary.added} · Changed: ${result.summary.changed} · Missing: ${result.summary.missing} · Unchanged: ${result.summary.unchanged}`,
    "",
    "## Files",
    "",
    "| Status | Path | Schema | SHA-256 |",
    "| --- | --- | --- | --- |"
  ];
  for (const diff of result.diffs) {
    const entry = result.manifest.entries.find((item) => item.path === diff.path);
    lines.push(`| ${diff.status} | \`${diff.path}\` | ${entry?.schema.kind ?? "-"} | \`${(diff.currentSha256 ?? diff.previousSha256 ?? "").slice(0, 12)}\` |`);
  }
  lines.push("", "Generated locally by FixturePin. No network required.", "");
  return lines.join("\n");
}

export function renderManifestSummary(manifest: Manifest): string {
  return `${manifest.entries.length} fixture file(s) pinned across ${manifest.fixtureDirs.length} configured dir(s).`;
}

export function writeReport(cwd: string, reportPath: string, markdown: string): void {
  const absolute = path.join(cwd, reportPath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, markdown);
}
