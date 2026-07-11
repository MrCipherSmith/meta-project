# Gherkin Coverage Plan — Keryx Project Agent Harness
Version: 1.3.0

## Purpose and Status

This is the authoritative planning matrix for the replacement of
"acceptance.feature". It closes the traceability design gap recorded as S-12;
it does not claim that the replacement feature, schemas, fixtures, task waves,
or runtime behavior already exist.

The matrix applies adopted decisions D1–D7. Release 0 is an offline,
fake-provider, read-only execution slice. A scenario tagged "@release-1" or
"@release-2" is a later capability and cannot be used as Release 0 evidence.

## Scenario Tagging and Release Rules

Every future scenario has one unique scenario identifier tag, one or more
requirement tags, exactly one release tag, and exactly one mode tag. Example:

    @SC_R03_PROVIDER_NORMALIZATION @R3 @release-0 @positive
    Scenario: Normalize a fake-provider text and tool-call stream

- Requirement tags are exactly "@R1" through "@R18".
- Scenario identifiers are unique "@SC_<UPPER_SNAKE_CASE>" tags.
- "@positive" proves an allowed or required outcome; "@negative" proves a
  safe rejection, bounded failure, or preserved recovery state.
- "@release-0" is limited to the D1 floor: fake provider, registered
  read-only tools, local append-only session/evidence, bounded context,
  CLI/JSONL-RPC parity, and offline replay.
- "@release-1" covers controlled mutation, shell, network broker, real
  provider adapters, branch/compaction, and managed-flow integration.
- "@release-2" covers child agents, parallel waves, and extension execution.
- A Release 0 scenario must not require source mutation, a shell process, a
  network socket, a real-provider SDK, credentials, child agents, or parallel
  tool execution. It may assert that an attempt to obtain one is denied with
  no effect.
- Each scenario declares its C-* contract IDs in a description line or data
  table. The declared IDs must resolve in the contract inventory.

## Planned Wave and Task IDs

These identifiers are targets for the implementation-plan rewrite. They replace
the current ambiguous T1–T30 references for this coverage purpose. The
rewritten plan must adopt them verbatim or update this report in the same
change.

| Wave | Task ID | Target outcome | Release |
|---|---|---|---|
| W0 | TM-01 | Evolve Task Manager with DAG dependencies, attempts, dispositions, AC/evidence/budget/run links, and backward-compatible migration. | prerequisite |
| W0 | DOC-01 | Freeze feature, parser command, and traceability gate. | prerequisite |
| W0 | SEC-01 | Publish profiles and fail-closed boundary decisions. | prerequisite |
| W1 | CT-01 | Create the contract registry, Draft 2020-12 validator proof, deterministic clocks/IDs, and fixture harness. | all |
| W1 | CT-02 | Define envelope, event, session, evidence, checkpoint, and context contracts. | R0 |
| W1 | CT-03 | Define policy profile, provenance, approval, completion-gate, and run-output contracts. | R0 |
| W1 | CT-04 | Define provider descriptor/request/response/error and fake-stream fixtures. | R0 |
| W1 | CT-05 | Define tool registry/execution/receipt/replay contracts and safe-replay fixtures. | R0/R1 |
| W1 | CT-06 | Define canonical subagent-result extension and transport adapter; deprecate the parallel task contract. | R2 |
| W2 | HN-01 | Establish runtime/src-eval ownership, ports/import matrix, and capability-off configuration. | R0 |
| W2 | HN-02 | Implement trusted startup, bounded context, local session/evidence persistence, and redaction boundary. | R0 |
| W2 | HN-03 | Implement read-only registry, read-only-review policy, fake provider, and deterministic single-agent loop. | R0 |
| W2 | HN-04 | Implement typed budget/retry/loop/error transitions and offline replay simulation. | R0 |
| W3 | TR-01 | Implement thin CLI and JSONL/RPC adapters with parity fixtures. | R0 |
| W3 | GT-01 | Implement evidence-backed completion evaluator and Task Manager handoff artifact. | R0/R1 |
| W4 | RC-01 | Implement session migration, resume, branch, and typed compaction as append-only derived entries. | R1 |
| W4 | RC-02 | Implement guarded mutation, shell containment, receipts, reconciliation, and failure injection. | R1 |
| W4 | RC-03 | Implement real-provider adapters and a DNS/redirect/private-range-aware network broker. | R1 |
| W4 | FL-01 | Bridge harness evidence to evolved Task Manager without a second coordinator. | R1 |
| W5 | AG-01 | Implement canonical child dispatch/result adaptation, role isolation, and bounded parallel waves. | R2 |
| W5 | EX-01 | Implement explicit extension registration, escalation approval, and deferred provider/transport surfaces. | R2 |
| W6 | V-01 | Run parser, schema/fixture, traceability, recovery, security, architecture, and strict release gates. | all |

