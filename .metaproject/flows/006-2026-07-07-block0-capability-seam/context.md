# Context

Enriched by flow-orchestrator (Phase 1).

## Authoritative source (the block spec — read these first)

- docs/requirements/roadmap-2026/00-capability-seam/prd.md — problems/goals/stories.
- docs/requirements/roadmap-2026/00-capability-seam/specification.md — the seam/adapter/asset/harness contracts + TS interface sketches + manifest capability JSON shape.
- docs/requirements/roadmap-2026/00-capability-seam/acceptance-criteria.md — AC0-1 … AC0-24 (this flow's ACs consolidate them).
- docs/requirements/roadmap-2026/00-capability-seam/tasks.md — T1–T18 decomposition + dependency graph.
- docs/requirements/roadmap-2026/README.md + tech-bestpractices constraint IDs (C0-*, A-*, F-*, T-*) referenced by the ACs.

## Existing seams to generalize (reuse, don't reinvent)

- `src/security/config.ts` — `DEFAULT_SECURITY_CONFIG`, deep-merge, load-or-default, malformed-JSON fallback → the pattern for capability config.
- `src/security/guard.ts` — `isSecurityEnabled` (reads `modules.security.enabled`), never-throw / graceful no-op → the pattern for resolveCapability gating + adapter safety.
- `src/security/config.ts` `backends` block → the concrete precedent for opt-in backends the seam generalizes.
- `src/standard/capabilities.ts` — `extractCapabilities` (module capabilities) → extend to the enriched object shape.
- `src/commands/init.ts` — module flags (`--no-<module>`), manifest writing, `modules.<m>` entries → add capability flags + `capabilities[]`.
- `src/commands/update.ts` — `moduleEnabled` reconciliation → mirror for capability reconciliation.
- `src/lib/{json,fs}.ts` — JSON read/merge, path helpers.

## Hard invariants (the golden rule)

- `package.json` `dependencies` MUST stay empty; new libs only in `optionalDependencies`; NO top-level import of any optional dep in `src/` (lazy `await import` inside adapters only).
- Default install + every default command MUST be byte-identical to today with zero opt-in flags and no assets; NO socket opened by any default command (network only inside `assets pull`).
- `resolveCapability` and adapters MUST NEVER throw; every failure → `null` → deterministic fallback; degradation warns exactly once per invocation, exits 0.
- Assets sha256-verified on every load; `assets.lock.json` committed; no install-hook download.

## Baseline

- main @ 7a2219b; `bun run check` green (159 tests). Security enabled (9 modules).
- The reference capability is NON-SHIPPING (throwaway) — proves the pattern only.
