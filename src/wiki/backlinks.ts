import path from "node:path";

// Backlinks — the missing half of the wiki knowledge graph (the Karpathy LLM-wiki
// pattern: knowledge compounds when links are bidirectional). Wiki pages already
// link OUT (to other pages + to code via the graph-generated `Related Code`
// section); this inverts those edges so any page or code file can answer "what
// references me". Pure over an in-memory page set; the command layer does IO and
// joins the result with the code graph (gdgraph) for code targets.

export interface WikiPageRef {
  // Path relative to the repo root, e.g. ".metaproject/wiki/architecture/x.md".
  repoPath: string;
  content: string;
}

const LINK = /\[[^\]]*\]\(([^)]+)\)/g;

// Extract local markdown link targets (skip external URLs and pure anchors).
export function extractLinks(content: string): string[] {
  const out: string[] = [];
  let match: RegExpExecArray | null;
  LINK.lastIndex = 0;
  while ((match = LINK.exec(content)) !== null) {
    const raw = (match[1] ?? "").trim().split(/\s+/)[0] ?? "";
    if (!raw || raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("#") || raw.startsWith("mailto:")) {
      continue;
    }
    out.push(raw);
  }
  return out;
}

// Resolve a link written in `fromRepoPath` to a repo-root-relative target,
// dropping any `#anchor`. Uses posix semantics so results are stable cross-OS.
export function resolveLink(fromRepoPath: string, raw: string): string {
  const clean = (raw.split("#")[0] ?? "").trim();
  if (!clean) return "";
  const fromDir = path.posix.dirname(fromRepoPath.split(path.sep).join("/"));
  return path.posix.normalize(path.posix.join(fromDir, clean));
}

// Build the reverse index: target repo-path -> sorted list of pages linking to it.
export function buildBacklinkIndex(pages: WikiPageRef[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const page of pages) {
    const from = page.repoPath.split(path.sep).join("/");
    for (const raw of extractLinks(page.content)) {
      const target = resolveLink(from, raw);
      if (!target) continue;
      const list = index.get(target) ?? [];
      if (!list.includes(from)) {
        list.push(from);
        index.set(target, list);
      }
    }
  }
  for (const list of index.values()) list.sort();
  return index;
}

// Pages that link to `targetRepoPath` (repo-root-relative, posix or native).
export function backlinksFor(index: Map<string, string[]>, targetRepoPath: string): string[] {
  const key = path.posix.normalize(targetRepoPath.split(path.sep).join("/"));
  return index.get(key) ?? [];
}
