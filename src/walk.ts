import { readdirSync, statSync } from "node:fs";
import path from "node:path";

export function matchesIgnore(relativePath: string, patterns: string[]): boolean {
  const normalized = relativePath.split(path.sep).join("/");
  return patterns.some((pattern) => {
    const clean = pattern.replace(/\/\*\*$/, "");
    return normalized === clean || normalized.startsWith(`${clean}/`);
  });
}

export function walkFiles(root: string, relativeStart: string, ignore: string[]): string[] {
  const start = path.join(root, relativeStart);
  let stat;
  try {
    stat = statSync(start);
  } catch {
    return [];
  }
  if (stat.isFile()) return [relativeStart];
  if (!stat.isDirectory()) return [];
  const found: string[] = [];
  for (const name of readdirSync(start).sort()) {
    const relative = path.join(relativeStart, name);
    if (matchesIgnore(relative, ignore)) continue;
    const absolute = path.join(root, relative);
    const childStat = statSync(absolute);
    if (childStat.isDirectory()) found.push(...walkFiles(root, relative, ignore));
    if (childStat.isFile()) found.push(relative);
  }
  return found.sort((a, b) => a.localeCompare(b));
}