## Contract IDs Used by This Matrix

| Contract ID | Normative schema or document target | Primary task |
|---|---|---|
| C-ENV | Shared harness envelope definitions, stable identifier, schema version, causal and provenance IDs. | CT-01 |
| C-CFG | Harness configuration and capability-off profile. | CT-01, HN-01 |
| C-CTX | Context manifest with scope, hashes, freshness, source reliability, and redaction state. | CT-02 |
| C-EVT | Discriminated harness-event payload union. | CT-02 |
| C-SES | Session manifest, append-only entry, checkpoint, branch metadata, and compaction entry. | CT-02, RC-01 |
| C-EVD | Evidence record and ledger. | CT-02 |
| C-MDL | Provider descriptor plus model request, response, event, and error contracts. | CT-04 |
| C-TOL | Tool definition, registry snapshot, execution state, result, and receipt. | CT-05 |
| C-RPL | Replay fixture, replay mode, and replay mismatch. | CT-05 |
| C-POL | Policy profile and decision with immutable provenance binding. | CT-03 |
| C-APR | Single-use approval request/result bound to action, tool/schema, policy, actor, expiry, and consumption fingerprints. | CT-03 |
| C-GAT | Completion-gate result with terminal-state conditionals and evidence requirements. | CT-03, GT-01 |
| C-RUN | Run input/output and metric record, including exact/estimated/unknown value state. | CT-03 |
| C-SAR | Versioned extension of canonical subagent-dispatch/subagent-result; STATUS is adapter framing. | CT-06 |

## Requirement-to-Scenario Coverage Matrix

The schema and task cells are complete coverage sets, not examples. A semicolon
separates independently required scenarios.

