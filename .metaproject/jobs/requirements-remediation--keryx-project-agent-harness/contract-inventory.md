# Normative Contract Inventory
Version: 1.1.0

## Status and Authority

This is a **design-only, normative inventory** for the proposed Keryx Project
Agent Harness. It specifies contracts that implementation work must add or
adopt later; it does not claim that a harness runtime, validator, provider
adapter, persistence store, or migration is implemented today.

This inventory closes the contract-design portion of S-02, S-03, S-05, S-07,
S-08, and S-11. It is authoritative for contract ownership and points to the
machine-readable compatibility policy in
`docs/requirements/keryx-project-agent-harness/schemas/schema-version-registry.json`.
It does not replace Task Manager ownership of managed-flow state.

### Normative Rules

- New durable wire and storage contracts use JSON Schema Draft 2020-12, a
  stable `$id`, and an explicit `schemaVersion`; a shared
  `harness-envelope.schema.json` supplies common identifiers and `$defs`.
- Existing Keryx `subagent-dispatch` and `subagent-result` retain their
  canonical shape and `contract_version`. Harness-specific child metadata is a
  versioned extension, never a competing replacement.
- A compatible additive change increments the minor version; a changed meaning,
  removed field, or changed invariant increments the major version. Readers
  accept only their declared compatibility range, persist the original version,
  and write the newest version.
- Every schema change requires valid, invalid, migration, and semantic fixture
  coverage. Fixtures use deterministic clock, identifier, provider, and
  failpoint inputs. Validation must use a Draft 2020-12 implementation with
  the keywords used by these schemas proven in the validation report.
- Local Keryx records are authoritative. Provider-side storage, continuation,
  and retention are off by default and outside Release 0.
- Redacted payloads, hashes, provenance identifiers, and artifact references
  are durable; credentials, raw secrets, and hidden reasoning are not.

## Adopted Decisions (D1-D7)

| ID | Decision |
|---|---|
| D1 | Release 0 = offline fake provider, read-only tool, provider-neutral loop, minimal append-only session, context manifest, evidence-linked output, CLI+JSONL/RPC parity, deterministic replay. Excludes production provider, mutation, shell, network, child agents, parallel tools, extensions, provider-side storage, TUI. |
| D2 | Single coordinator: flow-orchestrator/Task Manager owns managed-flow task state, retries, review/fix, completion. Harness = execution primitives + evidence/gate artifacts; never edits flow.json; no second loop. |
| D3 | ≥3 security profiles (read-only-review, monitored-trusted-local, unattended-untrusted); Release 0 = read-only-review only; unattended/untrusted mutation fails closed without a real sandbox; permission prompt is not a boundary. |
| D4 | Local Keryx event/session log authoritative; provider-side storage/continuation off by default and out of Release 0; future enablement needs a separate capability/policy/retention/deletion contract; instructions reconstructed locally each request. |
| D5 | Append-only session tree; branch = branchId/forkEntryId/leaf/immutable ancestors; merge excluded from v1; compaction = typed derived entry that never removes evidence/history. |
| D6 | Canonical durable child object = versioned `subagent-result`; STATUS text = adapter framing; adapter converts framing to canonical object before persistence/validation; `harness-agent-task` removed as a parallel source of truth. |
| D7 | Task Manager evolution requirement (dependencies, attempts, blocked/failed/skipped/disposition, AC refs, evidence refs, budgets, run/session linkage, backward-compatible migration) is a prerequisite reflected in the new implementation plan. |

## Ownership and Persistence Boundaries

