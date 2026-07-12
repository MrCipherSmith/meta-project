import type { FlowStatus, FlowTask } from "./types";

// Strict status state machine (spec section 6). The CLI is the only writer of
// flow state, and every transition must be listed here.
const TRANSITIONS: Record<FlowStatus, FlowStatus[]> = {
  initializing: ["ready", "blocked"],
  ready: ["in-progress", "blocked"],
  "in-progress": ["implemented", "blocked"],
  implemented: ["completing", "blocked"],
  completing: ["done", "in-progress", "blocked"],
  blocked: [], // unblock restores previousStatus explicitly
  done: [],
};

export function canTransition(from: FlowStatus, to: FlowStatus): boolean {
  if (to === "blocked") {
    return from !== "done" && from !== "blocked";
  }
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: FlowStatus, to: FlowStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid flow transition: ${from} -> ${to}. Allowed from ${from}: ${[
        ...(TRANSITIONS[from] ?? []),
        ...(from !== "done" && from !== "blocked" ? ["blocked"] : []),
      ].join(", ") || "(none)"}`,
    );
  }
}

// --- Task-level completion-gate mapping (TM-01 §6.4) ---
//
// Pure, context-free mapping from a task's (status, disposition) to its gate
// outcome. Deliberately NOT wired into `service.complete()`: TM-01 §8 OPEN-4
// defers disposition finalization + flow-level gate wiring to FI-01/FI-02.
export type TaskGateStatus = "not-terminal" | "terminal-pass" | "terminal-fail";

export function taskGateStatus(task: FlowTask): TaskGateStatus {
  if (task.status !== "done") {
    return "not-terminal";
  }
  // status "done": disposition clarifies HOW it ended. Absent disposition is
  // treated as implicit "completed" (v1 compat). Only "failed" gate-fails.
  return task.disposition === "failed" ? "terminal-fail" : "terminal-pass";
}
