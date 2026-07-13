// RED tests for P-02 (flow 007, W5 / T7).
//
// Pins the `ToolDefinition` / `ToolRegistry` / `ToolExecutorPort` contract
// specified in `docs/requirements/keryx-project-agent-harness/specification.md`
// ("Tool Definition", "the model must not receive direct filesystem or shell
// access outside registered tools", "Policy Decision") and
// `provider-protocol.md` ("Tool Call Semantics" — buffer until complete + JSON
// parses + validates against the registered tool schema + policy resolves).
// P-02 implements `src/harness/tool/types.ts`, `src/harness/tool/registry.ts`,
// and `src/harness/tool/tool-port.ts` to make this suite GREEN; until then the
// missing-module import is the expected RED failure.
//
// Deterministic: no Date.now(), no network, no randomness. Schema fixtures are
// copied verbatim from the frozen catalogs so this file has no runtime
// dependency on catalog structure beyond the values themselves.
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { validateAgainstSchema } from "../../contracts/validator";
import { ToolRegistry } from "./registry";
import { validateToolCall } from "./tool-port";
import type {
  ToolCall,
  ToolDefinition,
  ToolExecutionState,
  ToolExecutorPort,
  ToolInvocation,
  ToolLimits,
  ToolProvenance,
  ToolResult,
} from "./types";

// Frozen schemas dir, computed relative to this file
// (src/harness/tool/ -> repo root).
const SCHEMA_DIR = path.join(
  import.meta.dir,
  "..",
  "..",
  "..",
  "docs",
  "requirements",
  "keryx-project-agent-harness",
  "schemas",
);

const SHA256_FIXTURE = "a".repeat(64);

// --- Shared fixtures ----------------------------------------------------------
//
// Copied from docs/.../fixtures/positive-contract-catalog.json #/cases/tool-definition
// and #/cases/tool-call. `classification` is intentionally omitted from schema-bound
// fixtures below: tool-definition.schema.json has `additionalProperties: false` and does
// not declare a `classification` property, even though the pinned `ToolDefinition`
// TS interface carries an optional `classification?: ToolClassification`. That field is
// therefore an in-memory-only extension for now (see the "classification is
// representable" test below) — flag this delta back to P-02 if the wire contract should
// instead carry it.
const fixtureToolDef: ToolDefinition = {
  schemaVersion: 1,
  toolId: "fixture.read",
  version: "1.0.0",
  inputSchema: {},
  outputSchema: {},
  risk: "read",
  capabilities: ["read"],
  limits: { timeoutMs: 1, maxOutputBytes: 1, concurrencyKey: "fixture" },
  replay: { deterministic: true, recordedResultSupported: true },
};

// A second, schema-shaped tool whose inputSchema is non-trivial: used for the
// inline inputSchema validation matrix (item 3) and the executor-gate test (item 5).
const pathToolDef: ToolDefinition = {
  schemaVersion: 1,
  toolId: "fixture.path-read",
  version: "1.0.0",
  inputSchema: {
    type: "object",
    required: ["path"],
    properties: { path: { type: "string" } },
  },
  outputSchema: {},
  risk: "read",
  capabilities: ["read"],
  limits: { timeoutMs: 1000, maxOutputBytes: 4096, concurrencyKey: "fixture" },
  replay: { deterministic: true, recordedResultSupported: true },
};

const fixtureProvenance: ToolProvenance = {
  projectRoot: "/repo",
  worktree: "/repo/.worktrees/feature",
  sessionId: "session-1",
  turn: 3,
  toolCallId: "call-1",
};

function makeToolResult(toolCallId: string, status: string): ToolResult {
  return {
    schemaVersion: 1,
    toolResultId: `result-${toolCallId}`,
    executionId: `execution-${toolCallId}`,
    toolCallId,
    causal: { runId: "run-1", sessionId: "session-1", correlationId: "c-1" },
    status,
    outputHash: SHA256_FIXTURE,
    redaction: "not-needed",
    createdAt: "2026-01-01T00:00:01Z",
  };
}

// --- 1. Registry — register/get/has/list/snapshot ----------------------------

describe("ToolRegistry basic CRUD (specification.md 'Tool Definition')", () => {
  test("register/get/has/list round-trip a ToolDefinition", () => {
    const registry = new ToolRegistry();
    expect(registry.has(fixtureToolDef.toolId)).toBe(false);
    expect(registry.get(fixtureToolDef.toolId)).toBeUndefined();
    expect(registry.list()).toEqual([]);

    registry.register(fixtureToolDef);

    expect(registry.has(fixtureToolDef.toolId)).toBe(true);
    expect(registry.get(fixtureToolDef.toolId)).toEqual(fixtureToolDef);
    expect(registry.list()).toEqual([fixtureToolDef]);
  });

  test("has/get for an unregistered toolId is false/undefined", () => {
    const registry = new ToolRegistry();
    registry.register(fixtureToolDef);
    expect(registry.has("fixture.nonexistent")).toBe(false);
    expect(registry.get("fixture.nonexistent")).toBeUndefined();
  });
});

