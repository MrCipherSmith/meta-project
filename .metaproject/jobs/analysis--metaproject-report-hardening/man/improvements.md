# Improvement Roadmap

## P0: Add Atomic Write And Locking Infrastructure
Create a shared filesystem utility for `.metaproject` writes:

- `writeFileAtomic(path, content)` using same-directory temp file and `rename`.
- `withFileLock(lockPath, fn)` using exclusive lock directory or lock file creation.
- Optional stale-lock detection with PID/timestamp metadata.

Apply it first to:

- `src/flow/service.ts`: protect `nextFlowId` plus directory creation as one critical section.
- `src/gdskills/project-skills.ts`: protect manifest registry updates and catalog regeneration.
- `src/gdskills/learn.ts`: protect learning proposal application and changelog writes.
- `src/wiki/service.ts`, `src/testing/service.ts`, `src/health/run.ts`: protect `latest.*` artifact writes.

## P1: Replace Complexity Parser With AST-Based Analysis
Keep the current token implementation as fallback, but add a primary AST path:

- Use TypeScript Compiler API if available in runtime.
- Count `if`, loops, `case`, `catch`, logical operators, nullish coalescing, and ternary nodes per function.
- Preserve current tests and add cases for decorators, overloads, object methods, class methods, async arrows, JSX, and nested expressions.

## P1: Clarify gdgraph Parser Architecture
The current report should be updated: gdgraph uses `Bun.Transpiler().scanImports()` first, regex fallback second, and optional tree-sitter enrichment for symbols. Recommended next step is not just "replace regex" but:

- add tests proving fallback limitations;
- expand scanner coverage for dynamic imports where static extraction is possible;
- document unsupported dynamic interpolation as unresolved by design;
- decide whether TypeScript AST should replace fallback or supplement it.

## P1: Remove Global CWD Mutation From Command Tests
Introduce a command execution context instead of relying on `process.cwd()`:

- Add optional `cwd` parameter to command entry points or a command context object.
- Keep CLI wrappers using `process.cwd()`.
- Update tests to pass temp roots explicitly.
- Reserve `process.chdir` for a small CLI integration test group, run serially if needed.

## P2: Deduplicate Command File Utilities
Move duplicated helpers into `src/lib/file-write.ts`:

- `writeTextIfChanged`
- `writeTextIfMissing`
- `writeJsonIfChanged`
- `copyFileIfChanged`

Use the same helper to apply atomic write semantics consistently.

## P2: Split Template Surface
Break `src/lib/templates.ts` into module-owned template files:

- `src/gdgraph/templates.ts`
- `src/gdctx/templates.ts`
- `src/wiki/templates.ts`
- `src/flow/templates.ts`
- `src/security/templates.ts`
- `src/lib/dashboard-template.ts`

This reduces review blast radius and aligns templates with module ownership.

---

<!-- Document Metadata -->
| Key | Value |
|-----|-------|
| Created | 2026-07-08T09:26:04Z |
| Agent | job-documenter |
| Task | Produce remediation roadmap |
| Job | analysis--metaproject-report-hardening |
| Version | 1.0 |
| Status | final |
