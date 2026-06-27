import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const { version } = require("../../package.json") as { version: string };

test("CLI reports the package version", async () => {
  const { stdout } = await execFileAsync(process.execPath, ["dist/src/cli.js", "--version"]);
  assert.equal(stdout.trim(), version);
});

test("CLI help lists fixture drift commands", async () => {
  const { stdout } = await execFileAsync(process.execPath, ["dist/src/cli.js", "--help"]);
  assert.match(stdout, /fixturepin init/);
  assert.match(stdout, /fixturepin record/);
  assert.match(stdout, /fixturepin scan/);
});
