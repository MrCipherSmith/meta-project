// In-memory tool registry for the Keryx harness (flow 007, W5 / P-02).
//
// Holds registered `ToolDefinition`s and produces deterministic, version-bound
// `ToolRegistrySnapshot`s (`tool-registry-snapshot.schema.json`). Hashing uses
// node built-ins only (`node:crypto` sha256 over canonical JSON) — no clock, no
// randomness, no network — so the same tool set always yields the same
// `registryHash`, independent of `snapshotId`/`createdAt`.

import { createHash } from "node:crypto";
import type { ToolDefinition, ToolRegistrySnapshot } from "./types";

/** Options for `ToolRegistry.snapshot`. */
export interface SnapshotOptions {
  snapshotId: string;
  createdAt: string;
}

/**
 * Deterministic canonical JSON: object keys are emitted in sorted order at every
 * level so structurally-equal values serialize identically regardless of
 * insertion order. Arrays keep their order (semantically significant).
 */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
  return `{${entries.join(",")}}`;
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Stable per-tool definition hash: sha256 over the tool's canonical JSON. Two
 * structurally-equal definitions hash identically.
 */
export function definitionHash(definition: ToolDefinition): string {
  return sha256(canonicalize(definition));
}

/**
 * Registry of tool definitions keyed by `toolId`. The model can only reach a
 * tool that has been `register`ed here; `validateToolCall` gates on membership.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  /** Register (or replace) a tool definition by its `toolId`. */
  register(definition: ToolDefinition): void {
    this.tools.set(definition.toolId, definition);
  }

  /** Return the registered definition for `toolId`, or `undefined`. */
  get(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  /** Whether a tool is registered under `toolId`. */
  has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  /** All registered definitions, in insertion order. */
  list(): ToolDefinition[] {
    return [...this.tools.values()];
  }

  /**
   * Produce an immutable snapshot. `registryHash` is a deterministic sha256 over
   * the tool set (each tool projected to `{toolId, version, definitionHash}` and
   * ordered by `toolId`), so it depends ONLY on the registered tools — not on
   * `snapshotId`/`createdAt` and not on registration order. `tools` carries the
   * full in-memory definitions; a wire projection maps them to the minimal
   * `{toolId, version, definitionHash}` records the snapshot schema requires.
   */
  snapshot(opts: SnapshotOptions): ToolRegistrySnapshot {
    const wireRecords = this.list()
      .map((definition) => ({
        toolId: definition.toolId,
        version: definition.version,
        definitionHash: definitionHash(definition),
      }))
      .sort((a, b) => (a.toolId < b.toolId ? -1 : a.toolId > b.toolId ? 1 : 0));

    const registryHash = sha256(canonicalize(wireRecords));

    return {
      schemaVersion: 1,
      snapshotId: opts.snapshotId,
      createdAt: opts.createdAt,
      registryHash,
      tools: this.list(),
    };
  }
}
