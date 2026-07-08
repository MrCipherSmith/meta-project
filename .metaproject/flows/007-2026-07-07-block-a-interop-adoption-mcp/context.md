# Context

Collected deterministically by `gd-metapro flow init` at 2026-07-07T23:46:53.913Z.
The flow-init skill enriches this with formalization, brainstorm results, and
interview answers.

## Code Graph

- `.metaproject/data/gdgraph/artifacts/summary.md`
- `.metaproject/data/gdgraph/artifacts/module-map.json`

Use `gd-metapro gdgraph affected <file>` for blast radius.

## Code Health

- gate: warn (as of 2026-07-07T13:53:28.505Z)
- refresh: `gd-metapro health run`

## Enabled Metaproject Modules

- gdgraph
- gdctx
- gdskills
- memory
- tasks
- health
- testing
- gdwiki
- security

## Agent Findings

### Authoritative source (read first)
- docs/requirements/roadmap-2026/A-interop-mcp/prd.md — problems/goals/metrics/non-goals/stories.
- docs/requirements/roadmap-2026/A-interop-mcp/specification.md — Tool↔service registry (§6), Resource URI scheme (§7), transports (§9), scan-mcp detector (§8), generators (§10), structure (§3).
- docs/requirements/roadmap-2026/A-interop-mcp/acceptance-criteria.md — AC1..AC11 (this flow's ACs consolidate them).
- docs/requirements/roadmap-2026/A-interop-mcp/tasks.md — T1..T14 + dependency graph.

### Block 0 seam to instantiate (already landed on main @ 86966a7)
- `src/capability/seam.ts` — `resolveCapability(cwd, spec) → Adapter|null`, `isCapabilityEnabled`, `runCapabilityOrFallback`. The `mcp` and `http` ceilings + E3 detectors gate through this.
- `src/capability/warn-once.ts` — `warnCapabilityDegraded` for graceful degradation.
- `src/assets/` — resolver/lock/pull + `assets.lock.json`; rug-pull baseline reuses the sha256/checksum convention.
- `optionalDependencies` policy: `package.json` `dependencies` is `{}`; MCP SDK lands under `optionalDependencies`, lazy `await import()` ONLY in `server.ts`. A static no-top-level-import guard test already exists (`src/capability/no-optional-imports.test.ts`) — EXTEND it to cover the SDK.
- `src/harness/` — `runCorpus`/`gateCorpus`; the `fixtures/mcp-threat/` corpus plugs into this.

### Existing facades to wrap (verified present — do NOT reinvent)
- `src/security/service.ts` — `createSecurityService(cwd)` (check/scan). `src/security/guard.ts:redactRaw` (line 129) — the E3 output seam.
- `src/security/detect/*` + `runDetectors` (in `src/security/resolve.ts`/`service.ts`) + `DetectorMatch` (`src/security/types.ts`) — slot `detect/mcp.ts` here.
- `src/memory/service.ts` — `createMemoryService()` (search). `src/health/service.ts` — `createCodeHealthService()` (gate/status). `src/flow/service.ts` — `createFlowService()` (list/get — read-only only). `src/wiki/service.ts` — `createGdWikiService()` (collect/validate/checkLinks).
- `src/gdgraph/query.ts` — `getAffected(graph,file,depth?)`, `getCycles(graph)`, `getOrphans(graph)`, `loadGraph(root)` (pure fns; adapter loads graph then calls fn).
- `src/standard/service.ts:runValidate(cwd)` (line 20).
- `src/commands/skills.ts` — existing `skills export --runtime codex|claude` (add `plugin`); `src/gdskills/` export path.
- `src/commands/init.ts` / `update.ts` — module manifest wiring + Block 0 capability registry entry points (`registerCapabilitiesFromArgs` / `reconcileCapabilitiesOnUpdate`).
- `cli.ts` — command routing (add `mcp` + `security scan-mcp`).

### Hard invariants (the golden rule, C0-7)
- `dependencies` stays `{}`; MCP SDK only under `optionalDependencies`; NO top-level SDK import — lazy `await import()` in `server.ts` only.
- `modules.mcp.enabled=false` (default) ⇒ byte-identical to today; no SDK loaded on any non-`serve` path; no listening socket on stdio; the 201 pre-existing tests unchanged.
- EVERY tool result routed through `redactRaw`; `src/mcp/` imports ONLY `createXService()` facades + `src/lib/*` + `guard.ts` (import-boundary test enforces).
- Sanctioned exception: only `mcp serve` may hard-fail on a missing SDK, with an actionable message.

### Baseline
- main @ 86966a7; `bun run check` green (201 tests); 9 modules enabled + Block 0 capability seam.
