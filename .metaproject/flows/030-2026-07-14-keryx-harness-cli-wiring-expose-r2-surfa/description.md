# Flow 030 — keryx harness CLI wiring (expose R2 surfaces live)

Status: formalized
Source: user chose future-option 1 (E-03-release2-handoff §6a), full scope: wire all three
Release 2 surfaces into the live `keryx` CLI.

## Problem

The Release 2 surfaces are tested library functions but are NOT reachable from the CLI:
`bun ./src/cli.ts ctx rg 'dispatchExtension|planExtensionWave|runContainedProcess|registerExtension'
src/commands src/cli.ts` → **0 matches**. Only the provider surface is wired (`keryx harness run`,
`keryx shell`). A user cannot run the extension-execution (R2-1), bound-parallel-wave (R2-3), or
real-subprocess executor (R2-5) end-to-end. This flow adds three `keryx harness` subcommands that
compose those functions, mirroring the existing `harness run` command's pattern.

## Reuse base (compose; do NOT rewrite)
- `src/commands/harness.ts` — the pattern to mirror: injectable deps (`fetch`/`clock`/`idSeq`/`env`),
  fail-closed arg guards, `makeProvider`, a `readOnlyProfile`, structured JSON output, and — critically
  — it **NEVER persists managed flow state** (D-02).
- R2-5 `src/harness/process/executor.ts` `runContainedProcess(input, deps)` + `real-process-adapter.ts`
  `RealProcessAdapter` (gated by `allowRealSubprocess`/`KERYX_ALLOW_REAL_SUBPROCESS`) + the fake adapter
  for offline tests.
- R2-1 `src/harness/extension/execute.ts` `dispatchExtension` + W15 `registry.ts` `registerExtension`.
- R2-3 `src/harness/extension/bound-wave.ts` `planExtensionWave`.
- W10 `guardAction`/`actionFingerprint`, W12 `inheritBudget`, W7 evidence — reused transitively.

## Scope — 3 new subcommands under `keryx harness`

- **`keryx harness exec`** (R2-5) — run a REAL contained subprocess through `runContainedProcess` +
  `RealProcessAdapter`, **fail-closed by default**: without `--allow-real-subprocess` (or
  `KERYX_ALLOW_REAL_SUBPROCESS=1`) it prints a refusal and returns (no spawn). Flags: `--cwd <dir>`,
  `--timeout-ms <n>`, `--max-output-bytes <n>`, `--allow-env KEY1,KEY2` (env allowlist), and the
  command after `--` (`keryx harness exec [flags] -- <program> <args…>`). Builds the
  `ContainedCommand`/allowlist/budget/`outputLimitBytes`, runs it, prints ONE JSON blob
  `{outcome, receipt?, evidenceRefs}` (typed outcome completed|timeout|output-overflow|cancelled|
  blocked). Offline tests inject a `FakeProcessAdapter` via deps (deterministic, no real spawn); a
  flag-gated real smoke stays out of CI.
- **`keryx harness extension`** (R2-1) — register + dispatch a single extension. Input via a JSON spec
  (`--spec <file>` or injected in tests) carrying the manifest + capability grant + reserved budget +
  task/context fields. `registerExtension` → (fail-closed on an invalid/denied registration) →
  `dispatchExtension` → print `{registration, dispatch, result, evidenceRefs}` (canonical
  subagent-dispatch/result). Deterministic (injected id/clock; no real subprocess).
- **`keryx harness wave`** (R2-3) — plan a bound-parallel wave over registered extensions. Input via a
  JSON spec (a set of extension wave tasks + `{maxConcurrency, parentRemaining}`). `planExtensionWave`
  → print `{ok, waves|reason}` (bounded waves with per-task dispatch + per-attempt evidence; fail-closed
  on an unregistered task / budget breach / cycle). Deterministic.

Wire all three into `src/cli.ts` routing + `src/commands/harness.ts` (or a small sibling module), and
extend the `--help`/usage text.

## Expected Outcome

`keryx harness {exec,extension,wave}` run the R2 surfaces end-to-end through the CLI, fail-closed by
default, printing structured JSON. The whole offline test suite stays deterministic (injected adapter/
spec/clock/id; the real subprocess is gated + off-CI). No command persists flow.json (D-02). Reuse-only;
deps `{}`; secrets never logged.

## Out of Scope (do NOT touch)

- No new dependency (`dependencies` stays `{}`), no framework — `node:child_process` (real adapter) is
  stdlib. NO real subprocess in the offline suite (fake adapter injected). The commands NEVER write
  flow.json — the parent/Task-Manager owns flow state (D-02). Deterministic (injected id/clock).
- Rewriting the R2 library functions (`runContainedProcess`, `dispatchExtension`, `planExtensionWave`,
  `registerExtension`), the provider `harness run` path, or any prior module — REUSE/compose them. If a
  library function seems to need a real change to be wireable, STOP and report.
- The frozen requirements package + ADR-0001…0004 + canonical schemas + `src/eval/` + `src/contracts/`
  — read/cite only. Commits/PR carry NO co-authorship trailer. `ANTHROPIC_API_KEY`/env values never
  stored/logged.
