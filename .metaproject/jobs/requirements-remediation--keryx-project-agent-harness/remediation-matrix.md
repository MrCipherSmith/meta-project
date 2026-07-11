# Remediation Matrix
Version: 1.2.0

Phase 1 deliverable. One row per deduplicated root finding. No finding is
dropped without an explicit disposition. Verification method names the Phase 11
check and/or Phase 12 reviewer track that must confirm closure.

Legend — Completion status: `open` → not started; `in-progress` → edits started;
`done-pending-review` → edits complete, awaiting re-review; `resolved` → closed by
new managed review. Final status below is `resolved` after review iteration 2.

---

## S-01 — BLOCKER — Readiness asserted before release-shaping decisions exist

| Aspect | Detail |
|---|---|
| Root finding | Package/roadmap say "specification ready" while sandbox, headless approval, completion-evidence, child isolation, schema-migration, and ownership decisions are OPEN. |
| Affected files | `README.md`, `prd.md`, `roadmap.md`, `brainstorm.md`, `implementation-plan.md` (Phase 0), `specification.md` (Status). |
| Required decision | D1 (Release 0 boundary), plus explicit Decisions & Open Questions section; adopt D2–D7 as resolved ADR-level decisions. |
| Required schema/contract | none new; status/decision prose only. |
| Gherkin coverage | none directly; covered indirectly by release-gate scenarios. |
| Impl-plan impact | Phase 0 becomes decision/ADR gate wave (Wave 1 of new plan). |
| Verification | Phase 11 "roadmap/status matches evidence"; docpack-review consistency; strict synthesis. |
| Disposition | Fix — downgrade status to `draft — decision pending`; record decisions + remaining open questions. |
| Status | resolved |

## S-02 — BLOCKER — No canonical durable event/session/provider contract

| Aspect | Detail |
|---|---|
| Root finding | Event vocabulary incomplete, `payload` unconstrained, causal ids optional; session/provider/checkpoint/branch/compaction/evidence/approval/tool-result schemas missing. |
| Affected files | `schemas/harness-event.schema.json` + new schemas; `specification.md` (Core Runtime Contracts, Session, Storage), `provider-protocol.md`, `artifact-lifecycle.md`; `contract-inventory.md`. |
| Required decision | D4 (local log authoritative), D5 (append-only tree). |
| Required schema/contract | Shared versioned envelope (`$defs`); discriminated event payload union with required causal ids; new: session-manifest, session-entry, provider-descriptor, model-request/response/error, checkpoint, branch-metadata, compaction-entry, evidence-record/ledger; positive/negative/migration fixtures. |
| Gherkin coverage | append-only session, compaction, provider-neutral events, replay scenarios + negatives (malformed stream, migration). |
| Impl-plan impact | Contracts/validator/fixtures wave before ports/fakes. |
| Verification | Phase 11 JSON parse + validator keyword coverage + fixture matrix; contract/schema reviewer; strict. |
| Disposition | Fix — add canonical contract inventory and the missing durable schemas + fixtures. |
| Status | resolved |

## S-03 — BLOCKER — Mutating tool execution cannot be recovered/replayed safely

| Aspect | Detail |
|---|---|
| Root finding | No execution/receipt state covers the crash window after side effect, before result persistence; replay mode + fixture binding undefined. |
| Affected files | `specification.md` (Tool Definition, Error/Recovery), `artifact-lifecycle.md`; new schemas `tool-definition`, `tool-registry-snapshot`, `tool-execution-state`, `tool-result`, `execution-receipt`, `replay-fixture`, `replay-mismatch`; `contract-inventory.md`. |
| Required decision | Idempotency + write-ahead + effect-free replay policy; safe replay modes (validate-log, simulate-recorded-results, isolated-re-execute deferred). |
| Required schema/contract | Tool execution state machine (prepared→executing→succeeded/failed/cancelled/outcome-unknown→reconciled); input+schema hashes; idempotency keys; receipts. |
| Gherkin coverage | guarded mutation, cancel safely, replay offline, + negatives (crash before/after side effect, tool timeout/output overflow, replay mismatch). |
| Impl-plan impact | Guarded mutation only after recovery contracts; replay/recovery suite task. |
| Verification | Phase 11 fixture matrix + failpoint coverage; testing/replay reviewer; strict. |
| Disposition | Fix — add write-ahead execution/receipt/idempotency + safe replay contracts and state machine. |
| Status | resolved |

