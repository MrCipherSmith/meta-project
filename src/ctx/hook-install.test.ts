import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "bun:test";
import { CTX_HOOK_COMMAND, CTX_HOOK_SENTINEL } from "./hook";
import {
  ctxHookSettingsPath,
  installCtxHook,
  uninstallCtxHook,
  validateCtxHook,
} from "./hook-install";

type Settings = {
  hooks?: Record<string, Array<{ matcher?: string; hooks?: Array<{ command?: string }>; _keryxManaged?: string }>>;
  _keryxManaged?: unknown;
  [key: string]: unknown;
};

async function readSettings(root: string): Promise<Settings> {
  return JSON.parse(await readFile(ctxHookSettingsPath(root), "utf8")) as Settings;
}

function preToolUse(settings: Settings) {
  return settings.hooks?.PreToolUse ?? [];
}

async function withTempDir(run: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), "keryx-ctx-hook-"));
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("installs the Bash routing guard into an absent settings file", async () => {
  await withTempDir(async (root) => {
    await installCtxHook(root);
    const raw = await readFile(ctxHookSettingsPath(root), "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    const settings = JSON.parse(raw) as Settings;

    const group = preToolUse(settings).find((g) => g.matcher === "Bash");
    expect(group).toBeDefined();
    expect(group?._keryxManaged).toBe(CTX_HOOK_SENTINEL);
    expect(group?.hooks?.[0]?.command).toBe(CTX_HOOK_COMMAND);
    expect(settings._keryxManaged).toEqual([CTX_HOOK_SENTINEL]);
    expect(validateCtxHook(settings as Record<string, unknown>)).toEqual([]);
  });
});

test("is idempotent — re-install does not duplicate the managed group", async () => {
  await withTempDir(async (root) => {
    await installCtxHook(root);
    await installCtxHook(root);
    const settings = await readSettings(root);
    const managed = preToolUse(settings).filter((g) => g._keryxManaged === CTX_HOOK_SENTINEL);
    expect(managed).toHaveLength(1);
    expect((settings._keryxManaged as string[]).filter((v) => v === CTX_HOOK_SENTINEL)).toHaveLength(1);
  });
});

test("preserves user keys and coexists with security hooks", async () => {
  await withTempDir(async (root) => {
    await mkdir(path.join(root, ".claude"), { recursive: true });
    const userSettings = {
      model: "opus",
      permissions: { allow: ["Bash(ls:*)"] },
      hooks: {
        PreToolUse: [
          {
            matcher: "Write|Edit",
            hooks: [{ type: "command", command: "keryx security check-output" }],
            _keryxManaged: "security-agent-hooks",
          },
        ],
        UserPromptSubmit: [
          {
            hooks: [{ type: "command", command: "keryx security check-input --source untrusted-external" }],
            _keryxManaged: "security-agent-hooks",
          },
        ],
      },
      _keryxManaged: ["security-agent-hooks"],
    };
    await writeFile(ctxHookSettingsPath(root), `${JSON.stringify(userSettings, null, 2)}\n`, "utf8");

    await installCtxHook(root);
    const settings = await readSettings(root);

    // user key preserved
    expect(settings.model).toBe("opus");
    // security hooks untouched
    const security = preToolUse(settings).find((g) => g.matcher === "Write|Edit");
    expect(security?._keryxManaged).toBe("security-agent-hooks");
    expect(settings.hooks?.UserPromptSubmit?.[0]?._keryxManaged).toBe("security-agent-hooks");
    // ctx guard added alongside
    expect(preToolUse(settings).some((g) => g.matcher === "Bash")).toBe(true);
    // both sentinels present in the shared array
    expect(settings._keryxManaged).toEqual(["security-agent-hooks", CTX_HOOK_SENTINEL]);
  });
});

test("uninstall removes only the ctx group, leaving security hooks intact", async () => {
  await withTempDir(async (root) => {
    await mkdir(path.join(root, ".claude"), { recursive: true });
    const userSettings = {
      hooks: {
        PreToolUse: [
          {
            matcher: "Write|Edit",
            hooks: [{ type: "command", command: "keryx security check-output" }],
            _keryxManaged: "security-agent-hooks",
          },
        ],
      },
      _keryxManaged: ["security-agent-hooks"],
    };
    await writeFile(ctxHookSettingsPath(root), `${JSON.stringify(userSettings, null, 2)}\n`, "utf8");

    await installCtxHook(root);
    const removed = await uninstallCtxHook(root);
    expect(removed).toBe(true);

    const settings = await readSettings(root);
    expect(preToolUse(settings).some((g) => g.matcher === "Bash")).toBe(false);
    expect(preToolUse(settings).some((g) => g.matcher === "Write|Edit")).toBe(true);
    expect(settings._keryxManaged).toEqual(["security-agent-hooks"]);
  });
});

test("uninstall on an absent settings file returns false", async () => {
  await withTempDir(async (root) => {
    expect(await uninstallCtxHook(root)).toBe(false);
  });
});
