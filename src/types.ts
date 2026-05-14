export type OutputFormat = "text" | "json" | "markdown";

export interface FixturePinConfig {
  fixtureDirs: string[];
  manifestPath: string;
  reportPath: string;
  ignore: string[];
  allowHome: boolean;
}

export interface SchemaHint {
  kind: "json" | "json-array" | "csv" | "text" | "binary";
  records?: number;
  fields?: string[];
  topLevelType?: string;
}

export interface ManifestEntry {
  path: string;
  bytes: number;
  sha256: string;
  redacted: boolean;
  schema: SchemaHint;
  note?: string;
}

export interface Manifest {
  schemaVersion: 1;
  tool: "fixturepin";
  generatedAt: string;
  root: string;
  fixtureDirs: string[];
  entries: ManifestEntry[];
}

export interface DiffEntry {
  path: string;
  status: "added" | "changed" | "missing" | "unchanged";
  previousSha256?: string;
  currentSha256?: string;
}

export interface ScanResult {
  manifest: Manifest;
  previous?: Manifest;
  diffs: DiffEntry[];
  summary: Record<DiffEntry["status"], number>;
}
