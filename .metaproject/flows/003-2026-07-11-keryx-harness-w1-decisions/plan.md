# Implementation Plan — Flow 003 (W1 decisions)

Status: frozen scope (W1 only)

## Approach

W1 is documentation only: *freeze* four decisions already selected in the frozen
requirements package into reviewable, traceable decision records under
`docs/decisions/keryx-harness/`. No `src/` code, no tests, no other wave.

Each ADR: restates the decision from the frozen source, states the frozen
position (not a re-decision), enumerates consequences/constraints for later
waves, links back to README/PRD/spec/acceptance/schemas, and lists any residual
`OPEN` items (never guessed). D-02/D-03/D-04 add the required matrices and a
contradiction/consistency check against the spec.

## Worker routing & Model Policy (runbook)

| Task | Kind | Worker | Model | Rationale |
|---|---|---|---|---|
| T1 | context | (orchestrator inline) | Haiku-class | mechanical gather from frozen docs |
| T5 (D-01) | docs | job-documenter | **Haiku 4.5** | boundary enumeration from frozen README/PRD/spec |
| T6 (D-02) | docs | task-implementer(docs) | **Opus 4.8** | ownership/import matrix + contradiction check (logical) |
| T7 (D-03) | docs | task-implementer(docs) | **Opus 4.8** | security fail-closed decision (contentious) |
| T8 (D-04) | docs | task-implementer(docs) | **Opus 4.8** | schema-linked provider/branch/child framing (contract) |
| T9 | review | review-orchestrator | **Opus 4.8** | architecture/security/contract + consistency |
| T2/T3/T4 | umbrella | orchestrator | Opus | seed phases (implement/test/review) closed once specifics done |

Orchestrator = Opus 4.8 (this session). Workers dispatched via
`subagent-dispatch` → `subagent-result`.

## Steps

1. T1: assemble decision context (done in `context.md`).
2. T5 (D-01): Release 0 boundary ADR + measurable success criteria + signed
   decision table → `ADR-0001-d01-release0-boundary.md`.
3. T6 (D-02): ownership/import matrix + contradiction check →
   `ADR-0002-d02-single-coordinator-ownership.md`.
4. T7 (D-03): security profile/isolation matrix + fail-closed decision →
   `ADR-0003-d03-security-profiles-containment.md`.
5. T8 (D-04): provider-state/branch/child-wire decision records linked to
   schemas + `research-ledger.md` → `ADR-0004-d04-provider-branch-child.md`.
6. Maintain `decision-registry.md` (index + signed status per decision).
7. T9: consistency/contradiction review across the four ADRs vs frozen package;
   architecture/security/contract reviewer lenses.
8. `keryx health run`; confirm ACs; completion choice (ask user A/B/C).

## Verification (W1 has no code)

"Tests" = consistency/contradiction check + reviewer tracks, not unit tests.
TDD is inapplicable (no executable code). Verification gate: every decision
traceable to a frozen source, no contradiction with the spec, no `OPEN` item
silently resolved.

## Risks

- Re-deciding instead of freezing → mitigate by citing the frozen source in
  every ADR and running the contradiction check (T9).
- Scope creep into W2+ → out-of-scope list enforced; only W1 tasks in this flow.
- Accidentally editing the frozen requirements package → deliverables isolated
  in `docs/decisions/keryx-harness/`.
