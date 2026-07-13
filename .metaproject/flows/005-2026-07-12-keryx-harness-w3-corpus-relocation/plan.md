# Implementation Plan — Flow 005 (W3 EV-01)

Status: frozen scope (W3 / EV-01 only)

## Approach

Pure relocation `src/harness/` → `src/eval/` via `git mv` (history preserved),
plus the single external-importer fix and live-doc updates. The existing corpus
+ Block-D tests are the safety net (green before and after). No behavior change
to `runCorpus`/`gateCorpus`. Internal relative imports are unchanged because
`src/eval/` sits at the same depth as `src/harness/`.

## Worker routing & Model Policy

| Task | Kind | Worker | Model | Rationale |
|---|---|---|---|---|
| T1 | context | orchestrator inline | Haiku-class | compat-map + baseline (done) |
| T5 (EV-01) | implement | task-implementer | **Opus 4.8** | atomic move + importer fix + green verify (touches src/eval, src/harness) |
| T6 | docs | job-documenter | **Haiku 4.5** | live-doc string updates + EV-01 compat deliverable |
| T7 | review | review-orchestrator | **Opus 4.8** | code-verifier + frozen-pkg untouched + no stray importers |
| T2/T3/T4 | umbrella | orchestrator | Opus | seed phases |

Move + importer fix are done atomically by ONE worker so no intermediate red
state exists. Orchestrator = Opus.

## Steps

1. T1: compat-map + baseline (in `context.md`; baseline 554/0 verified).
2. T5: `git mv` the 4 files to `src/eval/`; edit `src/security/detect/mcp.test.ts`
   lines 9-10 to `../../eval/{corpus,gate}`; run corpus/block-D/mcp + full
   `bun test` + `tsc --noEmit`; confirm `src/harness/` freed.
3. T6: update `fixtures/README.md`, `docs/docs/modules.md`,
   `docs/docs/architecture.md` to `src/eval/`; create
   `docs/decisions/keryx-harness/EV-01-corpus-relocation.md` (compat-map + OPEN-4
   resolved = direct rename). Do NOT touch frozen requirements pkg or ADR-0001.
4. T7: `tsc --noEmit` + full `bun test` (554/0 parity); `ctx rg` confirms no
   `src/harness/{corpus,gate}` importer remains; git shows frozen pkg untouched;
   corpus gates green.
5. `keryx health run`; confirm ACs; completion choice (ask user A/B/C).

## Verification (relocation safety net)

TDD here = keep the existing corpus + Block-D gates green before and after; the
`git mv` must preserve history (renames, not add/delete). Gate: `tsc` clean +
full `bun test` = 554/0 + no behavior change (reports byte-identical).

## Risks

- **Broken importer / red intermediate** → move + importer fix atomic in one
  worker; verify green before returning.
- **Accidentally editing frozen requirements pkg / ADR-0001** → out-of-bounds
  list enforced; OPEN-4 resolution goes in a NEW deliverable.
- **History lost (copy instead of move)** → use `git mv`, verify `git status`
  shows renames.
- **Missed importer** → `ctx rg` sweep for `harness/{corpus,gate}` and `src/harness`
  before and after.
