// Shell command allowlist for the interactive agent (inspired by OpenCode /
// Claude Code / Grok Build permission models).
//
// - OpenCode: bash rules with `*` wildcards; ask UI offers once / always / reject;
//   "always" stores a command-prefix pattern for the session (or config).
// - Claude Code: `permissions.allow: ["Bash(npm run *)"]` with Tool(specifier)
//   patterns; deny > ask > allow.
// - Grok Build: always-approve mode + remembered "always allow" for common
//   command prefixes.
//
// keryx stores shell allow patterns in `~/.local/share/keryx/permissions.json`
// (same XDG base as auth.json). Default is ask (prompt). Never throws.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { shellConfigPath } from "./shell-config";

/** On-disk shell permission file shape. */
export interface ShellPermissions {
  /**
   * Glob patterns that auto-allow `shell_exec` without prompting.
   * Matching is case-sensitive; `*` / `?` wildcards (OpenCode-style).
   * Examples: `keryx wiki index`, `keryx *`, `git status*`.
   */
  allow: string[];
}

/** Empty permissions (prompt everything). */
export function emptyShellPermissions(): ShellPermissions {
  return { allow: [] };
}

/** Absolute path to `permissions.json` next to `auth.json`. */
export function shellPermissionsPath(dir?: string): string {
  return path.join(path.dirname(shellConfigPath(dir)), "permissions.json");
}

/** Load permissions; `{}` / empty allow on missing or corrupt file. Never throws. */
export function loadShellPermissions(dir?: string): ShellPermissions {
  try {
    const file = shellPermissionsPath(dir);
    if (!existsSync(file)) {
      return emptyShellPermissions();
    }
    const raw: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (raw === null || typeof raw !== "object") {
      return emptyShellPermissions();
    }
    const allowRaw = (raw as { allow?: unknown }).allow;
    const allow = Array.isArray(allowRaw)
      ? allowRaw.filter((p): p is string => typeof p === "string" && p.trim().length > 0).map((p) => p.trim())
      : [];
    return { allow };
  } catch {
    return emptyShellPermissions();
  }
}

/** Persist permissions (0600). Best-effort; never throws. */
export function saveShellPermissions(perms: ShellPermissions, dir?: string): void {
  try {
    const file = shellPermissionsPath(dir);
    mkdirSync(path.dirname(file), { recursive: true });
    const body: ShellPermissions = {
      allow: Array.from(new Set(perms.allow.map((p) => p.trim()).filter((p) => p.length > 0))),
    };
    writeFileSync(file, `${JSON.stringify(body, null, 2)}\n`, { mode: 0o600 });
  } catch {
    // best-effort
  }
}

/**
 * Append one allow pattern (deduped) and save. Best-effort; never throws.
 * Returns the pattern that was stored.
 */
export function allowShellPattern(pattern: string, dir?: string): string {
  const trimmed = pattern.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  const current = loadShellPermissions(dir);
  if (!current.allow.includes(trimmed)) {
    current.allow.push(trimmed);
    saveShellPermissions(current, dir);
  }
  return trimmed;
}

/**
 * OpenCode-style glob: `*` = any run of chars **including newlines** (heredoc /
 * multiline shell_exec), `?` = one char (any, including newline), other chars literal.
 * Pure.
 *
 * Note: JS `RegExp` `.` does not match `\n` by default — we map `*` → `[\s\S]*`
 * so remembered prefixes like `cat *` match `cat > file <<'EOF'\n…\nEOF`.
 */
export function matchShellPattern(pattern: string, command: string): boolean {
  const p = pattern.trim();
  const c = command.trim();
  if (p.length === 0) {
    return false;
  }
  // Escape regex specials except our wildcards, then map * / ?.
  let re = "";
  for (let i = 0; i < p.length; i++) {
    const ch = p[i]!;
    if (ch === "*") {
      // Dot-all: any run of characters including newlines.
      re += "[\\s\\S]*";
    } else if (ch === "?") {
      re += "[\\s\\S]";
    } else if (/[.+^${}()|[\]\\]/.test(ch)) {
      re += `\\${ch}`;
    } else {
      re += ch;
    }
  }
  try {
    return new RegExp(`^${re}$`).test(c);
  } catch {
    return p === c;
  }
}

/** True when `command` matches any allow pattern. Pure. */
export function isShellCommandAllowed(command: string, allow: readonly string[]): boolean {
  const cmd = command.trim();
  if (cmd.length === 0) {
    return false;
  }
  return allow.some((pat) => matchShellPattern(pat, cmd));
}

/**
 * Suggested patterns for the approval UI (OpenCode-style "always" grants).
 * - exact: full command (preserves newlines so heredoc matches on re-use)
 * - prefix: first token of the first line + ` *` (e.g. `keryx wiki index` → `keryx *`,
 *   multiline `cat > f <<EOF\n…` → `cat *`)
 */
export function suggestShellPatterns(command: string): { exact: string; prefix: string } {
  const trimmed = command.trim();
  // Preserve newlines for heredoc exact-match; collapse spaces on single-line only.
  const multiline = /[\r\n]/.test(trimmed);
  const exact = multiline ? trimmed : trimmed.replace(/\s+/g, " ");
  // First token from the first non-empty line only (ignore heredoc body).
  const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? trimmed;
  const collapsed = firstLine.replace(/\s+/g, " ").trim();
  const first = collapsed.split(" ")[0] ?? collapsed;
  const prefix = first.length > 0 ? `${first} *` : exact;
  return { exact, prefix };
}

/** Parse `shell_exec` tool input JSON (or a raw command string) → command text. */
export function parseShellExecCommand(inputJson: string): string {
  try {
    const parsed: unknown = JSON.parse(inputJson);
    if (parsed !== null && typeof parsed === "object" && typeof (parsed as { command?: unknown }).command === "string") {
      return (parsed as { command: string }).command.trim();
    }
  } catch {
    // raw string
  }
  return inputJson.trim();
}
