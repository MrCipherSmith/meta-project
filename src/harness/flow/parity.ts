// Completion parity (flow 014, W11 / FI-02).
//
// A SMALL, pure, deterministic helper that verifies the single-coordinator
// invariant end-to-end: the harness completion-gate outcome and the Task
// Manager task's persisted status/disposition must agree. Nothing here reads
// a clock, touches the filesystem, or performs network I/O — it is a pure
// function over an already-produced `FlowTask` and `CompletionGateResult`.
//
// Frozen acceptance (`docs/requirements/keryx-project-agent-harness/acceptance.feature`):
//   - @SC_R09_SINGLE_COORDINATOR: flow-orchestrator/Task Manager alone advances
//     task and completion state. This helper never advances anything itself;
//     it only reports whether a Task Manager-produced state agrees with the
//     gate that (per FI-01's `ManagedFlowPort`) drove it.
//   - @SC_R09_DIRECT_FLOW_FILE_EDIT_DENIED (D-02): pure comparison only — no
//     `fs`, no `flow.json` write, no dependency on `src/flow/store`.
//
// Parity rule — the harness gate and the Task Manager task must agree:
//   gate.status === "pass"    <=> task.status === "done" && task.disposition === "completed"
//   gate.status === "fail"    <=> task.disposition === "failed"
//   gate.status === "blocked" <=> task.disposition === "blocked" (undisposed blocker)
// A gate that is anything other than "pass" (fail, blocked, or the residual
// "unknown") must NEVER coincide with a completed task — that is the key
// safety assertion: a failing/blocked/unknown gate never yields a false
// "completed" disposition.

import type { FlowTask } from "../../flow/types";
import type { CompletionGateResult } from "../completion/gate";

/** The result of comparing a completion-gate outcome against a Task Manager task. */
export interface ParityResult {
  consistent: boolean;
  reason?: string;
}

/**
 * Compare a Task Manager `task` against the `gate` that (via the FI-01
 * `ManagedFlowPort`) should have produced it. Returns `{ consistent: true }`
 * when they agree per the parity rule above, otherwise `{ consistent: false,
 * reason }` describing the mismatch.
 */
export function completionParity(task: FlowTask, gate: CompletionGateResult): ParityResult {
  const taskCompleted = task.status === "done" && task.disposition === "completed";

  if (gate.status === "pass") {
    if (taskCompleted) {
      return { consistent: true };
    }
    return {
      consistent: false,
      reason:
        `gate status "pass" requires task status "done" and disposition "completed" ` +
        `(got status=${task.status}, disposition=${task.disposition ?? "none"})`,
    };
  }

  // Any non-"pass" gate (fail, blocked, unknown) must never coincide with a
  // completed task — the harness must never launder a failing/blocked gate
  // into a false "completed" disposition.
  if (taskCompleted) {
    return {
      consistent: false,
      reason: `gate status "${gate.status}" must not coincide with a completed task (status=done, disposition=completed)`,
    };
  }

  if (gate.status === "fail") {
    if (task.disposition === "failed") {
      return { consistent: true };
    }
    return {
      consistent: false,
      reason: `gate status "fail" requires task disposition "failed" (got disposition=${task.disposition ?? "none"})`,
    };
  }

  if (gate.status === "blocked") {
    if (task.disposition === "blocked") {
      return { consistent: true };
    }
    return {
      consistent: false,
      reason: `gate status "blocked" requires task disposition "blocked" (got disposition=${task.disposition ?? "none"})`,
    };
  }

  // gate.status === "unknown": the gate never reaches "pass" here (already
  // excluded above), so the only constraint is "never completed", which the
  // `taskCompleted` check above already enforces.
  return { consistent: true };
}

/**
 * True iff `gate` represents a failure disposition — a gate outcome the
 * Task Manager must never resolve to a "completed" task (fail, an
 * undisposed blocker, or the residual "unknown" status). Mirrors FI-01's
 * `gateToDisposition` default-to-"failed" behavior: only `"pass"` is a
 * non-failure disposition.
 */
export function isFailureDisposition(gate: CompletionGateResult): boolean {
  return gate.status !== "pass";
}