| Requirement | Future scenarios and required tags | Contracts | Planned tasks/waves | Evidence gate |
|---|---|---|---|---|
| R1 Independent Runtime | SC_R01_OFFLINE_START @R1 @release-0 @positive; SC_R01_CAPABILITY_OFF_NO_LOAD @R1 @R14 @release-0 @negative | C-CFG, C-RUN, C-EVT | CT-01; HN-01, HN-03 (W1–W2) | Fake-provider-only startup; dependency/import audit; deterministic-floor test |
| R2 Project-First Startup | SC_R02_TRUSTED_STARTUP @R2 @release-0 @positive; SC_R02_OPTIONAL_ARTIFACT_DEGRADES @R2 @release-0 @negative; SC_R02_CONTEXT_BOUND @R2 @R7 @release-0 @positive | C-CFG, C-CTX, C-EVT | CT-02; HN-02 (W1–W2) | Manifest/context fixture validation; first-request ordering assertion |
| R3 Provider-Neutral Model Contract | SC_R03_PROVIDER_NORMALIZATION @R3 @release-0 @positive; SC_R03_PROVIDER_TRANSIENT_FAILURE @R3 @R12 @release-0 @negative; SC_R03_PROVIDER_PERMANENT_FAILURE @R3 @R12 @release-0 @negative; SC_R03_MALFORMED_OR_PARTIAL_STREAM @R3 @R12 @release-0 @negative; SC_R03_REAL_ADAPTER_CAPABILITY @R3 @release-1 @positive | C-ENV, C-MDL, C-EVT, C-RUN | CT-04; HN-03, HN-04 (W1–W2); RC-03 (W4) | Fake-stream fixture matrix, attempt boundaries, SDK-leakage/static import gate |
| R4 Typed Tool Runtime | SC_R04_READ_ONLY_TOOL @R4 @release-0 @positive; SC_R04_MALFORMED_TOOL_INPUT @R4 @R12 @release-0 @negative; SC_R04_TOOL_TIMEOUT @R4 @R12 @release-0 @negative; SC_R04_TOOL_OUTPUT_OVERFLOW @R4 @R12 @release-0 @negative; SC_R04_GUARDED_MUTATION @R4 @release-1 @positive; SC_R04_SHELL_CONTAINMENT @R4 @release-1 @positive | C-TOL, C-EVT, C-EVD, C-RUN | CT-05; HN-03, HN-04 (W2); RC-02 (W4) | Input/output/timeout fixtures; no-effect assertion for R0 denials; receipt state validation |
| R5 Permission and Approval Engine | SC_R05_POLICY_OUTCOME Scenario Outline @R5 @release-0 @positive; SC_R05_HARD_DENY @R5 @R15 @release-0 @negative; SC_R05_HEADLESS_ASK @R5 @release-0 @negative; SC_R05_STALE_APPROVAL @R5 @release-0 @negative; SC_R05_APPROVAL_RESUME @R5 @R6 @release-1 @positive | C-POL, C-APR, C-TOL, C-EVT | SEC-01; CT-03; HN-03 (W0–W2); RC-02 (W4) | Exclusive allow/ask/deny outline; fingerprint invalidation fixture; no-effect headless gate |
| R6 Durable Sessions | SC_R06_APPEND_ONLY_SESSION @R6 @release-0 @positive; SC_R06_RESUME_NO_DUPLICATE @R6 @release-0 @negative; SC_R06_SCHEMA_MIGRATION @R6 @release-0 @negative; SC_R06_BRANCH_TREE @R6 @release-1 @positive; SC_R06_TYPED_COMPACTION @R6 @R7 @release-1 @positive | C-SES, C-EVT, C-EVD, C-RUN | CT-02; HN-02; RC-01 (W1–W4) | JSONL append/reconstruction; migration fixture; immutable ancestor and evidence-preservation assertions |
| R7 Context Engineering | SC_R07_BOUNDED_CONTEXT @R7 @release-0 @positive; SC_R07_STALE_OR_UNTRUSTED_CONTEXT @R7 @R15 @release-0 @negative; SC_R07_COMPACTION_REBUILDS_REFERENCES @R7 @release-1 @positive | C-CTX, C-SES, C-EVD | CT-02; HN-02; RC-01 (W1–W4) | Context hash/freshness/scope fixture; token/byte bound; trusted-data separation assertion |
| R8 Agent Roles and Child Agents | SC_R08_ROLE_CANNOT_ESCALATE @R8 @R15 @release-0 @negative; SC_R08_CHILD_DISPATCH_CANONICAL_RESULT @R8 @release-2 @positive; SC_R08_NEEDS_CONTEXT_ADAPTER @R8 @release-2 @positive; SC_R08_BOUND_PARALLEL_WAVE @R8 @R12 @release-2 @positive | C-POL, C-SAR, C-RUN, C-EVD | CT-06; AG-01 (W1, W5) | Policy denial fixture; dispatch/result round trip; per-attempt evidence and aggregate-budget check |
| R9 Project Workflow Integration | SC_R09_SINGLE_COORDINATOR @R9 @R10 @release-1 @positive; SC_R09_DIRECT_FLOW_FILE_EDIT_DENIED @R9 @R15 @release-0 @negative; SC_R09_TASK_MANAGER_MIGRATION @R9 @release-1 @positive | C-GAT, C-EVD, C-RUN, C-SES | TM-01; GT-01; FL-01 (W0, W3–W4) | Ownership/lease test; Task Manager API journal evidence; migration fixture |
| R10 Quality-Gated Completion | SC_R10_EVIDENCE_FREE_COMPLETION_REJECTED @R10 @release-0 @negative; SC_R10_VERIFIED_COMPLETION @R10 @release-0 @positive; SC_R10_UNDISPOSED_BLOCKER_REJECTED @R10 @release-0 @negative | C-GAT, C-RUN, C-EVD | CT-03; GT-01 (W1, W3) | Valid/invalid terminal-state fixtures; evidence-reference and blocker-disposition check |
| R11 Evidence Ledger | SC_R11_EVIDENCE_LINKAGE @R11 @release-0 @positive; SC_R11_REDACTION_BEFORE_PERSISTENCE @R11 @R15 @release-0 @negative; SC_R11_EVIDENCE_SURVIVES_RESUME @R11 @R6 @release-0 @positive | C-EVD, C-EVT, C-SES, C-RUN | CT-02, CT-03; HN-02 (W1–W2) | Redaction fixture; append-only linkage and resume reconstruction validation |
| R12 Recovery and Bounded Loops | SC_R12_TRANSIENT_RETRY @R12 @release-0 @positive; SC_R12_BUDGET_EXHAUSTION @R12 @R16 @release-0 @negative; SC_R12_LOOP_DETECTION @R12 @release-0 @negative; SC_R12_CRASH_CUT_PRE_EFFECT @R12 @release-1 @negative; SC_R12_CRASH_CUT_POST_EFFECT @R12 @release-1 @negative; SC_R12_REPLAY_MISMATCH @R12 @R17 @release-0 @negative | C-MDL, C-TOL, C-RPL, C-SES, C-RUN | CT-04, CT-05; HN-04 (W1–W2); RC-02 (W4) | Retry/loop/budget deterministic fixtures; failpoint matrix; no duplicate effect; mismatch report |
| R13 Multi-Transport Operation | SC_R13_CLI_RPC_PARITY @R13 @release-0 @positive; SC_R13_TRANSPORT_CANNOT_CHANGE_POLICY @R13 @R5 @release-0 @negative; SC_R13_TUI_DEFERRED @R13 @release-2 @positive | C-RUN, C-EVT, C-APR, C-GAT | TR-01 (W3); EX-01 (W5) | Identical normalized event/gate fixture for in-process, CLI, and JSONL/RPC |
| R14 Local-First and Offline Floor | SC_R14_DETERMINISTIC_FLOOR @R14 @release-0 @positive; SC_R14_OFFLINE_REPLAY @R14 @R17 @release-0 @positive; SC_R14_NETWORK_OR_PROVIDER_ACCESS_DENIED @R14 @R15 @release-0 @negative | C-CFG, C-RPL, C-RUN, C-EVT | HN-01, HN-04, TR-01 (W2–W3) | No provider/network invocation audit; deterministic command regression; offline replay fixture |
| R15 Security Boundary | SC_R15_CREDENTIAL_REQUEST_DENIED @R15 @release-0 @negative; SC_R15_PATH_TRAVERSAL_DENIED @R15 @release-1 @negative; SC_R15_SYMLINK_ESCAPE_DENIED @R15 @release-1 @negative; SC_R15_SHELL_INJECTION_DENIED @R15 @release-1 @negative; SC_R15_REDIRECT_PRIVATE_ADDRESS_DENIED @R15 @release-1 @negative; SC_R15_FAIL_CLOSED_ISOLATION @R15 @release-1 @negative | C-POL, C-APR, C-TOL, C-EVD, C-RUN | SEC-01; CT-03, CT-05; RC-02, RC-03 (W0–W4) | Profile matrix; no credential persistence; canonical-path, quoting, DNS/redirect/private-range, and missing-isolation fixtures |
| R16 Model and Cost Visibility | SC_R16_EXACT_ESTIMATED_UNKNOWN_METRICS @R16 @release-0 @positive; SC_R16_UNRELIABLE_METRIC_NOT_TREATED_AS_EXACT @R16 @release-0 @negative; SC_R16_BUDGET_RESERVATION @R16 @R12 @release-0 @positive | C-RUN, C-MDL, C-EVD | CT-03, CT-04; HN-04 (W1–W2) | Metric value-state fixture; conservation/reconciliation assertion; budget ledger check |
| R17 Deterministic Replays | SC_R17_OFFLINE_REPLAY_MATCHES @R17 @release-0 @positive; SC_R17_REPLAY_MISMATCH_REPORTED @R17 @R12 @release-0 @negative; SC_R17_NO_LIVE_EFFECT_ON_REPLAY @R17 @release-0 @negative; SC_R17_ISOLATED_REEXECUTE_DEFERRED @R17 @release-1 @positive | C-RPL, C-TOL, C-SES, C-EVT | CT-05; HN-04; RC-02 (W1–W4) | Fixture binding/hash test; network/effect prohibition; typed mismatch report |
| R18 Explicit Extension Surface | SC_R18_UNREGISTERED_EXTENSION_DENIED @R18 @release-0 @negative; SC_R18_EXTENSION_ESCALATION_REQUIRES_POLICY @R18 @R5 @release-2 @negative; SC_R18_REGISTERED_EXTENSION_PROVENANCE @R18 @release-2 @positive | C-CFG, C-POL, C-TOL, C-MDL, C-SAR | HN-01; EX-01 (W2, W5) | Registry/provenance fixture; denied discovery mutation; explicit capability/policy approval check |

