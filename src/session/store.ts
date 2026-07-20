// Per-project session store (MVP).
//
// - Sessions are isolated by project root (git toplevel or cwd).
// - transcript.jsonl is the source of truth for model history.
// - summary.json is an atomic index row for list/continue/resume.
// - continue/list only see the current project (hard isolation).

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { NormalizedMessage } from "../harness/provider/types";
import {
  projectKeyFromPath,
  projectSessionsDir,
  resolveProjectRoot,
  sessionDir as sessionDirPath,
} from "./paths";

export interface SessionSummary {
  id: string;
  projectKey: string;
  projectPath: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  provider?: string;
  model?: string;
  parentSessionId?: string;
}

export interface SessionHandle {
  summary: SessionSummary;
  dir: string;
}

export interface OpenSessionOptions {
  cwd: string;
  /** Resume this id (or unique prefix) within the project. */
  resumeId?: string;
  /** Continue the most recently updated session in the project. */
  continueLast?: boolean;
  /** Override data root (tests). */
  dataDir?: string;
  provider?: string;
  model?: string;
  /** Optional parent when forking (P1; accepted in summary only). */
  parentSessionId?: string;
}

interface TranscriptLine {
  role: NormalizedMessage["role"];
  content: string;
  provenance?: NormalizedMessage["provenance"];
  ts: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

function atomicWriteJson(file: string, value: unknown): void {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(tmp, file);
}

function readSummaryFile(file: string): SessionSummary | undefined {
  try {
    const raw = readFileSync(file, "utf8");
    const o = JSON.parse(raw) as Partial<SessionSummary>;
    if (typeof o.id !== "string" || typeof o.projectPath !== "string") {
      return undefined;
    }
    return {
      id: o.id,
      projectKey: typeof o.projectKey === "string" ? o.projectKey : "",
      projectPath: o.projectPath,
      title: typeof o.title === "string" && o.title.length > 0 ? o.title : "Untitled",
      createdAt: typeof o.createdAt === "string" ? o.createdAt : nowIso(),
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : nowIso(),
      messageCount: typeof o.messageCount === "number" ? o.messageCount : 0,
      ...(typeof o.provider === "string" ? { provider: o.provider } : {}),
      ...(typeof o.model === "string" ? { model: o.model } : {}),
      ...(typeof o.parentSessionId === "string" ? { parentSessionId: o.parentSessionId } : {}),
    };
  } catch {
    return undefined;
  }
}

/** Human title from the first user line. */
export function titleFromPrompt(content: string): string {
  const one = content.replace(/\s+/g, " ").trim();
  if (one.length === 0) {
    return "Untitled session";
  }
  return one.length > 60 ? `${one.slice(0, 57)}…` : one;
}

/** Short id for UI: last 8 hex chars of uuid. */
export function shortSessionId(id: string): string {
  const clean = id.replace(/-/g, "");
  return clean.length >= 8 ? clean.slice(-8) : id.slice(0, 8);
}

export function createSession(opts: {
  cwd: string;
  dataDir?: string;
  provider?: string;
  model?: string;
  title?: string;
  parentSessionId?: string;
  id?: string;
}): SessionHandle {
  const projectPath = resolveProjectRoot(opts.cwd);
  const projectKey = projectKeyFromPath(projectPath);
  const id = opts.id ?? randomUUID();
  const dir = sessionDirPath(projectPath, id, opts.dataDir);
  ensureDir(dir);
  const ts = nowIso();
  const summary: SessionSummary = {
    id,
    projectKey,
    projectPath,
    title: opts.title ?? "New session",
    createdAt: ts,
    updatedAt: ts,
    messageCount: 0,
    ...(opts.provider !== undefined ? { provider: opts.provider } : {}),
    ...(opts.model !== undefined ? { model: opts.model } : {}),
    ...(opts.parentSessionId !== undefined ? { parentSessionId: opts.parentSessionId } : {}),
  };
  atomicWriteJson(path.join(dir, "summary.json"), summary);
  writeFileSync(path.join(dir, "transcript.jsonl"), "", { encoding: "utf8", mode: 0o600 });
  // Project marker for humans / tooling.
  const marker = path.join(projectSessionsDir(projectPath, opts.dataDir), ".project.json");
  if (!existsSync(marker)) {
    atomicWriteJson(marker, { projectPath, projectKey, createdAt: ts });
  }
  return { summary, dir };
}

/** List sessions for a project only (isolation). Newest updated first. */
export function listSessions(cwd: string, dataDir?: string): SessionSummary[] {
  const projectPath = resolveProjectRoot(cwd);
  const root = projectSessionsDir(projectPath, dataDir);
  if (!existsSync(root)) {
    return [];
  }
  const out: SessionSummary[] = [];
  for (const name of readdirSync(root)) {
    if (name.startsWith(".")) {
      continue;
    }
    const summary = readSummaryFile(path.join(root, name, "summary.json"));
    if (summary === undefined) {
      continue;
    }
    // Hard isolation: skip if recorded project path mismatches (corrupt/moved).
    if (path.resolve(summary.projectPath) !== path.resolve(projectPath)) {
      continue;
    }
    out.push(summary);
  }
  out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
  return out;
}

export function latestSession(cwd: string, dataDir?: string): SessionSummary | undefined {
  return listSessions(cwd, dataDir)[0];
}

/**
 * Find by full id or unique prefix within the project.
 * Throws if the id exists only under another project (not returned by list).
 */
export function findSession(cwd: string, idOrPrefix: string, dataDir?: string): SessionSummary | undefined {
  const needle = idOrPrefix.trim();
  if (needle.length === 0) {
    return undefined;
  }
  const all = listSessions(cwd, dataDir);
  const exact = all.find((s) => s.id === needle);
  if (exact !== undefined) {
    return exact;
  }
  const matches = all.filter(
    (s) => s.id.startsWith(needle) || shortSessionId(s.id) === needle || s.title === needle,
  );
  if (matches.length === 1) {
    return matches[0];
  }
  return undefined;
}

export function loadTranscript(cwd: string, sessionId: string, dataDir?: string): NormalizedMessage[] {
  const projectPath = resolveProjectRoot(cwd);
  const file = path.join(sessionDirPath(projectPath, sessionId, dataDir), "transcript.jsonl");
  if (!existsSync(file)) {
    return [];
  }
  const lines = readFileSync(file, "utf8").split("\n");
  const out: NormalizedMessage[] = [];
  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }
    try {
      const o = JSON.parse(line) as TranscriptLine;
      if (
        o.role !== "system" &&
        o.role !== "user" &&
        o.role !== "assistant" &&
        o.role !== "tool"
      ) {
        continue;
      }
      if (typeof o.content !== "string") {
        continue;
      }
      out.push({
        role: o.role,
        content: o.content,
        ...(o.provenance === "trusted" ||
        o.provenance === "project" ||
        o.provenance === "model" ||
        o.provenance === "tool"
          ? { provenance: o.provenance }
          : {}),
      });
    } catch {
      // skip bad line
    }
  }
  return out;
}

