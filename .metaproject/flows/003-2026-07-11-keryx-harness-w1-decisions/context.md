# Context — Flow 003 (W1 decisions)

Collected by `keryx flow init` and enriched for W1.

## Frozen source of truth (read, cite, never rewrite)

- `docs/requirements/keryx-project-agent-harness/implementation-plan.md` — §W1
  task contract (D-01…D-04), global constraints, verification gates.
- `docs/requirements/keryx-project-agent-harness/brainstorm.md` §Selected
  Decisions — **D1** (Keryx owns lifecycle), **D2** (single-agent first),
  **D3** (event-sourced session core), **D4** (tool registry before prompt
  features), **D5** (policy is first-class), **D6** (evidence-backed
  completion), **D7** (deterministic floor), **D8** (existing contracts reused);
  §Critical Questions (8 deferred questions).
- `docs/requirements/keryx-project-agent-harness/prd.md` §Decisions and Open
  Questions (remediation baseline D1–D7; explicitly deferred questions),
  §Success Criteria (Release 0 / Release 1).
- `docs/requirements/keryx-project-agent-harness/specification.md` — scenario
  IDs S-02/S-04/S-06/S-08/S-09/S-11 and R0-*/R1-* referenced by the tasks.
- `security-protocol.md`, `provider-protocol.md`, `agent-protocol.md`,
  `artifact-lifecycle.md`, `acceptance.feature`.
- `schemas/` (35 schemas) — owning schemas for D-04 links:
  `model-request/model-response/model-error/provider-descriptor` (S-02),
  `branch-metadata` (S-08), `harness-child-contract-extension` (S-09),
  `policy-profile` (D-03), `harness-envelope`, `schema-version-registry.json`.

## Decision → task map (from implementation-plan.md §W1)

| Task | Freezes | Depends | Contracts / scenarios | Evidence & exit | Reviewer |
|---|---|---|---|---|---|
| D-01 | Release 0 scope + measurable success | — | README, PRD, R0-01…R0-03 | ADR + signed decision table; no unresolved R0 boundary | architecture |
| D-02 | single coordinator, ownership matrix, inward ports | D-01 | S-06, R1-03 | ownership/import matrix + contradiction check | architecture |
| D-03 | security profiles + required containment | D-01 | S-04, R1-01, M-02 | profile/isolation matrix + fail-closed decision | security |
| D-04 | D4–D6 provider state, branch model, child wire framing | D-01 | S-02, S-08, S-09 | decision records linked to schemas + research ledger | contract |

## Deferred — record as `OPEN`, never guess

Concrete first real provider + credential shape; per-role budget values beneath
global ceilings; artifact retention windows; exact compatibility migration for
moving the corpus harness to `src/eval/`.

## Deliverable location

`docs/decisions/keryx-harness/` — one ADR per task (`ADR-0001-d01-*` …
`ADR-0004-d04-*`) plus `decision-registry.md` and, for D-04, a
`research-ledger.md`. The frozen requirements package stays untouched.

## Operational

- keryx CLI = this repo: run via `bun ./src/cli.ts <cmd>` (no PATH binary).
- Worktree: `feature/keryx-harness-impl` from `main` (5b59b35). Never commit to `main`.
- State only via `keryx flow`; never hand-edit `flow.json` or frozen AC.
- Workers dispatched via `subagent-dispatch` → `subagent-result` (STATUS: first line).