describe("ToolRegistry.snapshot — deterministic registryHash + schema validity", () => {
  test("snapshot({snapshotId, createdAt}) returns a ToolRegistrySnapshot shape", () => {
    const registry = new ToolRegistry();
    registry.register(fixtureToolDef);
    const snap = registry.snapshot({ snapshotId: "registry-1", createdAt: "2026-01-01T00:00:00Z" });

    expect(snap.schemaVersion).toBe(1);
    expect(snap.snapshotId).toBe("registry-1");
    expect(snap.createdAt).toBe("2026-01-01T00:00:00Z");
    expect(typeof snap.registryHash).toBe("string");
    expect(snap.registryHash).toMatch(/^[a-f0-9]{64}$/);
    expect(snap.tools).toEqual([fixtureToolDef]);
  });

  test("same tools produce the same registryHash across two registries, regardless of snapshotId/createdAt", () => {
    const registryA = new ToolRegistry();
    registryA.register(fixtureToolDef);
    const snapA = registryA.snapshot({ snapshotId: "registry-a", createdAt: "2026-01-01T00:00:00Z" });

    const registryB = new ToolRegistry();
    registryB.register(fixtureToolDef);
    const snapB = registryB.snapshot({ snapshotId: "registry-b", createdAt: "2026-06-01T00:00:00Z" });

    expect(snapB.registryHash).toBe(snapA.registryHash);
  });

  test("calling snapshot twice on an unchanged registry is deterministic (same registryHash)", () => {
    const registry = new ToolRegistry();
    registry.register(fixtureToolDef);
    const first = registry.snapshot({ snapshotId: "registry-1", createdAt: "2026-01-01T00:00:00Z" });
    const second = registry.snapshot({ snapshotId: "registry-2", createdAt: "2026-01-01T00:00:01Z" });
    expect(second.registryHash).toBe(first.registryHash);
  });

  test("different tools produce a different registryHash", () => {
    const registryA = new ToolRegistry();
    registryA.register(fixtureToolDef);
    const snapA = registryA.snapshot({ snapshotId: "registry-1", createdAt: "2026-01-01T00:00:00Z" });

    const registryB = new ToolRegistry();
    registryB.register(pathToolDef);
    const snapB = registryB.snapshot({ snapshotId: "registry-1", createdAt: "2026-01-01T00:00:00Z" });

    expect(snapB.registryHash).not.toBe(snapA.registryHash);
  });

  test("a wire-projected snapshot validates against tool-registry-snapshot.schema.json", () => {
    // NOTE for P-02 impl: the pinned `ToolRegistrySnapshot.tools` type is
    // `ToolDefinition[]`, but tool-registry-snapshot.schema.json requires each
    // `tools[]` entry to be the minimal wire record `{toolId, version,
    // definitionHash}` (`additionalProperties: false` — a full ToolDefinition
    // object, with its extra inputSchema/outputSchema/limits/etc fields, would
    // fail that schema directly). This test therefore validates a
    // wire-projected copy, standing in a fixture sha256 for the per-tool
    // definitionHash (which is not exposed on ToolDefinition itself). If P-02
    // instead exposes a real per-tool definitionHash, wire this projection to
    // it and report the delta.
    const registry = new ToolRegistry();
    registry.register(fixtureToolDef);
    const snap = registry.snapshot({ snapshotId: "registry-1", createdAt: "2026-01-01T00:00:00Z" });

    const wireSnapshot = {
      schemaVersion: snap.schemaVersion,
      snapshotId: snap.snapshotId,
      createdAt: snap.createdAt,
      registryHash: snap.registryHash,
      tools: snap.tools.map((tool) => ({
        toolId: tool.toolId,
        version: tool.version,
        definitionHash: SHA256_FIXTURE,
      })),
    };

    const result = validateAgainstSchema("tool-registry-snapshot.schema.json", wireSnapshot, {
      schemaDir: SCHEMA_DIR,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("a ToolDefinition (fixture-shaped) itself validates against tool-definition.schema.json", () => {
    const result = validateAgainstSchema("tool-definition.schema.json", fixtureToolDef, {
      schemaDir: SCHEMA_DIR,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

// --- 2. Envelope validation (harness-tool-call schema) ------------------------

describe("validateToolCall — envelope validation (provider-protocol.md 'Tool Call Semantics')", () => {
  test("accepts a valid harness-tool-call-shaped call for a registered tool", () => {
    const registry = new ToolRegistry();
    registry.register(fixtureToolDef);

    // Copied from docs/.../fixtures/positive-contract-catalog.json #/cases/tool-call.
    const validCall: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-1",
      toolName: "fixture.read",
      input: {},
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };

    const result = validateToolCall(validCall, registry, SCHEMA_DIR);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("rejects a call that violates the harness-tool-call schema (invalid risk enum value)", () => {
    const registry = new ToolRegistry();
    registry.register(fixtureToolDef);

    const invalidRiskCall = {
      schemaVersion: 1,
      toolCallId: "call-2",
      toolName: "fixture.read",
      input: {},
      runId: "run-1",
      sessionId: "session-1",
      risk: "not-a-real-risk",
    } as unknown as ToolCall;

    const result = validateToolCall(invalidRiskCall, registry, SCHEMA_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("rejects a call missing required envelope fields", () => {
    const registry = new ToolRegistry();
    registry.register(fixtureToolDef);

    const emptyCall = {} as unknown as ToolCall;
    const result = validateToolCall(emptyCall, registry, SCHEMA_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// --- 3. Inline inputSchema validation (tool-specific gate) --------------------

describe("validateToolCall — inline inputSchema validation beyond the envelope", () => {
  test("a call whose input satisfies the tool's inputSchema is valid", () => {
    const registry = new ToolRegistry();
    registry.register(pathToolDef);

    const call: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-3",
      toolName: "fixture.path-read",
      input: { path: "src/index.ts" },
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };

    const result = validateToolCall(call, registry, SCHEMA_DIR);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("a call whose input is missing the tool's required property is invalid", () => {
    const registry = new ToolRegistry();
    registry.register(pathToolDef);

    const call: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-4",
      toolName: "fixture.path-read",
      input: {},
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };

    const result = validateToolCall(call, registry, SCHEMA_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("a call whose input has the wrong type for the tool's required property is invalid", () => {
    const registry = new ToolRegistry();
    registry.register(pathToolDef);

    const call: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-5",
      toolName: "fixture.path-read",
      input: { path: 123 },
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };

    const result = validateToolCall(call, registry, SCHEMA_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// --- 4. Unregistered tool ------------------------------------------------------

describe("validateToolCall — unregistered tool is rejected", () => {
  test("a call naming a toolName not present in the registry is invalid", () => {
    const registry = new ToolRegistry();
    registry.register(fixtureToolDef);

    const call: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-6",
      toolName: "fixture.nonexistent",
      input: {},
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };

    const result = validateToolCall(call, registry, SCHEMA_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// --- 5. No fs/shell surface (AC3) ----------------------------------------------

describe("ToolExecutorPort — no raw fs/shell surface (AC3, specification.md 'the model must not receive direct filesystem or shell access outside registered tools')", () => {
  test("a fake ToolExecutorPort exposes only invoke — no readFile/exec/spawn/shell method", () => {
    const fakeExecutor: ToolExecutorPort = {
      invoke: async (inv) => makeToolResult(inv.call.toolCallId, "succeeded"),
    };

    expect(Object.keys(fakeExecutor)).toEqual(["invoke"]);

    const asRecord = fakeExecutor as unknown as Record<string, unknown>;
    const forbiddenSurface = [
      "readFile",
      "readFileSync",
      "writeFile",
      "exec",
      "execSync",
      "spawn",
      "spawnSync",
      "shell",
      "run",
    ];
    for (const member of forbiddenSurface) {
      expect(asRecord[member]).toBeUndefined();
    }
  });

  test("a schema-invalid or unregistered call cannot reach execution in a gated fake executor", async () => {
    const registry = new ToolRegistry();
    registry.register(pathToolDef);

    const executedCallIds: string[] = [];
    // A fake executor that only "executes" (records) a call once it has
    // separately been confirmed registered + envelope/input valid via
    // validateToolCall — modelling the required validation gate ahead of any
    // real invoke.
    const gatedExecutor: ToolExecutorPort = {
      invoke: async (inv) => {
        const check = validateToolCall(inv.call, registry, SCHEMA_DIR);
        if (check.valid) {
          executedCallIds.push(inv.call.toolCallId);
          return makeToolResult(inv.call.toolCallId, "succeeded");
        }
        return makeToolResult(inv.call.toolCallId, "policy-denied");
      },
    };

    const validCall: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-valid",
      toolName: "fixture.path-read",
      input: { path: "a" },
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };
    const unregisteredCall: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-unregistered",
      toolName: "fixture.nonexistent",
      input: {},
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };
    const envelopeInvalidCall = {
      schemaVersion: 1,
      toolCallId: "call-bad-envelope",
      toolName: "fixture.path-read",
      input: { path: "a" },
      runId: "run-1",
      sessionId: "session-1",
      risk: "not-a-real-risk",
    } as unknown as ToolCall;

    await gatedExecutor.invoke({ call: validCall, provenance: fixtureProvenance });
    await gatedExecutor.invoke({ call: unregisteredCall, provenance: fixtureProvenance });
    await gatedExecutor.invoke({ call: envelopeInvalidCall, provenance: fixtureProvenance });

    expect(executedCallIds).toEqual(["call-valid"]);
  });
});

// --- 6. Metadata carriage (provenance, budget, replay, ToolExecutionState) ----

describe("metadata carriage", () => {
  test("ToolInvocation carries provenance and budget (ToolLimits)", () => {
    const budget: ToolLimits = {
      timeoutMs: 5000,
      maxOutputBytes: 4096,
      maxOutputTokens: 2048,
      concurrencyKey: "fixture",
      cancellable: true,
    };
    const call: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-1",
      toolName: "fixture.read",
      input: {},
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };
    const invocation: ToolInvocation = { call, provenance: fixtureProvenance, budget };

    expect(invocation.provenance).toEqual(fixtureProvenance);
    expect(invocation.budget).toEqual(budget);
    expect(invocation.provenance.projectRoot).toBe("/repo");
    expect(invocation.provenance.worktree).toBe("/repo/.worktrees/feature");
    expect(invocation.provenance.sessionId).toBe("session-1");
    expect(invocation.provenance.turn).toBe(3);
    expect(invocation.provenance.toolCallId).toBe("call-1");
  });

  test("a ToolDefinition's replay flag is representable (deterministic / recordedResultSupported)", () => {
    expect(fixtureToolDef.replay).toEqual({ deterministic: true, recordedResultSupported: true });
  });

  test("a ToolClassification is representable on a ToolDefinition (in-memory extension; see snapshot delta note above)", () => {
    const classifiedDef: ToolDefinition = {
      ...fixtureToolDef,
      classification: { read: true, write: false, network: false, subprocess: false, credential: false },
    };
    expect(classifiedDef.classification).toEqual({
      read: true,
      write: false,
      network: false,
      subprocess: false,
      credential: false,
    });
  });

  test("ToolExecutionState is representable and (fixture-shaped, terminal state) validates against tool-execution-state.schema.json", () => {
    // Copied from docs/.../fixtures/positive-contract-catalog.json
    // #/cases/tool-execution-succeeded, split into the pinned TS shape plus
    // the extra terminal-state fields the schema's `allOf`/`if`/`then`
    // requires for state "succeeded" (finishedAt + toolResultId). The pinned
    // `ToolExecutionState` TS interface does not declare finishedAt/
    // toolResultId, but the schema does not set `additionalProperties: false`
    // here, so the wire record can carry both without conflict.
    const state: ToolExecutionState = {
      schemaVersion: 1,
      executionId: "execution-1",
      toolCallId: "call-1",
      causal: { runId: "run-1", sessionId: "session-1", correlationId: "c-1" },
      toolRegistryHash: SHA256_FIXTURE,
      inputHash: SHA256_FIXTURE,
      idempotencyKey: "1234567890123456",
      state: "succeeded",
      updatedAt: "2026-01-01T00:00:01Z",
    };

    expect(state.executionId).toBe("execution-1");
    expect(state.idempotencyKey.length).toBeGreaterThanOrEqual(16);

    const wireState = {
      ...state,
      finishedAt: "2026-01-01T00:00:01Z",
      toolResultId: "result-1",
    };
    const result = validateAgainstSchema("tool-execution-state.schema.json", wireState, {
      schemaDir: SCHEMA_DIR,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

// --- 7. Cancellation (ToolInvocation.signal) -----------------------------------

describe("cancellation — ToolInvocation.signal (AbortSignal)", () => {
  // NOTE: these tests assert only that an AbortSignal (and an already-aborted
  // one) is representable in the ToolInvocation shape. Whether/how a
  // ToolExecutorPort implementation actually short-circuits on an aborted
  // signal is left as an implementation detail for P-02 — not asserted here.
  test("a fresh, non-aborted AbortSignal is accepted on a ToolInvocation", () => {
    const controller = new AbortController();
    const call: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-1",
      toolName: "fixture.read",
      input: {},
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };
    const invocation: ToolInvocation = { call, provenance: fixtureProvenance, signal: controller.signal };

    expect(invocation.signal).toBeInstanceOf(AbortSignal);
    expect(invocation.signal?.aborted).toBe(false);
  });

  test("an already-aborted AbortSignal is representable on a ToolInvocation", () => {
    const controller = new AbortController();
    controller.abort();
    const call: ToolCall = {
      schemaVersion: 1,
      toolCallId: "call-1",
      toolName: "fixture.read",
      input: {},
      runId: "run-1",
      sessionId: "session-1",
      risk: "read",
    };
    const invocation: ToolInvocation = { call, provenance: fixtureProvenance, signal: controller.signal };

    expect(invocation.signal?.aborted).toBe(true);
  });
});
