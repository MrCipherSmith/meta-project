# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: D-01 — `docs/decisions/keryx-harness/ADR-0001-d01-release0-boundary.md` freezes the Release 0 boundary (offline / read-only: no mutation, unrestricted shell, network, child agents, parallel tool calls, executable extensions, provider storage, or TUI), states measurable Release 0 success criteria traceable to PRD §Success Criteria and R0-01…R0-03, and includes a signed decision table with no unresolved Release 0 boundary item.
- AC2: D-02 — `docs/decisions/keryx-harness/ADR-0002-d02-single-coordinator-ownership.md` freezes Task Manager as the single managed-flow coordinator, provides an ownership/import matrix of inward ports (harness = evidence/gate producer, never a competing loop; no direct `flow.json` writes), and records a contradiction check against S-06 and R1-03 that finds no contradiction with the frozen spec.
- AC3: D-03 — `docs/decisions/keryx-harness/ADR-0003-d03-security-profiles-containment.md` freezes the security profiles and required containment as a profile/isolation matrix (mapped to `policy-profile.schema.json`, S-04, R1-01, M-02) and states an explicit fail-closed decision: absent required containment/isolation, higher-risk operation is blocked (typed block, never silent allow).
- AC4: D-04 — `docs/decisions/keryx-harness/ADR-0004-d04-provider-branch-child.md` freezes provider-state, branch model, and child wire-framing as decision records, each linked to its owning schema (provider/model + `provider-descriptor` for S-02, `branch-metadata` for S-08, `harness-child-contract-extension` for S-09) and to a `research-ledger.md`; every deferred question is recorded as `OPEN` and none is silently resolved.
- AC5: `docs/decisions/keryx-harness/decision-registry.md` indexes D-01…D-04 with signed status, and the four ADRs are mutually consistent and consistent with the frozen requirements package (README/PRD/specification/acceptance/schemas) — verified by the T9 review with no unresolved contradiction; the frozen requirements package is unmodified.
