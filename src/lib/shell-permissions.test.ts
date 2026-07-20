import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  allowShellPattern,
  emptyShellPermissions,
  isShellCommandAllowed,
  loadShellPermissions,
  matchShellPattern,
  parseShellExecCommand,
  saveShellPermissions,
  suggestShellPatterns,
} from "./shell-permissions";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) {
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

function tempDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), "keryx-perms-"));
  dirs.push(d);
  return d;
}

test("matchShellPattern: exact, star, and question mark", () => {
  expect(matchShellPattern("keryx wiki index", "keryx wiki index")).toBe(true);
  expect(matchShellPattern("keryx wiki index", "keryx wiki collect")).toBe(false);
  expect(matchShellPattern("keryx *", "keryx wiki index")).toBe(true);
  expect(matchShellPattern("keryx *", "git status")).toBe(false);
  expect(matchShellPattern("git status*", "git status")).toBe(true);
  expect(matchShellPattern("git status*", "git status --short")).toBe(true);
  expect(matchShellPattern("ls ?", "ls a")).toBe(true);
  expect(matchShellPattern("ls ?", "ls ab")).toBe(false);
});

test("isShellCommandAllowed scans allow list", () => {
  const allow = ["keryx *", "git status"];
  expect(isShellCommandAllowed("keryx wiki index", allow)).toBe(true);
  expect(isShellCommandAllowed("git status", allow)).toBe(true);
  expect(isShellCommandAllowed("rm -rf /", allow)).toBe(false);
  expect(isShellCommandAllowed("", allow)).toBe(false);
});

test("suggestShellPatterns: exact + first-token prefix", () => {
  expect(suggestShellPatterns("keryx wiki index")).toEqual({
    exact: "keryx wiki index",
    prefix: "keryx *",
  });
  expect(suggestShellPatterns("  git   status  --short ")).toEqual({
    exact: "git status --short",
    prefix: "git *",
  });
});

test("parseShellExecCommand: JSON or raw", () => {
  expect(parseShellExecCommand(JSON.stringify({ command: "keryx wiki index" }))).toBe("keryx wiki index");
  expect(parseShellExecCommand("git status")).toBe("git status");
});

test("load/save/allowShellPattern round-trip", () => {
  const dir = tempDir();
  expect(loadShellPermissions(dir)).toEqual(emptyShellPermissions());
  allowShellPattern("keryx *", dir);
  allowShellPattern("keryx *", dir); // dedupe
  allowShellPattern("git status", dir);
  const loaded = loadShellPermissions(dir);
  expect(loaded.allow).toEqual(["keryx *", "git status"]);
  saveShellPermissions({ allow: ["bun test*"] }, dir);
  expect(loadShellPermissions(dir).allow).toEqual(["bun test*"]);
});
