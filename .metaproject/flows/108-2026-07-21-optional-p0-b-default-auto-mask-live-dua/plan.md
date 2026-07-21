# Plan — flow 108

## Approach

Smallest coherent change across three tracks; TDD for default flip.

### Track A — P0.b

1. Change built-in fallback in `resolveMasksFromSandboxEnv` from `"manual"` → `"auto"`.
2. Keep `parseMaskMode` soft-fail for empty/invalid raw strings as `manual` (only
   used when env is non-empty and invalid; invalid still manual).
3. Update comments (P0.b product default).
4. Add/adjust unit tests: fully unset → auto; explicit manual still manual; order intact.
5. Docs: README status, migration restore steps, package note.

### Track B — Live dual-axis

1. Add `dual-axis-live.smoke.test.ts` gated by `KERYX_DUAL_AXIS_LIVE=1`.
2. Always-on companion tests: redaction FAIL on secret in artifacts; Axis C via resolver.
3. Live path: Preflight notes + Axis B minimum (sentinel ≠ real when restricted path available).
4. Axis A → SKIP with documented reason when multi-agent unavailable.
5. Document flag in verification.md.

### Track C — Light UX

1. Operator note in package README (resolution order, auto default, `/connect`).
2. Docs-only for `sandbox defaults show` (CLI not added — keep surface small).
3. Mark optional phase in launch-prompts/README after land.

## Trade-offs

- Init skeleton may still write `maskMode: "manual"` — that is **explicit** project policy
  (restores P0.a for that project), not built-in default. Built-in applies only when
  policy/global omit maskMode.

## Constraints

Zero new npm deps; ADR-0007 TLS fail-closed unchanged; no secrets in commits.