| Boundary | Normative owner | May produce | Must not own |
|---|---|---|---|
| Task Manager / `flow-orchestrator` | Managed-flow task DAG, attempts, retry, review/fix, disposition, and parent completion | Flow task references and requests for run/gate evidence | Harness session mutation, provider calls, tool effects, or a second completion loop |
| Harness execution service | Run/session lifecycle, tool/policy/approval primitives, context, evidence, checkpoints, and typed gate artifacts | Durable harness records and gate results | `flow.json`, flow task state, flow retry scheduling, or parent-flow completion |
| Provider adapter | Provider descriptor, normalized model requests/events/errors, cancellation boundary | Provider-normalized records | Tools, policy, sessions, flow state, or completion decisions |
| Tool runtime | Registry snapshot, write-ahead execution, result, receipt, reconciliation | Tool execution records and evidence references | Approval issuance or policy selection |
| Policy and transport adapters | Policy calculation; interactive approval delivery; JSONL/RPC framing | Policy decisions and approval requests/results | Containment guarantees not supplied by an enforced control |
| Session store | Append-only manifests, entries, branches, checkpoints, compaction references | Atomic durable session records | Rewriting or deleting history/evidence |

## Contract Registry

The following is the complete Release 0-plus inventory. `Planned` locations are
design targets, not existing runtime files. “New schema (internal-only)” means
the object is durable and validated but is not a public provider or transport
API.

