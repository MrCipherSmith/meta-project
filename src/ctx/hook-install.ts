import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "../lib/fs";
import { CTX_HOOK_COMMAND, CTX_HOOK_SENTINEL } from "./hook";

// Opt-in installer for the gdctx routing guard (Claude Code only). Mirrors the
// merge-safe discipline of the security agent-hooks installer: managed groups
// carry a sentinel so uninstall removes ONLY this installer's entry, re-install
// never duplicates, and every pre-existing key/entry (including the security
// hooks) is preserved untouched. Coexists with `security-agent-hooks` in the
// shared top-level `_keryxManaged` array.

const MANAGED_KEY = "_keryxManaged";
const PRE_TOOL_MATCHER = "Bash";

type Settings = Record<string, unknown>;

export function ctxHookSettingsPath(projectRoot: string): string {
  return path.join(projectRoot, ".claude", "settings.json");
}

function isCtxManagedGroup(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>)[MANAGED_KEY] === CTX_HOOK_SENTINEL
  );
}

function stripCtxManaged(existing: unknown): unknown[] {
  return Array.isArray(existing) ? existing.filter((g) => !isCtxManagedGroup(g)) : [];
}

function addSentinel(settings: Settings): void {
  const managed = Array.isArray(settings[MANAGED_KEY])
    ? (settings[MANAGED_KEY] as unknown[]).filter((v) => v !== CTX_HOOK_SENTINEL)
    : [];
  settings[MANAGED_KEY] = [...managed, CTX_HOOK_SENTINEL];
}

function removeSentinel(settings: Settings): void {
  if (!Array.isArray(settings[MANAGED_KEY])) {
    return;
  }
  const managed = (settings[MANAGED_KEY] as unknown[]).filter((v) => v !== CTX_HOOK_SENTINEL);
  if (managed.length > 0) {
    settings[MANAGED_KEY] = managed;
  } else {
    delete settings[MANAGED_KEY];
  }
}

function hooksObject(settings: Settings): Settings {
  return typeof settings.hooks === "object" &&
    settings.hooks !== null &&
    !Array.isArray(settings.hooks)
    ? { ...(settings.hooks as Settings) }
    : {};
}

// Merge the managed PreToolUse(Bash) guard group into `settings`, preserving all
// other content and staying idempotent.
export function mergeCtxHook(settings: Settings): Settings {
  const hooks = hooksObject(settings);
  hooks.PreToolUse = [
    ...stripCtxManaged(hooks.PreToolUse),
    {
      matcher: PRE_TOOL_MATCHER,
      hooks: [{ type: "command", command: CTX_HOOK_COMMAND }],
      [MANAGED_KEY]: CTX_HOOK_SENTINEL,
    },
  ];
  settings.hooks = hooks;
  addSentinel(settings);
  return settings;
}

// Remove ONLY the managed guard group + sentinel, preserving user content.
export function stripCtxHook(settings: Settings): Settings {
  if (
    typeof settings.hooks !== "object" ||
    settings.hooks === null ||
    Array.isArray(settings.hooks)
  ) {
    removeSentinel(settings);
    return settings;
  }
  const hooks = { ...(settings.hooks as Settings) };
  if (Array.isArray(hooks.PreToolUse)) {
    const remaining = stripCtxManaged(hooks.PreToolUse);
    if (remaining.length > 0) {
      hooks.PreToolUse = remaining;
    } else {
      delete hooks.PreToolUse;
    }
  }
  if (Object.keys(hooks).length > 0) {
    settings.hooks = hooks;
  } else {
    delete settings.hooks;
  }
  removeSentinel(settings);
  return settings;
}

// Structural validation: the rendered config routes a Bash PreToolUse hook to
// the ctx guard. Empty array = valid.
export function validateCtxHook(settings: Settings): string[] {
  const hooks = settings.hooks as Settings | undefined;
  const groups = Array.isArray(hooks?.PreToolUse) ? (hooks?.PreToolUse as unknown[]) : [];
  const found = groups.some((group) => {
    if (!group || typeof group !== "object") return false;
    const g = group as { matcher?: unknown; hooks?: unknown };
    if (g.matcher !== PRE_TOOL_MATCHER) return false;
    return (
      Array.isArray(g.hooks) &&
      (g.hooks as Array<{ command?: unknown }>).some((h) => h?.command === CTX_HOOK_COMMAND)
    );
  });
  return found ? [] : ["ctx: missing PreToolUse(Bash) routing-guard hook"];
}

async function readSettings(file: string): Promise<Settings> {
  if (!(await pathExists(file))) {
    return {};
  }
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Settings;
    }
    return {};
  } catch {
    throw new Error(`Cannot parse ${file}: file is not valid JSON`);
  }
}

async function writeSettings(file: string, settings: Settings): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

export async function installCtxHook(projectRoot: string): Promise<string> {
  const file = ctxHookSettingsPath(projectRoot);
  const settings = await readSettings(file);
  await writeSettings(file, mergeCtxHook(settings));
  return file;
}

export async function uninstallCtxHook(projectRoot: string): Promise<boolean> {
  const file = ctxHookSettingsPath(projectRoot);
  if (!(await pathExists(file))) {
    return false;
  }
  const settings = await readSettings(file);
  await writeSettings(file, stripCtxHook(settings));
  return true;
}
