// Tool-boundary types for the Keryx harness (flow 007, W5 / P-02).
//
// These types pin the tool contract specified in
// `docs/requirements/keryx-project-agent-harness/specification.md`
// ("Tool Definition", "Policy Decision") and `provider-protocol.md`
// ("Tool Call Semantics"). They are deliberately SDK-free and side-effect-free:
// no provider client package and no filesystem/shell surface is exposed here.
// The model reaches a tool ONLY via a registered `ToolDefinition` through the
// registry gate; there is no raw fs/shell method on `ToolExecutorPort`.

/**
 * Per-tool execution budget (`specification.md` -> "Tool Definition"). The wire
 * `tool-definition.schema.json#/properties/limits` pins `timeoutMs`,
 * `maxOutputBytes`, and `concurrencyKey`; the extra runtime knobs
 * (`maxOutputTokens`, `cancellable`) are in-memory-only budget carriage used by
 * a `ToolInvocation` and are not part of the durable wire record.
 */
export interface ToolLimits {
  timeoutMs: number;
  maxOutputBytes: number;
  concurrencyKey: string;
  /** In-memory-only: optional output token ceiling. */
  maxOutputTokens?: number;
  /** In-memory-only: whether this invocation honours cancellation. */
  cancellable?: boolean;
}

/**
 * In-memory-only capability classification for a tool. NOTE: this is NOT part of
 * `tool-definition.schema.json` (which is `additionalProperties: false` and does
 * not declare it); do not attempt to schema-validate it. It is a runtime policy
 * hint only.
 */
export interface ToolClassification {
  read: boolean;
  write: boolean;
  network: boolean;
  subprocess: boolean;
  credential: boolean;
}

/**
 * The seven risk classes (`tool-definition.schema.json#/properties/risk`).
 */
export type ToolRisk =
  | "read"
  | "write"
  | "shell"
  | "network"
  | "credential"
  | "delegate"
  | "destructive";

/** Replay disposition for a tool (`tool-definition.schema.json#/properties/replay`). */
export interface ToolReplay {
  deterministic: boolean;
  recordedResultSupported: boolean;
}

/**
 * A registered tool definition (`tool-definition.schema.json`). The
 * fixture-shaped fields (schemaVersion..replay) match the wire schema exactly;
 * `description` is optional per the schema. `classification` is an in-memory-only
 * extension (see {@link ToolClassification}) and is NOT part of the wire record.
 */
export interface ToolDefinition {
  schemaVersion: number;
  toolId: string;
  version: string;
  description?: string;
  /** JSON Schema for the tool input, validated inline before invoke. */
  inputSchema: Record<string, unknown>;
  /** JSON Schema for the tool output. */
  outputSchema: Record<string, unknown>;
  risk: ToolRisk;
  capabilities: string[];
  limits: ToolLimits;
  replay: ToolReplay;
  /** In-memory-only policy classification; not schema-bound. */
  classification?: ToolClassification;
}

/**
 * The provenance carried alongside a tool invocation (`specification.md` ->
 * "Policy Decision"). Ties a call to its project root, worktree, session, turn,
 * and originating tool-call id.
 */
export interface ToolProvenance {
  projectRoot: string;
  worktree: string;
  sessionId: string;
  turn: number;
  toolCallId: string;
}

/**
 * A normalized tool call envelope (`harness-tool-call.schema.json`). `input` is
 * validated against the registered tool's inline `inputSchema` before execution.
 */
export interface ToolCall {
  schemaVersion: number;
  toolCallId: string;
  toolName: string;
  toolVersion?: string;
  input: Record<string, unknown>;
  runId: string;
  sessionId: string;
  role?: string;
  risk: ToolRisk;
  projectRoot?: string;
  timeoutMs?: number;
  replayable?: boolean;
  origin?: "model" | "user" | "orchestrator" | "replay" | "system";
}

/** Causal identity triple (`harness-envelope.schema.json#/$defs/causalIds`). */
export interface CausalIds {
  runId: string;
  sessionId: string;
  correlationId: string;
}

/** Terminal / lifecycle states for a tool execution (`tool-execution-state.schema.json`). */
export type ToolExecutionStateValue =
  | "prepared"
  | "executing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "outcome-unknown"
  | "reconciled";

/**
 * Write-ahead tool execution state (`tool-execution-state.schema.json`). The
 * pinned in-memory shape carries the always-required fields; terminal states add
 * `finishedAt`/`toolResultId` (schema `if/then`) — those are permitted extra
 * fields (the schema does not set `additionalProperties: false` on them) and are
 * declared optional here so a constructed wire record can carry them.
 */
export interface ToolExecutionState {
  schemaVersion: number;
  executionId: string;
  toolCallId: string;
  causal: CausalIds;
  toolRegistryHash: string;
  inputHash: string;
  idempotencyKey: string;
  state: ToolExecutionStateValue;
  updatedAt: string;
  preparedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  receiptId?: string;
  toolResultId?: string;
}

/** Persisted bounded tool result (`tool-result.schema.json`). */
export interface ToolResult {
  schemaVersion: number;
  toolResultId: string;
  executionId: string;
  toolCallId: string;
  causal: CausalIds;
  status: string;
  outputHash: string;
  errorCode?: string;
  receiptId?: string;
  redaction: string;
  createdAt: string;
  evidenceRefs?: string[];
}

/**
 * A single invocation handed to a {@link ToolExecutorPort}. Carries the call,
 * its provenance, an optional per-invocation budget, and an optional
 * cancellation signal. NOTE: there is deliberately no fs/shell handle here.
 */
export interface ToolInvocation {
  call: ToolCall;
  provenance: ToolProvenance;
  budget?: ToolLimits;
  signal?: AbortSignal;
}

/**
 * The tool executor port (AC3). Its ONLY method is `invoke`; there is no
 * `readFile`/`exec`/`spawn`/`shell` surface. A registered, envelope-valid,
 * input-valid call is the precondition for execution — enforced by
 * `validateToolCall` ahead of any real `invoke`.
 */
export interface ToolExecutorPort {
  invoke(invocation: ToolInvocation): Promise<ToolResult>;
}

/**
 * The minimal wire record for a tool inside a registry snapshot
 * (`tool-registry-snapshot.schema.json#/properties/tools/items`).
 */
export interface ToolWireRecord {
  toolId: string;
  version: string;
  definitionHash: string;
}

/**
 * An immutable registry snapshot. NOTE: the pinned in-memory `tools` type is
 * `ToolDefinition[]` (the full registered definitions); the durable wire schema
 * instead requires each entry to be a {@link ToolWireRecord}. A wire projection
 * maps definitions to that minimal shape (see `ToolRegistry.snapshot`).
 */
export interface ToolRegistrySnapshot {
  schemaVersion: number;
  snapshotId: string;
  createdAt: string;
  registryHash: string;
  tools: ToolDefinition[];
}