| Contract | Canonical category and owner | Producer → consumer | Authoritative persistence location | Version and migration strategy | Required positive / negative fixtures |
|---|---|---|---|---|---|
| Runtime event | New schema; Harness execution service owns vocabulary | Harness/provider/tool/policy services → session store, replay, JSONL/RPC projection | Planned `data/harness/sessions/<sessionId>/events.jsonl`; event references may also appear in run events | `harness-event` uses shared envelope, discriminated `eventType`, mandatory `eventId`, `runId`, `sessionId`, `attemptId`, sequence, timestamp, causation and correlation ids; additive event payloads preserve unknown extensions | Valid event for every event type; reject missing causal ids, unknown required payload, duplicate sequence, payload/type mismatch; vN→vN+1 migration fixture |
| Session manifest | New schema; Session store | Harness coordinator → resume, branch, replay | Planned `data/harness/sessions/<sessionId>/manifest.json` | Versioned manifest records session root, active branch, schema registry fingerprints, append cursor, policy/provider/config fingerprints; migration creates a new manifest generation without rewriting entries | Valid new/resumed manifest; reject stale cursor, missing root, mutable ancestor reference; v1 manifest upgrade fixture |
| Session entry | New schema; Session store | All harness services → session store, replay | Planned `data/harness/sessions/<sessionId>/session.jsonl` | Stable immutable entry envelope references a runtime event or derived artifact; parent reference is required except root; append only | Valid root and child entries; reject missing parent, parent from another session, duplicate id, mutable payload replacement; legacy-entry import fixture |
| Provider descriptor | New schema; Provider adapter | Provider configuration/capability probe → coordinator, policy, evidence | Planned redacted descriptor snapshot under `sessions/<sessionId>/artifacts/` and a hash in manifest/run | Versioned immutable snapshot includes provider/model revision, supported features, cancellation, storage, retention, continuation, and unknown-extension handling; storage/retention/continuation default off | Offline fake descriptor; reject enabled remote continuation without explicit capability/policy, unpinned revision, unsupported capability claim; descriptor migration fixture |
| Model request | New schema; Provider adapter | Coordinator → provider adapter, session store, replay | Planned session entry/event plus redacted request artifact | Attempt-scoped, idempotent `requestId`; includes descriptor fingerprint, context/tool-registry/policy fingerprints, budget and cancellation reference; instructions are reconstructed locally | Valid fake-provider request; reject missing attempt, mismatched descriptor fingerprint, secret-bearing payload, budget overflow; request-version migration fixture |
| Model response | New schema; Provider adapter | Provider adapter → coordinator, session store, replay | Planned response event and bounded/redacted artifact | Couples response to exactly one request/attempt and preserves provider request id, finish reason, usage reliability and accepted tool-call ids; unknown provider events are retained as bounded extensions | Valid text and completed-tool-call responses; reject response for another attempt, unsequenced partial call, unsupported raw reasoning, duplicate accepted call; stream-normalization migration fixture |
| Model error | New schema; Provider adapter | Provider adapter → retry policy, coordinator, evidence | Planned error event plus redacted artifact | Typed classification, retryability, safe cause, retry-after and cancellation state; never merges partial streams across attempts | Valid transient/permanent/cancelled errors; reject unclassified error, retryable authentication error, error without request/attempt link; legacy-provider-error migration fixture |
| Tool definition | New schema; Tool runtime | Tool author/registry build → policy, validator, model request rendering | Planned source configuration `harness/tools/` and immutable registry snapshot | Stable namespaced `toolId` plus semver, JSON input/output schema ids and hashes, risk/capability limits, deterministic/replay declaration | Valid Release 0 read-only tool; reject mutable tool in read-only profile, missing schema hash, unbounded output, duplicate id/version; definition migration fixture |
| Tool registry snapshot | New schema (internal-only); Tool runtime | Registry builder → model request, replay, policy, evidence | Planned immutable `sessions/<sessionId>/artifacts/tool-registry-<hash>.json` | Content-addressed immutable snapshot; a replay selects exactly the referenced hash, never the current registry | Valid registry with one read-only tool; reject duplicate `toolId`, changed definition for same snapshot hash, unresolved schema; registry migration fixture |
| Tool call | New schema; Tool runtime | Model response normalizer → schema validator, policy engine | Planned session event and execution record reference | Versioned call binds call id, request/attempt, registry hash, tool id/version, canonical input bytes/hash, provenance and idempotency key | Valid completed fake call; reject partial streamed call, registry mismatch, schema-invalid input, duplicate idempotency key with changed input; call migration fixture |
| Tool execution state | New schema (internal-only); Tool runtime | Tool runtime → recovery/reconciliation, evidence | Planned `sessions/<sessionId>/artifacts/tool-executions/<executionId>.json` with append events | Write-ahead transition record: `prepared → executing → succeeded|failed|cancelled|outcome-unknown → reconciled`; illegal transitions are rejected and each transition emits an event | Valid prepare/execute/succeed and unknown/reconcile paths; reject execution before prepare, side effect without durable prepare, terminal-to-executing transition, omitted input hash; crash-cut/torn-write/disk-full fixtures |
| Tool result | New schema; Tool runtime | Tool runtime → model adapter, session store, replay | Planned result artifact plus `tool_result` event | Versioned bounded/redacted result links execution, call, policy decision, output hash/artifact and effect classification; replay uses recorded result where required | Valid read-only result; reject result before receipt/state, oversized inline output, mismatched execution/call, raw secret; result migration fixture |
| Execution receipt | New schema; Tool runtime | Side-effect adapter → recovery/reconciliation, evidence | Planned immutable receipt artifact referenced by execution state | Receipt is written or durably recoverable at the effect boundary and carries idempotency key, effect fingerprint, observed outcome and reconciliation method; Release 0 read-only tools still emit no-effect receipts | Valid no-effect/read receipt and future effect receipt; reject receipt with changed input/policy fingerprint, duplicate effect under key, receipt after unrecorded effect; before/after-effect crash fixtures |
| Policy profile | New schema; Policy service | Project policy configuration → policy engine, context, approval | Planned source `harness/policies/<profile>.json`, fingerprinted into manifest/run | Versioned profile represents `read-only-review`, `monitored-trusted-local`, and `unattended-untrusted`; Release 0 accepts only `read-only-review`; unsupported/required isolation fails closed | Valid read-only profile; reject mutation/network/shell/child allowance in Release 0, unattended mutation without sandbox attestation, fail-open missing control; profile migration fixture |
| Policy decision | New schema; Policy engine | Policy engine → tool runtime, approval service, evidence | Planned `policy_decision` event and artifact reference | Decision binds exact action fingerprint, tool/definition/schema/registry hashes, actor/role, profile and provenance ids; result is one of `allow`, `ask`, `deny` with deterministic rule trace | Valid allow/ask/deny decision; reject decision lacking provenance, stale registry fingerprint, hard-deny override, non-deterministic trace; decision migration fixture |
| Approval request | New schema; Policy service creates, transport adapter delivers | Policy engine → transport/user, session store | Planned approval artifact and `approval_request` event | Single-use, expiry-bound request fingerprints exact action, input/schema/tool/registry/policy/profile/provenance/actor; changes invalidate request | Valid interactive request for exact action; reject headless implicit approval, expired request, request for a changed input, request without isolation requirement; approval migration fixture |
| Approval result | New schema; Transport adapter records, Policy service consumes | User/approved transport → tool runtime, evidence | Planned immutable approval artifact and `approval_result` event | `approved`, `rejected`, or `expired`; references request fingerprint, approver identity/time and one consumption record; replay never reuses approval as authority | Valid matching single-use approval and rejection; reject double consumption, changed action, expired approval, unknown approver; stale-approval migration fixture |
| Context manifest | New schema; Context builder | Context builder → model request, child dispatch extension, evidence | Planned `sessions/<sessionId>/context-manifest.json` plus content-addressed cache | Versioned and immutable per request scope; includes source/provenance/trust ids, redaction status, hashes, freshness, byte/token reliability and rendered-view hash | Valid bounded trusted/untrusted context; reject raw unredacted external text, missing provenance/trust id, path outside scope, stale reference reused; manifest migration fixture |
| Evidence ledger | New schema; Evidence service | Harness/tool/provider/verification → gate evaluator, Task Manager handoff | Planned append-only `sessions/<sessionId>/evidence.jsonl` and run evidence refs | Every record has evidence id, subject, producer, timestamp, artifact hash/path, provenance and verification status; records are immutable and referenced, never embedded as mutable assertions | Valid test/tool/policy evidence links; reject missing artifact hash, evidence for a different run, mutable overwrite, secret payload; ledger migration and broken-reference fixtures |
| Checkpoint | New schema; Session store | Coordinator → resume/replay | Planned `sessions/<sessionId>/checkpoints/<checkpointId>.json` | Typed snapshot references an entry sequence, manifest generation, branch leaf and evidence/registry/config fingerprints; a checkpoint cannot become history replacement | Valid resumable checkpoint; reject cursor beyond log, changed policy/config fingerprint without new attempt, missing evidence; checkpoint migration fixture |
| Branch metadata | New schema; Session store | Branch command/coordinator → resume/replay | Planned `sessions/<sessionId>/branches/<branchId>.json` | D5 definition is mandatory: `branchId`, `forkEntryId`, `leaf`, immutable ancestor chain; merge is excluded from v1 | Valid fork and active leaf; reject cross-session fork, rewritten ancestor, merge fields, mutable branch ancestry; branch migration fixture |
| Compaction entry | New schema; Session store | Compactor → context builder, replay | Planned typed session entry plus derived artifact under `sessions/<sessionId>/artifacts/compactions/` | Derived, versioned summary references covered immutable entries, source hashes and render policy; it never deletes or supersedes evidence/history | Valid bounded compaction; reject deleted source/evidence, source range from another branch, summary treated as authoritative event, missing source hash; compaction migration fixture |
| Completion gate result | New schema; Harness gate evaluator produces, Task Manager consumes | Gate evaluator → run finalizer and Task Manager handoff | Planned immutable run artifact and evidence-ledger reference | Versioned checks are run-kind-specific. `completed` requires `finishedAt`, all blocking gates pass, required evidence exists, no undisposed blocker, and no active retry/approval/child work; Task Manager is the only managed-flow completion authority | Valid completed read-only Release 0 run; reject completed-without-evidence, failed/skipped blocking gate, null `finishedAt`, unresolved blocker; gate migration fixture |
| Run input | New schema; Harness coordinator | CLI/RPC adapter → coordinator, evidence | Planned `data/harness/runs/<runId>/input.json` | Versioned immutable invocation intent links session/flow refs, role, profile, budget, descriptor and context fingerprints; sanitised/hashed prompt fields only | Valid Release 0 fake-provider input; reject enabled production provider, mutation scope, missing profile, duplicate run id with changed input; input migration fixture |
| Run output | New schema; Harness execution service | Harness finalizer → CLI/RPC client, Task Manager handoff | Planned `data/harness/runs/<runId>/output.json` | Terminal status uses conditionals and references completion gate, session, evidence, provider usage reliability and omitted/skipped work; writer emits newest compatible version | Valid evidence-backed completed and honestly failed/cancelled outputs; reject completed result without gate, arbitrary check list, missing finishedAt, leaked secret; output migration fixture |
| RPC/JSONL envelope | New schema; Transport adapter | CLI/JSONL/RPC adapters → coordinator/client | Ephemeral on transport; accepted requests/responses persist as referenced runtime events, not raw duplicate state | One transport-neutral envelope with protocol version, message id, correlation/causation ids, operation, payload schema id/version, error and idempotency semantics; CLI and RPC project to the same canonical contracts | CLI/JSONL/RPC parity transcript; reject unknown protocol version, payload/schema mismatch, duplicate message id with different payload, unordered correlation; envelope migration fixture |
| Fake-provider transcript | New schema (test-only); Fake provider | Deterministic fake provider → provider adapter tests, Release 0 loop/replay tests | Planned `schemas/fixtures/fake-provider/` and test artifacts; never a production provider record | Versioned ordered request expectation and normalized event/error sequence, deterministic ids/clocks/usage; pins descriptor and transcript hash | Valid text/tool/usage/cancellation transcripts; reject malformed delta ordering, request mismatch, duplicate sequence, unpinned descriptor; transcript upgrade fixture |
| Replay fixture | New schema (test-only); Replay harness | Fixture author → replay verifier | Planned `schemas/fixtures/replay/` | Versioned fixture binds session/event/evidence/registry/provider transcript hashes and explicit mode: `validate-log` or `simulate-recorded-results`; isolated re-execution is deferred | Valid deterministic no-effect replay; reject missing hash, mutated input, attempt mixing, replay that requests a live side effect; replay-fixture migration fixture |
| Replay mismatch | New schema; Replay verifier | Replay verifier → run output, evidence, operator | Planned replay artifact and `replay_mismatch` event | Typed mismatch identifies expected/actual fingerprint, sequence and safe diagnostic; mismatch is terminal for deterministic validation and never silently falls back to live execution | Valid reported input/result/event mismatch; reject unlinked mismatch, secret-bearing diagnostic, mismatch silently marked successful; mismatch migration fixture |
| Canonical child dispatch extension | Existing Keryx `subagent-dispatch` plus new schema extension; Task Manager creates managed dispatches, harness may carry them | Task Manager/flow-orchestrator → child adapter | Canonical dispatch artifact location remains owned by existing Keryx flow/orchestration; harness stores only referenced extension/evidence | Base `contract_version` and fields stay canonical. Extension adds parent run/session, attempt id/number, branch/context/policy/registry fingerprints, budget reservation and expected durable result artifact. D7 fields remain Task Manager prerequisites, not harness-owned flow state | Valid base dispatch plus extension; reject altered base field semantics, absent attempt link, unauthorized child in Release 0, budget over-reservation; base/extension compatibility fixture |
| Canonical child result extension | Existing Keryx `subagent-result` plus new schema extension; Child adapter produces, Task Manager validates/owns disposition | Child adapter → Task Manager/flow-orchestrator; harness records reference only | Canonical durable result is the existing Keryx result artifact; harness keeps a result reference/evidence link, not a duplicate task record | D6 is mandatory: STATUS-first text is adapter framing only. The adapter parses it into canonical `subagent-result` before validation/persistence; extension carries parent run/session, attempt, branch/context/policy fingerprints, budget consumption and durable artifact references | Valid STATUS-to-result round trip and JSONL/RPC parity; reject prose persisted as result, conflicting STATUS/object status, missing canonical result, duplicate consumption, stale policy/context; extension migration fixture |

