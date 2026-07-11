# Review Comparison
Version: 1.0.0

## Source and managed iterations

The immutable baseline is
`.metaproject/reviews/2026-07-10-review-flow-users-tsaitler-aleksandr-goodea-goodpro-/`.
Two managed remediation iterations were permitted and completed:

| Iteration | Package | Verdict | Findings |
|---|---|---|---:|
| 1 | `2026-07-11-keryx-project-agent-harness-remediation-1` | REQUEST_CHANGES | 0 BLOCKER, 1 P0, 3 P1 |
| 2 | `2026-07-11-keryx-project-agent-harness-remediation-2` | PASS | 0 BLOCKER, 0 P0, 0 P1 |

## S-01…S-12 disposition

| Finding | Original gap | Durable resolution | Final evidence |
|---|---|---|---|
| S-01 | premature readiness | draft/future boundaries, D1–D7, promotion gate | README, PRD, roadmap, review-2 |
| S-02 | missing canonical contracts | shared envelope plus event/session/provider/evidence schemas and registry | 35-schema Ajv run |
| S-03 | unsafe mutation recovery | WAL, idempotency, receipt, outcome-unknown, reconciliation and replay states | artifact-lifecycle, semantic fixtures |
| S-04 | prose-only containment | profiles, fail-closed isolation, path/argv/network broker controls | security-protocol, review-2 |
| S-05 | inexact approval | action/policy/provenance/schema/actor/expiry fingerprints and single-use consumption | approval schemas and fixtures |
| S-06 | two coordinators | Task Manager sole managed authority; `execution/turn-control` local only | specification, handoff, architecture review |
| S-07 | evidence-free completion | terminal conditionals, evidence refs, blocker/disposition requirements | completion/run schemas and fixtures |
| S-08 | conflicting child task truth | canonical dispatch/result; legacy task migration-only | registry, catalogs, agent-protocol |
| S-09 | lossy provider semantics | attempt-scoped streams, extensions, typed errors, remote state off | provider-protocol, research ledger |
| S-10 | no minimal slice/prereqs | Release 0 and 16 dependency waves including Task Manager/corpus prerequisites | implementation-plan, handoff |
| S-11 | unenforceable tests | pinned parser, Ajv Draft 2020-12, semantic fixture runner, failpoint requirements | three verification commands |
| S-12 | invalid/untraceable acceptance | 73 parser-compatible scenarios, exact matrix crosswalk, R1–R18 positive/negative/task/release tags | Gherkin report and review-2 |

## Final gate

`findings.json` in review iteration 2 is `[]`. The package is promoted to
`specification ready (future)`; production implementation remains outside this
job and must satisfy the handoff's runtime evidence gates.
