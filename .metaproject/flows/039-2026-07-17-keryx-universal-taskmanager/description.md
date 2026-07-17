# Flow 039 — universal Task Manager surface (Phase 3 / MP-4)

Status: formalized
Source: docs/requirements/keryx-metaproject-native (MP-4). Driven via
flow-orchestrator. Builds on TM-01 (FlowState/FlowTask v1/v2) + ADR-0002 (D-02).

## Problem

The Task Manager model (FlowState/FlowTask, src/flow/types.ts) and the harness
bridge (ManagedFlowPort.gateToDisposition) are TypeScript-only. There is no
runtime JSON Schema for flow.json and no language-agnostic way for a non-keryx
runtime to validate/read flow state — so keryx is not yet a "universal" Task
Manager. A published, validating schema (v1 + v2) is the enabler.

## Expected Outcome

1. `src/flow/schema.ts`: exports `flowStateSchema()` — a JSON Schema for
   `FlowState`/`FlowTask` covering BOTH schemaVersion 1 and 2 (all v2 fields
   optional/additive). It validates every existing `.metaproject/flows/*/flow.json`
   (4 v1 + 35 v2) with zero failures.
2. `keryx flow schema [--out <path>]` — emit the schema (stdout or to a file),
   so any runtime can obtain and validate flow.json.
3. `keryx flow check` additionally validates each flow.json against the schema and
   reports violations (D-02 preserved: read/validate only, never writes flow.json).
4. The gate->disposition mapping (`gateToDisposition`) is exported and covered by a
   language-agnostic decision-table test (pass->completed, blocked->blocked,
   fail->failed, else->failed).
5. The docpack `schemas/flow-state.schema.json` is kept consistent with the runtime
   schema (a test asserts equality, or the emit regenerates it).

## Out of Scope

- No change to FlowState/FlowTask fields or the state machine. No hand-editing of
  flow.json (D-02). No new dependency. No multi-runtime authorization model
  (deferred). MP-6 policy enrichment is separate.
