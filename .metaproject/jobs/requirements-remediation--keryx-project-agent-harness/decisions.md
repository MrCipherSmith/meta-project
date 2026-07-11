# Job Decisions
Version: 1.0.0

Decisions taken by this remediation job, with the evidence that supports each and
the finding(s) they close. Baseline decisions D1–D7 come from the job prompt and
were each checked against the source review for direct contradiction — none found.

## Adopted decision baseline (D1–D7)

| ID | Decision | Supporting evidence | Closes / advances |
|---|---|---|---|
| D1 | Release 0 = offline fake provider, read-only tool, provider-neutral loop, minimal append-only session, context manifest, evidence-linked output, CLI+JSONL/RPC parity, deterministic replay. Excludes production provider, mutation, shell, network, child agents, parallel tools, extensions, provider-side storage, TUI. | implementation-readiness.md criterion 7; S-10 "no minimal value slice". | S-01, S-10 |
| D2 | Single coordinator: flow-orchestrator/Task Manager owns managed-flow task state, retries, review/fix, completion. Harness = execution primitives + evidence/gate artifacts; never edits flow.json; no second loop. | findings.json S-06; specification.md 248-262 "only one loop authority". | S-06 |
| D3 | ≥3 security profiles (read-only-review, monitored-trusted-local, unattended-untrusted); Release 0 = read-only-review only; unattended/untrusted mutation fails closed without a real sandbox; permission prompt is not a boundary. | findings.json S-04; report.md "What Requires Clarification" 1. | S-04, S-05 |
| D4 | Local Keryx event/session log authoritative; provider-side storage/continuation off by default and out of Release 0; future enablement needs a separate capability/policy/retention/deletion contract; instructions reconstructed locally each request. | findings.json S-09; report.md clarification 4. | S-09 |
| D5 | Append-only session tree; branch = branchId/forkEntryId/leaf/immutable ancestors; merge excluded from v1; compaction = typed derived entry that never removes evidence/history. | findings.json S-02 (missing branch/compaction contracts); report.md clarification 5. | S-02 (branch/compaction) |
| D6 | Canonical durable child object = versioned `subagent-result`; STATUS text = adapter framing; adapter converts framing to canonical object before persistence/validation; `harness-agent-task` removed as a parallel source of truth. | findings.json S-08; report.md "What Must Be Removed". | S-08 |
| D7 | Task Manager evolution requirement (dependencies, attempts, blocked/failed/skipped/disposition, AC refs, evidence refs, budgets, run/session linkage, backward-compatible migration) is a prerequisite reflected in the new implementation plan. | findings.json S-06; implementation-readiness.md criterion 5. | S-06, S-10 |

## Job-specific method decisions

| ID | Decision | Rationale |
|---|---|---|
| J-01 | Follow `requirements-package-standard.mdc` (flat, English, versioned) rather than the date-stamped ru/en/ai layout of `requirements-management.mdc`/`implementation-plans.mdc`. | Target is an existing requirements-package-standard package; prompt mandates English-only durable artifacts and in-place editing. Routed deliberately, not silently. |
| J-02 | Corpus-harness relocation target = `src/eval/` (per prompt Phase 3 recommendation and specification.md 77 "future location for current corpus harness"). Documented as requirement, not executed (no production-code change). | Resolves the `src/harness` dual-meaning while staying doc-only. |
| J-03 | Validator strategy is specified as JSON Schema Draft 2020-12 with a keyword-coverage requirement; no validator dependency is installed in this job. | S-11 needs a capable validator, but installing dependencies requires separate confirmation and is out of scope for doc remediation. |
| J-04 | Schemas de-duplicate via a shared `harness-envelope` `$defs` file and `$ref`; new schemas keep `schemaVersion` + stable `$id`. | Phase 4 instruction to use `$defs`/shared envelopes. |
| J-05 | `harness-agent-task.schema.json` is deprecated in place (marked `deprecated`, pointing to canonical contracts) rather than deleted, to preserve traceability and README links; the canonical extension lives in a new schema. | Safer than deletion; keeps README index stable; still removes it as a source of truth (D6). |

## Escalation policy

If, during editing, source evidence directly contradicts a baseline decision,
stop and surface the specific contradiction (do not guess). No contradiction has
been found so far.
