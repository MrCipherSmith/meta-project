// RED tests for TM-02 (flow 004, W2).
//
// Pins the task-level disposition & completion-gate semantics from
// `docs/decisions/keryx-harness/TM-01-task-manager-evolution.md` §6
// (Disposition and Status-Transition Rules) and §6.4 (Completion Gate Logic).
//
// TM-01 §7.2 assigns "task-level disposition transitions" to `machine.ts`
// ("likely orthogonal to flow-level machine"). This suite therefore expects a
// new PURE export from `./machine`:
//
//   export type TaskGateStatus = "not-terminal" | "terminal-pass" | "terminal-fail";
//   export function taskGateStatus(task: FlowTask): TaskGateStatus
//
// Deliberately NOT wired into `service.complete()` here: TM-01 §8 OPEN-4
// ("Disposition finalization policy") explicitly defers "when Task Manager
// finalizes a task's disposition" and the exact flow-level gate wiring to
// FI-01/FI-02 (Release 1). Testing through `service.complete()` would lock in
// behavior the frozen spec marks OPEN. This file only pins the deterministic,
// context-free mapping from (status, disposition) -> gate outcome per §6.4,
// which TM-01 fully specifies today.
import { expect, test } from "bun:test";
// TM-03 added `taskGateStatus` to ./machine; the RED-phase `@ts-expect-error`
// directive here is now obsolete (removed to keep `tsc --noEmit` clean, AC5).
import { taskGateStatus } from "./machine";
import type { FlowTask } from "./types";

// biome-ignore lint: v2 disposition field not yet on FlowTask type; TM-03 adds it
function task(overrides: Record<string, unknown>): FlowTask & { disposition?: string } {
  return {
    id: "T1",
    title: "Some task",
    kind: "implement",
    status: "todo",
    ...overrides,
  } as FlowTask & { disposition?: string };
}

test("status 'todo' is never terminal for the completion gate (TM-01 §6.4)", () => {
  expect(taskGateStatus(task({ status: "todo" }))).toBe("not-terminal");
});

test("status 'in-progress' is never terminal for the completion gate (TM-01 §6.4)", () => {
  expect(taskGateStatus(task({ status: "in-progress" }))).toBe("not-terminal");
});

test("done + disposition undefined is treated as implicit 'completed' -> terminal-pass (TM-01 §6.3 v1 compat, §6.4)", () => {
  expect(taskGateStatus(task({ status: "done" }))).toBe("terminal-pass");
});

test("done + disposition 'completed' -> terminal-pass (TM-01 §6.2/§6.4)", () => {
  expect(taskGateStatus(task({ status: "done", disposition: "completed" }))).toBe("terminal-pass");
});

test("done + disposition 'skipped' -> terminal-pass; intentional omission does not block flow completion (TM-01 §6.2)", () => {
  expect(taskGateStatus(task({ status: "done", disposition: "skipped" }))).toBe("terminal-pass");
});

test("done + disposition 'blocked' -> terminal-pass; explicit external blocker recorded, does not gate-fail (TM-01 §6.2/§6.4)", () => {
  expect(taskGateStatus(task({ status: "done", disposition: "blocked" }))).toBe("terminal-pass");
});

test("done + disposition 'failed' -> terminal-fail; explicit failure requires review/fix (TM-01 §6.2/§6.4)", () => {
  expect(taskGateStatus(task({ status: "done", disposition: "failed" }))).toBe("terminal-fail");
});

test("disposition is immutable-by-contract once set (TM-01 §6.3) - documented via a second read returning the same value", () => {
  const failed = task({ status: "done", disposition: "failed" });
  expect(taskGateStatus(failed)).toBe("terminal-fail");
  expect(taskGateStatus(failed)).toBe("terminal-fail"); // pure function: stable across calls
});
