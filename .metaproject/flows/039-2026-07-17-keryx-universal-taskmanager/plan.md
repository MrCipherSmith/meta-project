# Implementation Plan

Status: formalized

## Approach

Make the Task Manager schema a runtime artifact (single source: src/flow/schema.ts),
validate all on-disk flow.json against it, expose via `keryx flow schema`, wire into
`keryx flow check`, and export/test the gate->disposition table. Reuse the existing
src/contracts/validator.ts (validateAgainstSchemaObject). TDD via task-implementer.

## Steps

1. `src/flow/schema.ts`: `flowStateSchema()` JSON Schema (v1+v2). Keep it in sync
   with docs/requirements/keryx-metaproject-native/schemas/flow-state.schema.json
   (test asserts equality or the emit writes it).
2. Test: validate EVERY `.metaproject/flows/*/flow.json` against the schema (0 fail);
   negative cases (missing required field) rejected.
3. `keryx flow schema [--out <path>]` command (src/commands/flow.ts).
4. `keryx flow check`: additionally validate flow.json against the schema.
5. Export `gateToDisposition`; decision-table test.

## Risks

- Schema too strict/loose vs. real flow.json — driven by validating ALL on-disk
  files (v1 + v2) as the acceptance signal.
- Drift between runtime schema and docpack copy — a consistency test.
- D-02 — schema/validation is read-only; never writes flow.json.