## Mandatory Negative Scenario Set

The following IDs are non-optional. They cannot be collapsed into prose or a
broad “security tests pass” scenario.

| Scenario ID | Threat or failure | Release | Required safe result |
|---|---|---|---|
| SC_R03_PROVIDER_TRANSIENT_FAILURE | Retryable provider failure. | R0 | Bounded, recorded, cancellable attempt within reserved budget. |
| SC_R03_PROVIDER_PERMANENT_FAILURE | Non-retryable provider failure. | R0 | Typed terminal failure with no invented retry. |
| SC_R03_MALFORMED_OR_PARTIAL_STREAM | Malformed, truncated, or invalid stream/tool delta. | R0 | Invalid state recorded; unaccepted call neither executes nor crosses attempts. |
| SC_R04_MALFORMED_TOOL_INPUT | Invalid tool JSON/schema. | R0 | Validation error persists; tool does not execute. |
| SC_R04_TOOL_TIMEOUT | Tool timeout. | R0 | Bounded failure/cancellation; no completion claim. |
| SC_R04_TOOL_OUTPUT_OVERFLOW | Output byte/token overflow. | R0 | Output bounded; status/evidence preserved; no unbounded context loop. |
| SC_R05_HEADLESS_ASK | Approval required without interaction. | R0 | Typed approval-required/denial; no automatic approval or effect. |
| SC_R05_STALE_APPROVAL | Changed action, policy, actor, schema, or expiry. | R0 | Approval invalidated and cannot be consumed. |
| SC_R06_RESUME_NO_DUPLICATE | Interrupted run resumes. | R0 | Accepted events/evidence are not duplicated. |
| SC_R06_SCHEMA_MIGRATION | Prior schema/session version. | R0 | Deterministic migrated view or explicit compatible failure; history immutable. |
| SC_R12_BUDGET_EXHAUSTION | Token/time/cost reservation exhausted. | R0 | No further provider/tool action; durable budget-exceeded state. |
| SC_R12_LOOP_DETECTION | Repeated ineffective action. | R0 | Loop-detected state and bounded next operator action. |
| SC_R12_REPLAY_MISMATCH | Fixture/hash/state mismatch. | R0 | Typed mismatch; no live provider, network, or effect fallback. |
| SC_R14_NETWORK_OR_PROVIDER_ACCESS_DENIED | R0 tries live network/provider use. | R0 | Capability unavailable; no socket/request occurs. |
| SC_R15_CREDENTIAL_REQUEST_DENIED | Credential or secret access request. | R0 | Denied without exposing or persisting raw credential material. |
| SC_R16_UNRELIABLE_METRIC_NOT_TREATED_AS_EXACT | Missing/unreliable provider metric. | R0 | Recorded as estimated or unknown, never fabricated as exact. |
| SC_R17_NO_LIVE_EFFECT_ON_REPLAY | Replay invokes a live effect. | R0 | Rejected; replay remains validate-log or recorded-result simulation. |
| SC_R18_UNREGISTERED_EXTENSION_DENIED | Discovery/unregistered extension seeks authority. | R0 | No registration, mutation, or authority gain. |
| SC_R12_CRASH_CUT_PRE_EFFECT | Crash before intended effect. | R1 | Prepared/executing state recovers without asserting an effect. |
| SC_R12_CRASH_CUT_POST_EFFECT | Crash after effect before durable result. | R1 | Outcome-unknown/reconciliation path; replay cannot duplicate effect. |
| SC_R15_PATH_TRAVERSAL_DENIED | Dot-dot path traversal. | R1 | Canonical path check denies before access. |
| SC_R15_SYMLINK_ESCAPE_DENIED | Symlink reaches outside worktree. | R1 | Resolved-target check denies before access. |
| SC_R15_SHELL_INJECTION_DENIED | Shell argument/quoting injection. | R1 | Structured policy rejects or safely constrains input; no injected command. |
| SC_R15_REDIRECT_PRIVATE_ADDRESS_DENIED | DNS rebinding, redirect, private/link-local address, proxy, or unix socket. | R1 | Broker checks every hop/resolution and denies forbidden egress. |
| SC_R15_FAIL_CLOSED_ISOLATION | Required isolation unavailable or errors. | R1 | Unattended/untrusted mutation does not run. |
| SC_R18_EXTENSION_ESCALATION_REQUIRES_POLICY | Extension seeks broader tool/provider/transport authority. | R2 | Escalation needs policy/approval and provenance; no silent grant. |

