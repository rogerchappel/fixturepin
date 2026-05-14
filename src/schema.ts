import type { SchemaHint } from "./types.js";

export function inferSchemaHint(filePath: string, content: Buffer): SchemaHint {
  if (content.includes(0)) return { kind: "binary" };
  const text = content.toString("utf8");
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".json")) return inferJson(text);
  if (lower.endsWith(".csv")) return inferCsv(text);
  return { kind: "text" };
}

function inferJson(text: string): SchemaHint {
  try {
    const value = JSON.parse(text) as unknown;
    if (Array.isArray(value)) {
      const fields = collectFields(value[0]);
      return { kind: "json-array", records: value.length, fields, topLevelType: "array" };
    }
    return { kind: "json", fields: collectFields(value), topLevelType: value === null ? "null" : typeof value };
  } catch {
    return { kind: "text" };
  }
}

function inferCsv(text: string): SchemaHint {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const fields = lines[0]?.split(",").map((field) => field.trim()).filter(Boolean) ?? [];
  return { kind: "csv", records: Math.max(0, lines.length - 1), fields };
}

function collectFields(value: unknown): string[] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return Object.keys(value as Record<string, unknown>).sort();
}
