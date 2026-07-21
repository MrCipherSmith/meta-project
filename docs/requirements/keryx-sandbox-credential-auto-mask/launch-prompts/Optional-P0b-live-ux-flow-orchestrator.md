# Launch prompt — Optional tail (P0.b + live dual-axis + light UX)
Version: 0.1.0

**Prerequisite:** P0–P2 on main (PR #175–#178). This phase is **optional**.

Copy the fenced block into a flow-orchestrator session. Prefer **one flow**;
split into sub-flows only if the operator asks.

---

```text
Run flow-orchestrator for ONE optional package tail only: P0.b + live dual-axis smoke + light UX.

## Metaproject hard gate
Project root: keryx worktree (prefer clean main).
Read `<project-root>/.metaproject/index.md` before any repo action.
Never edit flow.json by hand. All flow state: `keryx flow …` CLI only.

## Standing operator rule
When green: commit deliverables and push/merge to main.
Then stop. Do not invent P3 features.

## Intent
Optional polish for Sandbox Credential Auto-Mask after P0–P2 landed.

Package: docs/requirements/keryx-sandbox-credential-auto-mask/
Read: README, specification.md, metrics-and-validation.md, verification.md,
policies.md, implementation-plan.md (P0.a vs P0.b migration notes).

## Baseline (do not reimplement)
- mask-resolve + shell/harness (P0)
- dual-axis-report + verification.md (Verify)
- global sandbox.json (P1)
- project .keryx/sandbox-policy.json + init skeleton (P2)
- Default today: unset maskMode → **manual** (P0.a)

## Deliverables (three tracks — all in this flow unless operator scopes down)

### Track A — P0.b product default flip
1. When `KERYX_SANDBOX_MASK_MODE` unset AND no project/global maskMode:
   default becomes **auto** (was manual).
2. Document migration clearly in README + changelog-style note in package:
   - how to restore old behavior: `maskMode: "manual"` in sandbox.json or
     `export KERYX_SANDBOX_MASK_MODE=manual`
3. Update unit tests that assumed P0.a built-in manual when fully unset.
4. Keep fail-closed TLS: auto still auto-derives TLS when masks non-empty.
5. Do NOT force sandbox shell on by default (shell still off unless env/file).

### Track B — Live dual-axis smoke (flag-gated)
1. Add operator-run or flag-gated test/script under package or src tests:
   - gated by env e.g. `KERYX_DUAL_AXIS_LIVE=1` (default CI does NOT run it)
2. Implements or scripts Preflight + Axis B minimum from verification.md:
   - with mode=auto + fixture or real key name only in logs
   - assert child env is not the real key when restricted+mask path available
3. Axis A may be SKIP if multi-agent not available; document SKIP reason.
4. Axis C: reuse unit golden / resolveMasksFromSandboxEnv (already covered).
5. Redaction: RUN_DIR or fixture REPORT must fail if secret substring appears.
6. Never print real API keys in CI logs or committed artifacts.

### Track C — Light UX (minimal)
Pick the smallest useful set (do all if cheap):
1. Short note in shell/harness help or package operator-guide snippet:
   resolution order + how to enable auto + keys via /connect.
2. Optional: `keryx sandbox defaults show` (read-only dump of effective
   global sandbox.json path + contents, redacted — no secrets). If too large,
   document-only is OK; do not add heavy CLI surface without tests.
3. Update launch-prompts/README to mark this optional phase done/not done.

## Frozen acceptance criteria
- AC-O1: With fully unset mode (no env, empty project policy, empty global file),
  resolveMasksFromSandboxEnv uses maskMode **auto** (P0.b).
- AC-O2: Explicit manual (env or file) still forces manual; regression tested.
- AC-O3: Migration/docs explain how to get P0.a behavior back.
- AC-O4: Live dual-axis path exists and is **off** on default CI (flag-gated).
- AC-O5: Live or dry-run path documents redaction fail if secret leaks.
- AC-O6: No secrets in committed fixtures; zero new runtime npm deps.
- AC-O7: P2 project policy and P1 global file still override correctly after default flip
  (order: env > project > global > built-in auto).

## Constraints
- Zero new runtime npm dependencies.
- Do not change ADR-0007 fail-closed TLS rules.
- Do not store secrets in project policy or init.
- Prefer smallest coherent change; TDD where project rules require.
- code-verifier + focused tests + review before completion choice.
- Never edit flow.json / frozen AC by hand.

## Flow lifecycle
1. keryx flow init --title "Optional P0.b default auto-mask + live dual-axis + UX"
2. Freeze AC-O1..O7; start; implement; verify; completion A (PR+merge to main).

## Out of scope
- New mask algorithms, new providers
- Making OS sandbox shell default-on
- Token cost budgeting, multi-agent fleet features
- Forcing live dual-axis green on every CI job

## Done report
flow id, files, tests, commit/PR URL, residual risks,
explicit: "optional tail only; core P0–P2 already done"
```

---

## Scope down (if operator wants a smaller flow)

| Sub-prompt title | Only tracks |
|------------------|-------------|
| Optional P0.b only | Track A + AC-O1, O2, O3, O7 |
| Optional live dual-axis only | Track B + AC-O4, O5, O6 |
| Optional UX only | Track C + docs tests |
