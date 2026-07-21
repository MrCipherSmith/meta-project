// Command risk classification for the interactive agent's shell gate (flow 115).
//
// WHAT THIS IS FOR
// ----------------
// `shell_exec` carries a single static `risk: "shell"`, so the policy engine and
// the approval UI cannot tell `ls` from `rm -rf /`. This module adds the missing
// per-COMMAND dimension: a pure, deterministic classifier that marks a command
// as `destructive` so the gate can ESCALATE the confirmation.
//
// WHAT THIS IS NOT
// ----------------
// It is NOT a security boundary and it MUST NOT be used to block a command.
// Any list of dangerous commands is incomplete by construction — a shell has
// unbounded ways to express the same destruction, and treating an "it passed the
// classifier" result as "this command is safe" would create exactly the false
// confidence this module is meant to avoid. See
// docs/decisions/keryx-harness/ADR-0008-destructive-command-escalation.md.
//
// The real boundaries are, in order:
//   1. the human approval gate (default-deny),
//   2. the metacharacter restriction on allowlist patterns (shell-permissions.ts),
//   3. OS containment when enabled (KERYX_SANDBOX_SHELL).
//
// This classifier only decides how LOUDLY to ask.
//
// Determinism: pure string analysis. No clock, RNG, filesystem, env, or network.

/** Risk class of a concrete command string. */
export type CommandRiskClass = "shell" | "destructive";

/** Separators that end one simple command inside a compound command line. */
type Separator = "|" | ";" | "&&" | "||" | "\n";

interface Segment {
  /** Raw text of this simple command (separators excluded). */
  raw: string;
  /** Quote-aware words. */
  words: string[];
  /** The separator that INTRODUCED this segment (undefined for the first). */
  precededBy?: Separator;
}

/**
 * Split a command line into simple-command segments, honouring single and
 * double quotes so a separator inside a quoted argument never splits.
 * `\` escapes the next character outside single quotes.
 */
function splitSegments(command: string): Segment[] {
  const segments: Segment[] = [];
  let buf = "";
  let pending: Separator | undefined;
  let quote: '"' | "'" | undefined;

  const flush = (next?: Separator): void => {
    const raw = buf.trim();
    if (raw.length > 0) {
      segments.push({ raw, words: splitWords(raw), ...(pending !== undefined ? { precededBy: pending } : {}) });
    }
    buf = "";
    pending = next;
  };

  for (let i = 0; i < command.length; i++) {
    const ch = command[i]!;
    const next = command[i + 1];

    if (quote !== undefined) {
      buf += ch;
      if (ch === quote) quote = undefined;
      else if (ch === "\\" && quote === '"' && next !== undefined) {
        buf += next;
        i++;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === "\\" && next !== undefined) {
      buf += ch + next;
      i++;
      continue;
    }
    if (ch === "&" && next === "&") {
      flush("&&");
      i++;
      continue;
    }
    if (ch === "|" && next === "|") {
      flush("||");
      i++;
      continue;
    }
    if (ch === "|") {
      flush("|");
      continue;
    }
    if (ch === ";") {
      flush(";");
      continue;
    }
    if (ch === "\n") {
      flush("\n");
      continue;
    }
    buf += ch;
  }
  flush();
  return segments;
}

/** Quote-aware word split; surrounding quotes are stripped from each word. */
function splitWords(text: string): string[] {
  const words: string[] = [];
  let buf = "";
  let quote: '"' | "'" | undefined;
  let started = false;

  const push = (): void => {
    if (started || buf.length > 0) words.push(buf);
    buf = "";
    started = false;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quote !== undefined) {
      if (ch === quote) quote = undefined;
      else buf += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (buf.length > 0 || started) push();
      continue;
    }
    buf += ch;
  }
  push();
  return words.filter((w) => w.length > 0 || false);
}

/** Drop leading `VAR=value` assignments so they cannot hide the command word. */
function commandWords(words: string[]): string[] {
  let i = 0;
  while (i < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i]!)) i++;
  return words.slice(i);
}

/** Basename of the command word: `/usr/bin/rm` → `rm`. */
function head(words: string[]): string {
  const first = commandWords(words)[0] ?? "";
  const base = first.split("/").pop() ?? first;
  return base.toLowerCase();
}

/** Positional (non-flag) arguments of a segment, command word excluded. */
function positionals(words: string[]): string[] {
  return commandWords(words)
    .slice(1)
    .filter((w) => !w.startsWith("-"));
}

/** All arguments (flags included), command word excluded. */
function args(words: string[]): string[] {
  return commandWords(words).slice(1);
}

/**
 * Paths whose recursive destruction is categorically different from deleting a
 * project directory. Matched EXACTLY (after trimming a trailing `/` or `/*`), so
 * `/var/folders/xyz` — a legitimate temp path — does not match `/var`.
 */
const CATASTROPHIC_TARGETS: ReadonlySet<string> = new Set([
  "/",
  ".",
  "~",
  "$home",
  "${home}",
  "/etc",
  "/usr",
  "/var",
  "/bin",
  "/sbin",
  "/lib",
  "/boot",
  "/opt",
  "/home",
  "/root",
  "/users",
  "/system",
  "/library",
  "/applications",
]);

