import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { FixturePinConfig } from "./types.js";

export const DEFAULT_CONFIG: FixturePinConfig = {
  fixtureDirs: ["test/fixtures", "tests/fixtures", "fixtures"],
  manifestPath: ".fixturepin/manifest.json",
  reportPath: ".fixturepin/report.md",
  ignore: [
    ".git/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    ".turbo/**",
    ".next/**",
    ".cache/**",
    ".fixturepin/**"
  ],
  allowHome: false
};

export function loadConfig(cwd: string): FixturePinConfig {
  const configPath = path.join(cwd, ".fixturepinrc.json");
  if (!existsSync(configPath)) return { ...DEFAULT_CONFIG, ignore: [...DEFAULT_CONFIG.ignore] };
  const parsed = JSON.parse(readFileSync(configPath, "utf8")) as Partial<FixturePinConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    fixtureDirs: parsed.fixtureDirs ?? DEFAULT_CONFIG.fixtureDirs,
    ignore: [...DEFAULT_CONFIG.ignore, ...(parsed.ignore ?? [])]
  };
}

export function resolveInsideCwd(cwd: string, input: string, allowHome = false): string {
  const resolved = path.resolve(cwd, input);
  const relative = path.relative(cwd, resolved);
  if (!allowHome && (relative.startsWith("..") || path.isAbsolute(relative))) {
    throw new Error(`Refusing to read outside workspace: ${input}`);
  }
  return resolved;
}