## Parser and Traceability Release Gates

DOC-01 and V-01 make every check below blocking. A failure is a release-gate
failure, not a documentation warning.

1. **Parser gate.** Parse acceptance.feature with one pinned Gherkin parser
   selected during implementation. It must return zero syntax errors. Given,
   When, Then, And, But, Background, Scenario, Scenario Outline, and Examples
   are the permitted structural keywords. Temporal prose such as “before the
   first model request” is assertion text, never a step keyword.
2. **Tag-shape gate.** Every Scenario/Scenario Outline has one unique
   @SC_* tag, at least one @R* tag, exactly one @release-* tag, and exactly one
   @positive/@negative tag. Each Scenario Outline has an Examples table.
   Policy outcomes use mutually exclusive rows, not simultaneous assertions.
3. **Requirement gate.** The parser-derived tag index contains R1–R18. Every
   requirement has at least one positive and one negative scenario. This
   report defines no positive-only exception.
4. **Contract gate.** Every scenario contract ID resolves to this report and
   the contract inventory. Every referenced schema has valid and invalid
   deterministic fixtures; durable/versioned contracts also have migration
   fixtures.
5. **Task gate.** Every scenario maps to a planned task. Every task changing a
   contract maps back to one or more scenarios. A task with no scenario is
   either explicitly documentation-only or rejected as an unexplained gap.
