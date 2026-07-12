# Flow 005 — W3 EV-01: relocate fixture-corpus evaluator

Status: formalized
Source: user description (harness implementation runbook, Phase 3)

## Problem

`src/harness/` currently holds the fixture-corpus evaluator (`corpus.ts`,
`gate.ts` + their tests), but the harness implementation DAG reserves
`src/harness/` for the future agent runtime (W5+). Before that namespace can be
claimed, the existing evaluator must move to `src/eval/` with all importers and
docs updated and the corpus gates kept green. This resolves ADR-0001 OPEN-4
(relocation lands as a **direct rename**, not a staged alias).

## Expected Outcome

- The four evaluator files are relocated `src/harness/` → `src/eval/` via
  `git mv` (history preserved); `src/harness/` is freed of evaluator files.
- The sole external importer (`src/security/detect/mcp.test.ts`) points at
  `src/eval/*`; no code still references `src/harness/{corpus,gate}`.
- Internal relative imports are unchanged (same directory depth), documented.
- Corpus + Block-D gates stay green; full `bun test` = 554 pass / 0 fail
  (baseline parity); `tsc --noEmit` clean.
- Live docs (architecture, modules, fixtures README) point at `src/eval/`.

## Out of Scope (do NOT touch)

- Any wave other than W3 / EV-01. No new features, no runtime code in
  `src/harness/` (just freed).
- The frozen requirements package (`docs/requirements/keryx-project-agent-harness/`)
  — it already describes the move; read/cite, never edit.
- `ADR-0001` — OPEN-4's resolution is recorded in a new EV-01 deliverable, not by
  editing the frozen ADR.
- Any behavior change to `runCorpus`/`gateCorpus` (pure relocation).