## Required Cross-Contract Invariants

1. **Causality and locality.** Every durable action record is tied to one run,
   session, attempt, actor/role, provenance id, and sequence/correlation chain.
   Provider records cannot create state outside the local log.
2. **Append-only recovery.** Session entries, events, evidence, receipts, and
   approval results are immutable. Recovery adds a reconciliation entry; it
   never rewrites history or infers an effect from a missing record.
3. **Safe tool recovery.** A potential side effect has a durable prepared state
   and idempotency key before execution. `outcome-unknown` blocks re-execution
   until reconciliation proves an outcome. Replay is effect-free in Release 0.
4. **Exact authorization.** A policy decision and approval authorize only the
   exact action fingerprint they bind. A changed tool, schema, input, registry,
   policy, role, provenance, actor, context, or expiry invalidates approval.
5. **Fail-closed containment.** The three profiles are data contracts, but a
   prompt is not containment. Missing required isolation, scanner, broker, or
   approval channel produces a typed deny/block, never an allow.
6. **Evidence-backed completion.** Harness emits a gate artifact; Task Manager
   decides managed-flow completion. Neither a model summary nor a child status
   may finalize a managed flow.
7. **One child truth.** `harness-agent-task.schema.json` is deprecated for
   traceability only. It is neither accepted for new dispatches nor persisted
   as a source of task/result truth. Canonical Keryx dispatch/result contracts
   with the defined extension replace it.

