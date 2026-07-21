import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  loadSandboxDefaults,
  sandboxConfigPath,
  saveSandboxDefaults,
  sanitizeSandboxDefaults,
} from "./sandbox-config";

function tempDir(): string {
  return mkdtempSync(path.join(tmpdir(), "keryx-sbx-cfg-"));
}

// AC-P1-1
test("loadSandboxDefaults returns {} when no file exists", () => {
  expect(loadSandboxDefaults(tempDir())).toEqual({});
});

test("loadSandboxDefaults returns {} for malformed JSON without throwing", () => {
  const dir = tempDir();
  writeFileSync(sandboxConfigPath(dir), "{not-json", { mode: 0o600 });
  expect(loadSandboxDefaults(dir)).toEqual({});
});

// AC-P1-4
test("saveSandboxDefaults round-trip and mode 0600", () => {
  const dir = tempDir();
  saveSandboxDefaults({ shell: "workspace", maskMode: "auto", tlsTerminate: true }, dir);
  expect(loadSandboxDefaults(dir)).toEqual({
    shell: "workspace",
    maskMode: "auto",
    tlsTerminate: true,
  });
  const mode = statSync(sandboxConfigPath(dir)).mode & 0o777;
  expect(mode).toBe(0o600);
});

test("saveSandboxDefaults merges patches", () => {
  const dir = tempDir();
  saveSandboxDefaults({ shell: "strict" }, dir);
  saveSandboxDefaults({ maskMode: "manual" }, dir);
  expect(loadSandboxDefaults(dir)).toEqual({ shell: "strict", maskMode: "manual" });
});

// AC-P1-5
test("sanitize and save never accept secret-shaped keys", () => {
  const dirty = {
    shell: "workspace",
    DEEPSEEK_API_KEY: "sk-should-not-persist",
    apiKey: "nope",
    openrouterKey: "nope",
    maskMode: "auto",
  };
  expect(sanitizeSandboxDefaults(dirty)).toEqual({ shell: "workspace", maskMode: "auto" });

  const dir = tempDir();
  // Cast: simulate a caller stuffing secrets into the object
  saveSandboxDefaults(dirty as never, dir);
  const onDisk = readFileSync(sandboxConfigPath(dir), "utf8");
  expect(onDisk).not.toContain("sk-should-not-persist");
  expect(onDisk).not.toContain("apiKey");
  expect(onDisk).not.toContain("DEEPSEEK");
  expect(loadSandboxDefaults(dir)).toEqual({ shell: "workspace", maskMode: "auto" });
});

test("load drops secret keys already on disk", () => {
  const dir = tempDir();
  writeFileSync(
    sandboxConfigPath(dir),
    JSON.stringify({ shell: "1", DEEPSEEK_API_KEY: "sk-leak", maskMode: "off" }, null, 2),
    { mode: 0o600 },
  );
  expect(loadSandboxDefaults(dir)).toEqual({ shell: "1", maskMode: "off" });
});

test("sandboxConfigPath sits next to auth.json in the same dir", () => {
  const dir = tempDir();
  expect(sandboxConfigPath(dir)).toBe(path.join(dir, "sandbox.json"));
  expect(existsSync(sandboxConfigPath(dir))).toBe(false);
});

test("invalid enum values are ignored", () => {
  expect(sanitizeSandboxDefaults({ shell: "banana", maskMode: "maybe", tlsTerminate: "yes" })).toEqual({});
  expect(sanitizeSandboxDefaults({ tlsTerminate: false })).toEqual({ tlsTerminate: false });
});
