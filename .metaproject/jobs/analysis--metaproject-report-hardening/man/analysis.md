# Validated Report

## Verdict
The report is directionally correct but partially stale. The high-level description of `gd-metapro` as a Bun-native, Git-first, local agent workspace is confirmed. The most important correction is that `src/gdgraph/build.ts` no longer relies only on regex import parsing: the primary path uses `Bun.Transpiler().scanImports()`, with regex kept as fallback. The `writeFlow` corruption claim is also stale because current `src/flow/store.ts` already writes `flow.json` via temp file plus `rename`.

## Confirmed
- Bun-native package shape is confirmed in `package.json`: CLI name `gd-metapro`, Bun scripts, empty `dependencies`, and optional MCP/tree-sitter/transformers dependencies.
- Module list is confirmed by `.metaproject/index.md`: `gdgraph`, `gdctx`, `gdwiki`, `gdskills`, `health`, `testing`, `memory`, `tasks`, and security-related module files are present.
- Code graph summary is confirmed by `.metaproject/data/gdgraph/artifacts/summary.md`: 115 source files, 116 total nodes, 300 edges, 99.3% import resolution.
- Complexity implementation is token/brace based, not AST. `src/health/metrics/complexity.ts` explicitly says it is not full-AST and that AST precision is a later refinement.
- Test files do use `process.chdir(...)` in command tests, including `src/commands/init.test.ts` and `src/commands/update.test.ts`.
- Code duplication is confirmed: `writeTextIfChanged` and `copyFileIfChanged` exist independently in `src/commands/init.ts` and `src/commands/update.ts`.
- `src/lib/templates.ts` is overloaded: measured at 2471 lines.

## Corrected Claims
- `gdgraph` import extraction is not purely regex-based. Current `extractImportSpecifiers` uses `Bun.Transpiler({ loader: "tsx" }).scanImports(content)` first and falls back to regex only on scanner failure.
- `writeFlow` is already atomic at the file-corruption level: `src/flow/store.ts` writes to `flow.json.tmp` and then renames it to `flow.json`.
- The report says nested callbacks and arrow functions are summed incorrectly in complexity. Current tests explicitly cover nested functions separately, and the targeted test suite passes. The remaining issue is precision and maintainability of the token-based parser, not a proven nested-function bug.

## Still Valid Risks
- `flow init` has a TOCTOU risk around `nextFlowId(...)` plus directory creation. Two concurrent processes can compute the same next ID before either creates the directory.
- There is no repository-wide write-lock helper for `.metaproject` mutations. `src/gdskills/project-skills.ts`, `src/gdskills/learn.ts`, `src/wiki/service.ts`, `src/testing/service.ts`, `src/health/run.ts`, and other modules perform read-modify-write or generated artifact writes without a shared lock.
- `applyLearningProposal(...)` checks for an applied report before writing, but without a lock two processes can both pass the check and write skill/changelog updates.
- `updateManifest(...)` style read-modify-write in project-skill creation can lose concurrent registry changes.
- Command tests that mutate `process.cwd()` remain fragile under same-process parallelism, even though the targeted tests passed in this run.

## Verification
Targeted command:

```bash
/Users/tsaitler.aleksandr/.bun/bin/bun test src/gdgraph/build.test.ts src/gdgraph/fallback.test.ts src/health/metrics/complexity.test.ts src/flow/service.test.ts src/gdskills/verify.test.ts src/commands/init.test.ts src/commands/update.test.ts
```

Result: 29 pass, 0 fail.

## Limitations
- `gd-metapro` was not available in PATH, so live `gd-metapro ctx` and `gd-metapro gdgraph` commands could not run.
- Validation used saved Metaproject artifacts plus direct source inspection.

---

<!-- Document Metadata -->
| Key | Value |
|-----|-------|
| Created | 2026-07-08T09:26:04Z |
| Agent | job-documenter |
| Task | Validate supplied report |
| Job | analysis--metaproject-report-hardening |
| Version | 1.0 |
| Status | final |
