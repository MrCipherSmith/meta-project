# Review Decisions
Version: 1.0.0

| Decision | Source | Disposition | Required follow-up |
|---|---|---|---|
| D-01 | S-01 | partially resolved | Keep draft; do not promote until all review gates pass. |
| D-02 | S-02/S-03/S-07 | partially resolved | Run standards validator, semantic checks, and real fixture families. |
| D-03 | S-04/S-05 | partially resolved | Preserve fail-closed security profiles; add executable boundary evidence. |
| D-04 | S-06 | still open | Remove orchestration ambiguity and enforce one coordinator/import direction. |
| D-05 | S-08 | partially resolved | Make deprecated task migration-only and reject it in new transports. |
| D-06 | S-09 | partially resolved | Keep provider state off by default; add attempt/fixture evidence before provider work. |
| D-07 | S-10 | resolved in plan, not readiness | Plan is reordered, but no implementation or gate evidence exists. |
| D-08 | S-11 | still open | Add validator, fixture files, migration registry, and failpoint execution. |
| D-09 | S-12 | resolved pending parser | Feature and matrix now reconcile at 73 scenarios with positive/negative R1–R18 coverage; run the pinned parser. |

## Strict synthesis decision

`REQUEST_CHANGES` is retained. The strongest remaining evidence is the
explicitly unavailable validator, followed by coordinator/deprecated-contract
ambiguity and the missing compatibility registry. No finding is downgraded
merely because the package is marked draft.
