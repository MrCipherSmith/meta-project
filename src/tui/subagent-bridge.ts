// Fleet event bridge: spawn_subagent tool → TUI Workers panel.
// Tools are built before the TUI mounts; the shell registers a listener later.

export type SubagentFleetEvent =
  | { kind: "upsert"; id: string; label: string; status: "queued" | "running" | "done" | "failed" | "blocked"; detail?: string; model?: string }
  | { kind: "remove"; id: string };

let listener: ((e: SubagentFleetEvent) => void) | undefined;

export function setSubagentFleetListener(fn: ((e: SubagentFleetEvent) => void) | undefined): void {
  listener = fn;
}

export function emitSubagentFleet(event: SubagentFleetEvent): void {
  try {
    listener?.(event);
  } catch {
    // never break the agent turn
  }
}