## S-04 — BLOCKER — Permission prose is not an enforceable containment/egress boundary

| Aspect | Detail |
|---|---|
| Root finding | Sandbox optional; guards fail open on disabled/error; redaction may return raw; URL text detection is not a network broker. |
| Affected files | `security-protocol.md`, `specification.md` (Security Boundary), `schemas/harness-config.schema.json` (network); new `policy-profile`, `approval-request`, `approval-result`; `contract-inventory.md`. |
| Required decision | D3 (3 profiles; Release 0 = read-only-review; fail-closed; prompt ≠ boundary). |
| Required schema/contract | Trust/security profile schema; required-isolation matrix; fail-closed seams; network broker contract (scheme/port/DNS/redirect/private-range/proxy/unix-socket/size/time). |
| Gherkin coverage | hard-deny, guarded mutation, + negatives (symlink escape/path traversal, shell quoting/injection, headless approval, network redirect/private address, fail-closed scan state). |
| Impl-plan impact | Security ADR in Phase 0; containment gates before shell/write/network. |
| Verification | Phase 11 + security reviewer; strict. |
| Disposition | Fix — define profiles, required isolation, fail-closed behavior, network broker; stop presenting text egress detector as network enforcement. |
| Status | resolved |

## S-05 — P0 — Approval/policy/provenance cannot authorize the exact action

| Aspect | Detail |
|---|---|
| Root finding | Approval lacks canonical action/tool/schema/policy/actor/expiry/consumption fingerprints; policy config can't express promised controls; provenance not propagated. |
| Affected files | `schemas/harness-policy-decision.schema.json`; new `policy-profile`, `approval-request`, `approval-result`; `security-protocol.md`, `agent-protocol.md`, `harness-context-manifest.schema.json` (provenance). |
| Required decision | D3; single-use approval binding; provenance/taint propagation. |
| Required schema/contract | Single-use ApprovalRequest/Result bound to exact action fingerprints; invalidate on relevant change; immutable trust/provenance ids. |
| Gherkin coverage | resume an approval, stale approval, headless approval, hard-deny; provenance→justification. |
| Impl-plan impact | Approval binding task after policy engine. |
| Verification | Phase 11 fixtures + security reviewer; strict. |
| Disposition | Fix — add binding fingerprints, single-use lifecycle, provenance propagation. |
| Status | resolved |

## S-06 — BLOCKER — Two orchestrators and two completion authorities specified

| Aspect | Detail |
|---|---|
| Root finding | Harness redefines planning/scheduling/retry/review/completion already owned by flow-orchestrator; current FlowTask cannot encode DAG/evidence. |
| Affected files | `implementation-plan.md`, `specification.md` (Orchestration, Completion Gates), `agent-protocol.md`; job `decisions.md`; new Task Manager prerequisite section; `flow-orchestrator-handoff.md`. |
| Required decision | D2 (single coordinator/lease; harness = primitives), D7 (Task Manager evolution prerequisite). |
| Required schema/contract | Ownership matrix + ports/import matrix (docs); completion-gate-result schema (shared with S-07). |
| Gherkin coverage | "complete a verified project task" advances only via Task Manager API; single loop-authority. |
| Impl-plan impact | New Phase 0 prerequisite: Task Manager schema/service/CLI evolution + migration before flow integration. |
| Verification | Phase 11 + architecture/coordinator-ownership reviewer; strict. |
| Disposition | Fix — one coordinator, ownership matrix, harness returns typed evidence/gate artifact; Task Manager prerequisite documented. |
| Status | resolved |

