# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: `src/flow/schema.ts` exports `flowStateSchema()` returning a JSON Schema (object) describing `FlowState` + `FlowTask` for BOTH schemaVersion 1 and 2 (every v2-only field optional; no v1 field removed/required). A unit test validates EVERY existing `.metaproject/flows/*/flow.json` file against the schema via `validateAgainstSchemaObject` (src/contracts/validator.ts) with ZERO validation failures (covering the on-disk v1 and v2 flows), and rejects at least one negative fixture (a flow.json missing a required field).
- AC2: `keryx flow schema [--out <path>]` emits the schema JSON — to stdout by default, or written to `<path>` with `--out` — exiting 0; it is wired in `src/commands/flow.ts` and shown in `keryx flow --help`. The docpack `docs/requirements/keryx-metaproject-native/schemas/flow-state.schema.json` is consistent with the runtime schema (a test asserts the runtime `flowStateSchema()` deep-equals the committed docpack file, OR the emit regenerates it and the committed copy matches).
- AC3: `keryx flow check` additionally validates each on-disk `flow.json` against `flowStateSchema()` and reports any violation (without writing flow.json — the D-02 invariant is preserved). The `gateToDisposition` mapping is EXPORTED from its module and covered by a decision-table unit test asserting `pass`->`completed`, `blocked`->`blocked`, `fail`->`failed`, and any other -> `failed`.
- AC4: No regression / offline / deterministic — `tsc --noEmit` clean and full `bun test` >= the pre-change baseline of 1411 pass / 3 skip / 0 fail with new tests green and 0 fail; OFFLINE/deterministic; `dependencies` REMAINS `{}`; FlowState/FlowTask fields, the flow state machine, and existing flow behavior are UNCHANGED; no flow.json is written by the schema/validation path (D-02).
