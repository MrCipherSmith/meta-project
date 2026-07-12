// Tool-boundary port helpers for the Keryx harness (flow 007, W5 / P-02).
//
// Implements the registration gate and two-stage validation for the tool
// boundary specified in
// `docs/requirements/keryx-project-agent-harness/specification.md`
// ("Tool Definition", "Policy Decision") and `provider-protocol.md`
// ("Tool Call Semantics"). A tool call is only executable once it is (a)
// registered, (b) envelope-valid against `harness-tool-call.schema.json`, and
// (c) its `input` validates against the registered tool's inline `inputSchema`.
//
// Schema validation REUSES the W4 validator (`validateAgainstSchema` for the
// file-based envelope; `validateAgainstSchemaObject` for the inline input
// schema); this module adds no new dependency and imports no provider SDK.

import {
  type ValidationResult,
  validateAgainstSchema,
  validateAgainstSchemaObject,
} from "../../contracts/validator";
import type { ToolRegistry } from "./registry";
import type { ToolCall, ToolExecutorPort, ToolInvocation } from "./types";

export type { ToolExecutorPort, ToolInvocation };

/** Frozen wire schema for a tool-call envelope. */
const HARNESS_TOOL_CALL_SCHEMA = "harness-tool-call.schema.json";

/**
 * Validate a tool call for execution (AC3 gate). Returns `invalid` when:
 *   1. the named tool is not registered, OR
 *   2. the call envelope fails `harness-tool-call.schema.json`, OR
 *   3. the call `input` fails the registered tool's inline `inputSchema`.
 *
 * Only a call passing all three is `valid` — the required precondition before
 * any `ToolExecutorPort.invoke`. Errors from all failing stages are aggregated.
 */
export function validateToolCall(
  call: ToolCall,
  registry: ToolRegistry,
  schemaDir: string,
): ValidationResult {
  // Stage 1: envelope validation against the frozen wire schema.
  const envelope = validateAgainstSchema(HARNESS_TOOL_CALL_SCHEMA, call, { schemaDir });
  const errors = [...envelope.errors];

  // Stage 2: registration gate. An unregistered tool can never execute.
  const toolName = typeof call?.toolName === "string" ? call.toolName : undefined;
  const definition = toolName !== undefined ? registry.get(toolName) : undefined;
  if (definition === undefined) {
    errors.push({
      path: "$.toolName",
      message:
        toolName === undefined
          ? "Tool call is missing a toolName"
          : `Tool "${toolName}" is not registered`,
    });
    return { valid: false, errors };
  }

  // Stage 3: inline input-schema validation against the registered tool's
  // declared `inputSchema`, reusing the W4 validateNode core.
  const input = validateAgainstSchemaObject(definition.inputSchema, call.input, { schemaDir });
  errors.push(...input.errors);

  return { valid: errors.length === 0, errors };
}