## S-07 — BLOCKER — Failed/evidence-free run can be schema-validly completed

| Aspect | Detail |
|---|---|
| Root finding | `completed` can coexist with `failed/skipped/unknown` gates, null `finishedAt`, empty artifacts, arbitrary checks, unresolved blockers. |
| Affected files | `schemas/harness-run-output.schema.json`; new `completion-gate-result`; `specification.md` (Completion Gates). |
| Required decision | Completion invariant: completed ⇒ all blocking gates pass, finishedAt set, no undisposed blocker, evidence present. |
| Required schema/contract | Versioned completion-gate schema with required checks/evidence by run kind; terminal-state conditionals (`if/then` on status). |
| Gherkin coverage | complete only with evidence (reject), complete a verified task (accept), + negative (evidence-free rejected). |
| Impl-plan impact | Completion-gate task; evidence-rejection tests. |
| Verification | Phase 11 fixture matrix (valid completed + invalid completed-without-evidence); contract reviewer; strict. |
| Disposition | Fix — add terminal-state conditionals and required completion evidence. |
| Status | resolved |

## S-08 — P0 — Child task/result protocol is a conflicting second source of truth

| Aspect | Detail |
|---|---|
| Root finding | `harness-agent-task` changes canonical field shapes; STATUS-first prose conflicts with a JSON object wire contract. |
| Affected files | `schemas/harness-agent-task.schema.json` (remove/deprecate), `agent-protocol.md`; new versioned extension over canonical `subagent-dispatch`/`subagent-result`; round-trip/parity fixtures. |
| Required decision | D6 (canonical `subagent-result`; STATUS = adapter framing; remove parallel task). |
| Required schema/contract | Versioned extension fields (parent run/session, attempt id/number, branch/context/policy fingerprints, budget reservation, durable result artifact); one wire envelope; adapter framing spec. |
| Gherkin coverage | dispatch a child agent, handle NEEDS_CONTEXT, bound parallel waves; + round-trip/transport-parity, migration. |
| Impl-plan impact | Child-agent task uses canonical contracts; remove duplicate schema. |
| Verification | Phase 11 dispatch/result validation + parity fixtures; contract reviewer; strict. |
| Disposition | Fix — deprecate/remove independent schema; extend canonical contracts; define STATUS adapter framing. |
| Status | resolved |

## S-09 — P1 — Provider normalization erases required state/privacy semantics

| Aspect | Detail |
|---|---|
| Root finding | Partial-stream retry boundaries, accepted tool-call state, unknown events, remote storage/retention/continuation, cancellation, reproducible source revisions not governed. |
| Affected files | `provider-protocol.md`, `best-practices.md`; new `provider-descriptor` (capabilities incl. storage/retention/continuation defaulting off), `model-request/response/error`; research ledger. |
| Required decision | D4 (provider storage/continuation off by default, out of Release 0). |
| Required schema/contract | Attempt-scoped stream boundaries; provider storage/retention/continuation/cancellation capabilities (off); preserve unknown extensions; pinned provider comparison evidence. |
| Gherkin coverage | provider-neutral contract, retry transient failure, + negatives (partial/malformed stream, permanent/transient provider failure, cancellation). |
| Impl-plan impact | Provider ADR Phase 0; provider ports; real adapter late. |
| Verification | Phase 11 + testing reviewer; research ledger reproducibility; strict. |
| Disposition | Fix — govern attempt boundaries, remote-state policy, capability negotiation, pinned research. |
| Status | resolved |

## S-10 — P0 — Plan lacks a minimal value slice and misses prerequisite work