## Fixture and Validation Layout

The machine-readable schema-version registry is the compatibility source of
truth. It lists every schema `$id`, stored version, accepted reader range,
migration id, and typed rejection behavior. `harness-agent-task` is explicitly
marked `migration-only` there and is excluded from active fixture coverage.

The implementation plan must create this design target before ports, fakes, or
runtime adapters:

```text
docs/requirements/keryx-project-agent-harness/schemas/
  harness-envelope.schema.json
  fixtures/
    valid/<contract>.json
    invalid/<contract>-<reason>.json
    migration/<contract>-vN-to-vN+1.json
    semantic/<contract>-<invariant>.json
    failpoints/<execution-or-persistence-case>.json
    fake-provider/<transcript>.json
    replay/<fixture-or-mismatch>.json
```

The registry must record each schema `$id`, supported reader versions, writer
version, fixture names, and owner. A fixture passes only when it both validates
structurally and satisfies its semantic/recovery assertion. The validation gate
must prove Draft 2020-12 keyword coverage for `oneOf`, `allOf`, `$ref`, `if`,
`then`, `else`, `const`, `format`, `unevaluatedProperties`, and any additional
keyword used by the adopted schemas.

## Release 0 Contract Cut

Release 0 implements only the contracts necessary for D1: fake-provider
descriptor/request/response/error/transcript, provider-neutral runtime event,
minimal append-only session manifest/entry, read-only tool definition/registry/
call/execution/result/receipt, read-only-review policy decision, context
manifest, evidence ledger, run input/output, completion gate, JSONL/RPC
envelope parity, and deterministic effect-free replay fixtures. Branch,
compaction, child dispatch/result extensions, production-provider capabilities,
mutation, shell, network, parallel tools, extensions, provider-side storage,
and TUI remain specified but deferred.

## Implementation Preconditions and Handoff

Before any managed-flow integration, Task Manager must support D7's
dependencies, attempts, blocked/failed/skipped/disposition states, acceptance
criteria references, evidence references, budgets, run/session linkage, and a
backward-compatible migration. The harness may return its typed run/evidence/
gate artifacts only through the defined handoff; it must never write flow state
or declare a flow complete.

## Verification Checklist

- Every registry row has a Draft 2020-12 schema or an explicit existing-Keryx
  base contract and a named owner, producer, consumer, persistence target,
  version policy, and positive/negative fixtures.
- Every durable schema has valid, invalid, migration, semantic, and applicable
  failpoint fixtures; Release 0 additionally has fake-provider and replay
  fixtures.
- The validator capability report proves the keywords used by all referenced
  schemas, including terminal-status conditionals and discriminated payloads.
- CLI, JSONL, and RPC round trips produce the same canonical run/session/event
  objects for an identical fixture.
- `harness-agent-task` is marked deprecated and rejected for new use; canonical
  child result persistence validates against `subagent-result` plus extension.
- No evidence-free or unresolved-blocker run can validate as `completed`, and
  no managed flow can complete except through Task Manager.