/**
 * Replace the full transcript and refresh summary (MVP: rewrite after each turn).
 * Also sets title from the first user message when still default.
 */
export function persistHistory(
  handle: SessionHandle,
  history: readonly NormalizedMessage[],
  meta?: { provider?: string; model?: string; title?: string },
): SessionHandle {
  const ts = nowIso();
  const lines: string[] = [];
  for (const m of history) {
    const row: TranscriptLine = {
      role: m.role,
      content: m.content,
      ts,
      ...(m.provenance !== undefined ? { provenance: m.provenance } : {}),
    };
    lines.push(JSON.stringify(row));
  }
  const transcriptPath = path.join(handle.dir, "transcript.jsonl");
  const tmp = `${transcriptPath}.${process.pid}.tmp`;
  writeFileSync(tmp, lines.length > 0 ? `${lines.join("\n")}\n` : "", {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(tmp, transcriptPath);

  let title = meta?.title ?? handle.summary.title;
  if (title === "New session" || title === "Untitled session") {
    const firstUser = history.find((m) => m.role === "user");
    if (firstUser !== undefined) {
      title = titleFromPrompt(firstUser.content);
    }
  }

  const summary: SessionSummary = {
    ...handle.summary,
    title,
    updatedAt: ts,
    messageCount: history.length,
    ...(meta?.provider !== undefined ? { provider: meta.provider } : {}),
    ...(meta?.model !== undefined ? { model: meta.model } : {}),
  };
  atomicWriteJson(path.join(handle.dir, "summary.json"), summary);
  return { summary, dir: handle.dir };
}

export function renameSession(handle: SessionHandle, title: string): SessionHandle {
  const summary: SessionSummary = {
    ...handle.summary,
    title: title.trim().length > 0 ? title.trim() : handle.summary.title,
    updatedAt: nowIso(),
  };
  atomicWriteJson(path.join(handle.dir, "summary.json"), summary);
  return { summary, dir: handle.dir };
}

/**
 * Open or create a session according to continue/resume flags.
 * Isolation: resumeId is only resolved inside the current project.
 */
export function openSession(opts: OpenSessionOptions): {
  handle: SessionHandle;
  history: NormalizedMessage[];
  resumed: boolean;
} {
  const cwd = opts.cwd;
  const dataDir = opts.dataDir;

  if (opts.resumeId !== undefined && opts.resumeId.length > 0) {
    const found = findSession(cwd, opts.resumeId, dataDir);
    if (found === undefined) {
      throw new Error(
        `No session matching "${opts.resumeId}" in this project. ` +
          `Use \`keryx sessions list\` (sessions are per-project).`,
      );
    }
    const dir = sessionDirPath(resolveProjectRoot(cwd), found.id, dataDir);
    const handle: SessionHandle = { summary: found, dir };
    const history = loadTranscript(cwd, found.id, dataDir);
    return { handle, history, resumed: true };
  }

  if (opts.continueLast === true) {
    const last = latestSession(cwd, dataDir);
    if (last !== undefined) {
      const dir = sessionDirPath(resolveProjectRoot(cwd), last.id, dataDir);
      const handle: SessionHandle = { summary: last, dir };
      const history = loadTranscript(cwd, last.id, dataDir);
      return { handle, history, resumed: true };
    }
  }

  const handle = createSession({
    cwd,
    ...(dataDir !== undefined ? { dataDir } : {}),
    ...(opts.provider !== undefined ? { provider: opts.provider } : {}),
    ...(opts.model !== undefined ? { model: opts.model } : {}),
    ...(opts.parentSessionId !== undefined ? { parentSessionId: opts.parentSessionId } : {}),
  });
  return { handle, history: [], resumed: false };
}

/** Export transcript as markdown (human). */
export function exportSessionMarkdown(cwd: string, sessionId: string, dataDir?: string): string {
  const summary = findSession(cwd, sessionId, dataDir);
  const history = loadTranscript(cwd, summary?.id ?? sessionId, dataDir);
  const lines: string[] = [
    `# ${summary?.title ?? sessionId}`,
    "",
    `- id: \`${summary?.id ?? sessionId}\``,
    `- project: \`${summary?.projectPath ?? resolveProjectRoot(cwd)}\``,
    `- updated: ${summary?.updatedAt ?? ""}`,
    summary?.model !== undefined ? `- model: ${summary.provider ?? ""}/${summary.model}` : "",
    "",
    "---",
    "",
  ].filter((l) => l !== undefined);
  for (const m of history) {
    lines.push(`## ${m.role}`, "", m.content, "");
  }
  return lines.join("\n");
}