6. **Release gate.** Release 0 selects only @release-0 scenarios and verifies
   none requires a forbidden D1 capability. Later scenarios retain their
   explicit @release-1/@release-2 tags and cannot silently count as R0.
7. **Evidence gate.** The gate output persists parser version, feature hash,
   scenario IDs, result, fixture hashes, contract versions, task IDs, and a
   reason for every skipped later-release scenario. A skipped scenario never
   counts as passed coverage.

## Remediation Verification Evidence

The pinned compatibility parser/traceability command used for this package is:

```text
python3 /private/tmp/validate_keryx_docs.py docs/requirements/keryx-project-agent-harness/acceptance.feature
```

It reported
`GHERKIN_PARSER_COMPATIBILITY_OK parser=keryx-gherkin-compat-1 scenarios=73 requirements=18 feature_sha256=8e6b5815830537562147af3c509affc1f7ffc49554af27d1ba3292d3abfe61c6`.
The compatibility parser is intentionally pinned in the remediation job; a
future runtime may replace it with a vendored upstream Gherkin parser only if
the same zero-error and tag/traceability results are preserved.

## No-Gap Accounting

The coverage universe is exactly R1–R18, C-ENV through C-SAR, and W0 through
W6 above. Every requirement, every contract ID, and every task family has one
or more scenario links in the matrix. Later capability is deferred only by an
explicit release tag, never by omission.

