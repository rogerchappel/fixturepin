#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, loadConfig } from "./config.js";
import { scan, writeManifest } from "./manifest.js";
import { renderMarkdownReport, renderManifestSummary, writeReport } from "./report.js";
import type { OutputFormat } from "./types.js";

interface CliOptions {
  cwd: string;
  json: boolean;
  markdown: boolean;
  write: boolean;
}

const VERSION = "0.1.0";

export async function main(argv = process.argv.slice(2), cwd = process.cwd()): Promise<number> {
  const command = argv[0];
  const options: CliOptions = { cwd, json: argv.includes("--json"), markdown: argv.includes("--markdown"), write: argv.includes("--write") };
  if (!command || command === "help" || command === "--help" || command === "-h") return printHelp();
  if (command === "--version" || command === "version") return print(`${VERSION}\n`);
  if (command === "init") return init(options);
  if (command === "record") return record(options);
  if (command === "scan") return runScan(options);
  if (command === "report") return report(options);
  if (command === "doctor") return doctor(options);
  console.error(`Unknown command: ${command}`);
  return 1;
}

function init(options: CliOptions): number {
  const configPath = path.join(options.cwd, ".fixturepinrc.json");
  if (!existsSync(configPath)) writeFileSync(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`);
  mkdirSync(path.join(options.cwd, ".fixturepin"), { recursive: true });
  console.log("FixturePin initialized: .fixturepinrc.json");
  return 0;
}

function record(options: CliOptions): number {
  const config = loadConfig(options.cwd);
  const result = scan(options.cwd, config);
  writeManifest(options.cwd, result.manifest, config.manifestPath);
  writeReport(options.cwd, config.reportPath, renderMarkdownReport(result));
  return output(options, result, `Recorded ${renderManifestSummary(result.manifest)}\n`);
}

function runScan(options: CliOptions): number {
  const result = scan(options.cwd);
  const hasDrift = result.summary.added + result.summary.changed + result.summary.missing > 0;
  output(options, result, formatScanText(result));
  return hasDrift ? 2 : 0;
}

function report(options: CliOptions): number {
  const config = loadConfig(options.cwd);
  const result = scan(options.cwd, config);
  const markdown = renderMarkdownReport(result);
  if (options.write) writeReport(options.cwd, config.reportPath, markdown);
  if (options.json) return output(options, result, "");
  console.log(markdown);
  return 0;
}

function doctor(options: CliOptions): number {
  const config = loadConfig(options.cwd);
  const found = config.fixtureDirs.filter((dir) => existsSync(path.join(options.cwd, dir)));
  const lines = [
    "FixturePin doctor",
    `workspace: ${options.cwd}`,
    `manifest: ${config.manifestPath}`,
    `fixture dirs found: ${found.length ? found.join(", ") : "none"}`,
    "network: not used"
  ];
  console.log(lines.join("\n"));
  return found.length ? 0 : 1;
}

function formatScanText(result: ReturnType<typeof scan>): string {
  const lines = [`FixturePin scan: ${renderManifestSummary(result.manifest)}`];
  for (const diff of result.diffs.filter((item) => item.status !== "unchanged")) lines.push(`${diff.status.padEnd(7)} ${diff.path}`);
  if (lines.length === 1) lines.push("No fixture drift detected.");
  return `${lines.join("\n")}\n`;
}

function output(options: CliOptions, result: ReturnType<typeof scan>, text: string): number {
  const format: OutputFormat = options.json ? "json" : options.markdown ? "markdown" : "text";
  if (format === "json") console.log(JSON.stringify(result, null, 2));
  else if (format === "markdown") console.log(renderMarkdownReport(result));
  else process.stdout.write(text);
  return 0;
}

function printHelp(): number {
  console.log(`FixturePin — pin fixture integrity before tests lie quietly.\n\nUsage:\n  fixturepin init\n  fixturepin record [--json]\n  fixturepin scan [--json|--markdown]\n  fixturepin report [--write]\n  fixturepin doctor\n\nExit codes:\n  0 ok\n  1 command/config problem\n  2 scan detected fixture drift`);
  return 0;
}

function print(text: string): number {
  process.stdout.write(text);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
