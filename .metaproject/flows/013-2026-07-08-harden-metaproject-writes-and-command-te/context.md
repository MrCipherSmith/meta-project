# Context

Collected deterministically by `gd-metapro flow init` at 2026-07-08T10:29:10.646Z.
The flow-init skill enriches this with formalization, brainstorm results, and
interview answers.

## Code Graph

- `.metaproject/data/gdgraph/artifacts/summary.md`
- `.metaproject/data/gdgraph/artifacts/module-map.json`

Use `gd-metapro gdgraph affected <file>` for blast radius.

## Code Health

- gate: warn (as of 2026-07-07T12:37:20.204Z)
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

- Documentation package: `.metaproject/jobs/analysis--metaproject-report-hardening/`.
- Confirmed P0 risks:
  - `src/flow/service.ts` computes `nextFlowId(input.cwd)` before `mkdir(absolute, { recursive: true })`, so concurrent init calls can collide.
  - `src/gdskills/project-skills.ts` writes `.metaproject/metaproject.json` registry updates and regenerates catalog without a shared lock.
  - `src/gdskills/learn.ts` checks `<proposal>.applied.json` before writing skill/changelog files; concurrent apply calls can both pass the check.
- Existing positive baseline:
  - `src/flow/store.ts` already writes `flow.json` via temp file and `rename`.
  - Targeted verification before implementation passed: 29 tests, 0 failures.
- Relevant files:
  - `src/flow/service.ts`
  - `src/flow/store.ts`
  - `src/flow/service.test.ts`
  - `src/gdskills/project-skills.ts`
  - `src/gdskills/learn.ts`
  - `src/gdskills/install.test.ts`
  - `src/gdskills/verify.test.ts`
  - `src/lib/fs.ts`