The required machine-checkable relationship is:

    R1..R18 -> @SC_* scenario -> C-* contract/fixture -> W*-Task -> gate evidence

Any new requirement, schema, task, or scenario added after this report must add
reverse links before the parser/traceability gate can pass. Removing a scenario
requires a replacement mapping or an explicit retired-requirement decision; a
blank cell or untagged scenario is invalid.

## Rewrite Order

1. Preserve this report as the coverage baseline and add contract-inventory
   links when the schema work is complete.
2. Replace the invalid feature with parser-valid scenarios for every SC_* row,
   using a Scenario Outline for exclusive policy outcomes.
3. Add release, requirement, mode, task, and contract declarations while
   writing each scenario, not after implementation begins.
4. Implement DOC-01 parser/traceability checks before accepting automated
   scenario results.
5. Freeze the R0 subset after CT-01 through CT-05 and before fake-loop
   implementation. Branch/compaction, mutation/network, real providers,
   flow integration, child agents, parallel tools, and extensions stay in
   explicitly tagged later-release subsets.

## Implementation-plan identifier crosswalk

The feature also contains these explicit precondition/boundary scenarios; they
are part of the normative universe and intentionally have their own IDs:

| Scenario | Requirement | Contract | Task |
|---|---|---|---|
| `SC_R02_MISSING_PRECONDITION` | R2/R12 | C-CFG/C-RUN | `R0-01` |
| `SC_R08_EXTENSION_ESCALATION_REQUIRES_POLICY` | R8/R18/R15 | C-POL/C-TOL | `H-02` |
| `SC_R15_READ_WITHIN_ROOT` | R15/R4 | C-POL/C-TOL | `R0-01` |

The package implementation plan was recomposed with more granular stable IDs.
The following crosswalk keeps this coverage baseline traceable without treating
the old T1–T30 plan as authoritative:

| Coverage ID family | Normative plan IDs |
|---|---|
| `DOC-01`, `SEC-01` | `D-01`…`D-04` |
| `TM-01` | `TM-01`…`TM-03` |
| `CT-01`…`CT-06` | `C-01`…`C-03`, `P-01`…`P-02` |
| `HN-01`…`HN-04` | `F-01`…`F-02`, `R0-01`…`R0-03` |
| `TR-01`, `GT-01` | `R0-03`, `R0-02` |
| `RC-01`…`RC-03`, `FL-01` | `RS-01`…`RS-02`, `B-01`…`B-02`, `M-01`…`M-02`, `FI-01`…`FI-02` |
| `AG-01`, `EX-01` | `CA-01`…`CA-02`, `PA-01`, `H-02` |
| `V-01` | `H-01`, `E-01`…`E-03` |

If task granularity changes again, this crosswalk and the scenario matrix must
be changed together before parser/coverage verification.