/** True when an argument denotes the filesystem root, home, or a system root. */
function isCatastrophicTarget(arg: string): boolean {
  let t = arg.trim().toLowerCase();
  if (t.length === 0) return false;
  t = t.replace(/\/\*+$/, "").replace(/\/+$/, "");
  if (t.length === 0) t = "/"; // the trailing-slash trim ate a bare "/"
  return CATASTROPHIC_TARGETS.has(t);
}

const RECURSIVE_FLAG = /^-(?:[a-z]*r[a-z]*)$|^--recursive$/i;

function hasRecursive(words: string[]): boolean {
  return args(words).some((a) => RECURSIVE_FLAG.test(a));
}

/** Privilege-escalating command words. */
const PRIVILEGE: ReadonlySet<string> = new Set(["sudo", "doas", "su", "pkexec", "runas"]);

/** Command words that execute arbitrary script from stdin. */
const INTERPRETERS: ReadonlySet<string> = new Set([
  "sh", "bash", "zsh", "ksh", "dash", "fish",
  "python", "python2", "python3", "perl", "ruby", "node", "bun", "deno", "php", "lua",
]);

/** Command words that fetch remote content. */
const DOWNLOADERS: ReadonlySet<string> = new Set(["curl", "wget", "fetch", "aria2c", "httpie", "http"]);

/** Container runtimes whose flags can hand out the host. */
const CONTAINER_RUNTIMES: ReadonlySet<string> = new Set(["docker", "podman", "nerdctl"]);

/** Branches where a force push destroys shared history. */
const PROTECTED_BRANCHES: readonly string[] = ["main", "master", "develop", "development", "trunk"];

/** Block-device path (`/dev/sda`, `/dev/nvme0n1`, `/dev/disk2`), not `/dev/null`. */
const BLOCK_DEVICE = /\/dev\/(?:sd[a-z]|nvme\d|disk\d|hd[a-z]|vd[a-z]|mmcblk\d)/i;

/** Classify ONE simple command. */
function classifySegment(seg: Segment): boolean {
  const w = seg.words;
  const cmd = head(w);
  const a = args(w);
  const pos = positionals(w);

  // Privilege escalation is always escalated, whatever it runs.
  if (PRIVILEGE.has(cmd)) return true;

  // Writing onto a raw block device, by redirect or by dd.
  if (BLOCK_DEVICE.test(seg.raw) && /(?:^|\s)(?:>|>>)\s*\/dev\//.test(seg.raw)) return true;

  switch (cmd) {
    case "rm":
      return pos.some(isCatastrophicTarget);
    case "dd":
      return a.some((x) => /^of=/i.test(x) && BLOCK_DEVICE.test(x));
    case "chmod":
    case "chown":
    case "chgrp":
      return hasRecursive(w) && pos.some(isCatastrophicTarget);
    case "shutdown":
    case "reboot":
    case "halt":
    case "poweroff":
      return true;
    case "init":
      return pos.some((p) => p === "0" || p === "6");
    default:
      break;
  }

  // mkfs, mkfs.ext4, mkfs.xfs, …
  if (cmd === "mkfs" || cmd.startsWith("mkfs.")) return true;

  // Container escapes: these are equivalent to root on the host.
  if (CONTAINER_RUNTIMES.has(cmd)) {
    const joined = a.join(" ");
    if (/--privileged\b/.test(joined)) return true;
    if (/--pid[= ]host\b/.test(joined)) return true;
    if (/--(?:userns|ipc|uts|network|net)[= ]host\b/.test(joined)) return true;
    if (/docker\.sock/.test(joined)) return true;
    // Host-root bind mount: `-v /:/host`, `--volume /:/mnt`, `--mount …source=/,…`
    if (/(?:^|\s)(?:-v|--volume)[= ]\/:/.test(` ${joined}`)) return true;
    if (/source=\/(?:,|\s|$)/.test(joined)) return true;
  }

  // Force push: destructive against a protected branch, and ambiguous (therefore
  // escalated) when no explicit target is given — it pushes the current branch.
  if (cmd === "git" && pos.includes("push")) {
    const forced = a.some((x) => x === "-f" || x === "--force" || x.startsWith("--force-with-lease"));
    if (forced) {
      const after = pos.slice(pos.indexOf("push") + 1);
      if (after.length === 0) return true; // no remote/branch named
      const named = after.map((x) => x.split("/").pop()?.toLowerCase() ?? "");
      if (named.some((n) => PROTECTED_BRANCHES.includes(n))) return true;
      if (after.some((x) => /^refs\/heads\/(?:main|master|develop|trunk)$/i.test(x))) return true;
    }
  }

  return false;
}

/**
 * Classify a full command line. `destructive` when ANY simple command in the
 * chain is destructive, or when remote content is piped into an interpreter.
 * Pure and deterministic.
 */
export function classifyCommand(command: string): CommandRiskClass {
  if (command.trim().length === 0) return "shell";
  const segments = splitSegments(command);

  for (const seg of segments) {
    if (classifySegment(seg)) return "destructive";
  }

  // Cross-segment: `curl … | sh`. Only a PIPE counts — `curl …; sh script.sh`
  // is two unrelated commands.
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i]!;
    if (seg.precededBy !== "|") continue;
    if (!INTERPRETERS.has(head(seg.words))) continue;
    const upstream = segments.slice(0, i);
    if (upstream.some((s) => DOWNLOADERS.has(head(s.words)))) return "destructive";
  }

  return "shell";
}

/** Boolean projection of {@link classifyCommand}. Pure. */
export function isDestructiveCommand(command: string): boolean {
  return classifyCommand(command) === "destructive";
}