| Aspect | Detail |
|---|---|
| Root finding | No task owns `src/harness` relocation; fake-loop precedes interfaces; first slice waits for branch/compaction; prose waves contradict DAG; final review monolithic. |
| Affected files | `implementation-plan.md` (full recompose), `specification.md` (Module Map), `roadmap.md`. |
| Required decision | D1 (Release 0 slice); D7 (Task Manager prerequisite); `src/eval/` relocation target. |
| Required schema/contract | none new; plan structure. |
| Gherkin coverage | release-gate scenarios tagged to tasks. |
| Impl-plan impact | Recompose into 16 dependency waves; per-task stable id/kind/objective/deps/schemas/AC ids/evidence/exit/reviewer/release tag; split final review into 7 tracks. |
| Verification | Phase 11 coverage (requirements→scenarios→tasks); architecture reviewer; strict. |
| Disposition | Fix — add relocation + Task Manager prerequisite; order contracts→ports→fakes; deliver read-only slice first; derive waves from DAG. |
| Status | resolved |

## S-11 — P0 — Contract/recovery tests cannot enforce the proposed design

| Aspect | Detail |
|---|---|
| Root finding | Current validator ignores keywords the package uses; fake-provider/migration/semantic/crash-cut/torn-write/backpressure/disk-full matrices unspecified. |
| Affected files | `metrics-and-validation.md`, `contract-inventory.md`, `schema-validation-report.md`, all `schemas/*` (stable ids/versioning), fixtures. |
| Required decision | Adopt/prove a Draft 2020-12 validator; deterministic clocks/ids for fixtures. |
| Required schema/contract | Per-schema positive/negative fixture format; migration/mutation fixtures; persistence failpoints. |
| Gherkin coverage | schemas validate valid+invalid fixtures (release gate); metrics exact/estimated/unknown. |
| Impl-plan impact | Contract-registry/validator/fixtures wave before ports; failpoint suite. |
| Verification | Phase 11 validator keyword coverage + fixture matrix; testing reviewer; strict. |
| Disposition | Fix — specify validator + deterministic fixture/failpoint matrices in docs (no dependency install in this job). |
| Status | resolved |

## S-12 — BLOCKER — Executable acceptance contract is invalid and untraceable

| Aspect | Detail |
|---|---|
| Root finding | `Before` is not a Gherkin step keyword (line 26); one scenario demands allow/ask/deny simultaneously; no R1–R18/T1–T30 traceability; missing negative/lifecycle coverage. |
| Affected files | `acceptance.feature`, `gherkin-coverage-report.md`, `metrics-and-validation.md` (parser gate), `specification.md` (requirement ids R1–R18). |
| Required decision | Parser + coverage checks are release gates. |
| Required schema/contract | Requirements→scenarios→schemas→tasks coverage matrix. |
| Gherkin coverage | Repair syntax; Scenario Outline for allow/ask/deny; separate hard-deny; tag `@R*`/`@T*`; full positive+negative set (per Phase 8 list). |
| Impl-plan impact | Acceptance freeze + parser/coverage gate before automation. |
| Verification | Phase 11 Gherkin parser validation + coverage no-gaps; Gherkin-coverage reviewer; strict. |
| Disposition | Fix — rewrite feature, add tags + negatives, add coverage matrix and parser gate. |
| Status | resolved |

---

## Cross-cutting deliverables

| Deliverable | Serves findings |
|---|---|
| `contract-inventory.md` (normative) | S-02, S-03, S-05, S-07, S-08, S-11 |
| New/updated `schemas/*` + `schemas/fixtures/*` | S-02, S-03, S-05, S-07, S-08, S-11 |
| `schema-validation-report.md` | S-02, S-07, S-11 |
| `acceptance.feature` + `gherkin-coverage-report.md` | S-12 (+ all, via traceability) |
| `implementation-plan.md` recompose | S-01, S-06, S-08, S-09, S-10 |
| Ownership + ports matrices in `specification.md` | S-06, S-10 |
| Security profiles + network broker in `security-protocol.md` | S-04, S-05 |
| Research ledger (Phase 10) | S-09 |
| Status/scope/SLO in README/PRD/roadmap | S-01 |
| `flow-orchestrator-handoff.md` (conditional) | S-06, S-07, S-10, S-12 |
