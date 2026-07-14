# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: `keryx harness exec` wires R2-5 end-to-end, fail-closed — the command runs a contained subprocess through the reused `runContainedProcess` + `RealProcessAdapter` and prints ONE JSON blob `{outcome, receipt?, evidenceRefs}` with the typed outcome (completed|timeout|output-overflow|cancelled|blocked). WITHOUT `--allow-real-subprocess` (or `KERYX_ALLOW_REAL_SUBPROCESS=1`) it refuses and returns with NO adapter constructed and NO spawn. In the offline suite a `FakeProcessAdapter` is injected via deps so a clean-exit yields `completed` (with `exitCode`), a fake timeout/overflow/cancel yields the matching NON-success outcome, and an unapproved argv/env or a budget breach yields `{outcome:{kind:"blocked"}}` with the adapter's spawn never invoked. A flag-gated real-exec smoke (`/bin/echo`) is CI-inert.
- AC2: `keryx harness extension` wires R2-1 end-to-end, fail-closed — from an injected/`--spec` manifest + capability grant + task/context, the command calls the reused `registerExtension` then `dispatchExtension` and prints `{registration, dispatch, result, evidenceRefs}` (a canonical subagent-dispatch/result + evidence). An invalid or denied registration fails closed (an error result, NO dispatch), and an escalating grant lacking policy ∧ provenance ∧ approval is denied.
- AC3: `keryx harness wave` wires R2-3 end-to-end, fail-closed — from an injected/`--spec` set of registered-extension wave tasks + `{maxConcurrency, parentRemaining}`, the command calls the reused `planExtensionWave` and prints `{ok:true, waves}` where no wave exceeds `maxConcurrency` and the aggregate budget is respected; an unregistered task, a dependency cycle, or a budget breach yields `{ok:false, reason}`.
- AC4: D-02 + secrets + reuse-only — none of the three new commands writes flow.json (no `writeFlow`/flow.json reachable from the new command code; managed flow state stays owned by the Task Manager); secrets (env VALUES / `ANTHROPIC_API_KEY`) are never printed or logged (only allowlisted env KEYS and typed outcomes appear in output); and the commands COMPOSE the reused R2 functions (`runContainedProcess`, `dispatchExtension`, `registerExtension`, `planExtensionWave`) + the `harness.ts` `run` pattern without rewriting them (edits to prior modules are additive-only).
- AC5: No regression / determinism / scope / deps — `tsc --noEmit` is clean and the full `bun test` suite is ≥ the baseline (1338 pass / 2 skip) with the new command tests green and 0 fail; the offline suite is deterministic (injected adapter/spec/clock/id; no real spawn/fs/network in CI; the real subprocess is gated behind `--allow-real-subprocess`/`KERYX_ALLOW_REAL_SUBPROCESS` and its smoke is `skipIf`-gated); no new production dependency (`dependencies` `{}`, `node:child_process` is stdlib); new code lives under `src/commands/` (+ `src/cli.ts` routing / usage), with additive-only edits to prior modules if strictly needed; the frozen requirements package, canonical schemas, `src/eval/`, `src/contracts/`, and ADR-0001…0004 are NOT modified.
