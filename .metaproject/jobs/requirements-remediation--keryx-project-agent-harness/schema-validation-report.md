# Schema Validation Report
Version: 1.2.0

## Scope

This report covers the documentation/contract remediation package as of the
current working tree. It does not claim runtime implementation or semantic
validator support in production.

## Results

| Check | Result | Evidence |
|---|---|---|
| JSON parse | PASS | 39 JSON files under `schemas/` and `schemas/fixtures/` parsed with Python's JSON parser |
| Stable schema ids | PASS by inspection | New contracts use stable HTTPS `$id`; all use `schemaVersion: 1` or the shared definition |
| Shared definitions | PASS by inspection | `harness-envelope.schema.json` provides `$defs` for IDs, hashes, causal IDs, provenance, and policy binding |
| Completion conditionals | PASS by syntax/structure | `completion-gate-result` and `harness-run-output` encode pass/completed conditions; cross-record reachability remains semantic |
| Policy/approval coupling | PASS by schema structure | `ask` requires approval and fingerprints; stale/single-use consumption remains semantic |
| Fixture matrix | PASS | `schemas/fixtures/fixture-matrix.json` maps every contract to positive and negative catalog pointers, with mutation and migration families |
| Draft 2020-12 capability | PASS | Bundled Node runtime with Ajv 8.20.0 (`Ajv2020`, `ajv-formats`) compiled all 35 package schemas without installing dependencies |
| `$ref` resolution | PASS | The validator registered all stable `$id` schemas and resolved shared-envelope refs during compilation |
| Positive/negative fixture matrix | PASS | `fixture-matrix.json` validated 33 active positive catalog pointers and rejected 33 active negative catalog pointers; deprecated `harness-agent-task` is migration-only and excluded |
| Semantic fixture checks | PASS | `/private/tmp/validate_harness_semantics.py` checked causal leaf/cursor, immutable branch ancestry, compaction identity, approval binding, provider privacy, replay no-side-effects, evidence-backed completion, fail-closed Release 0 policy, and deprecated-contract exclusion |

## Remaining gate

The verification command used for this report was:

```text
/Users/tsaitler.aleksandr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /private/tmp/validate_harness_schemas.js
```

It reported `SCHEMA_VALIDATION_OK schemas=35 fixture_families=33`.
The semantic fixture command reported
`SEMANTIC_FIXTURE_VALIDATION_OK active_families=33 checked_invariants=9`.
The checks validate the documentation fixtures; production runtime behavior is
still future implementation work and must retain these gates.
