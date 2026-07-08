# Implementation Plan

Status: draft (flow-init skill fills this after context and brainstorm)

## Approach

Implement a small local filesystem hardening layer and apply it to the highest
risk write paths. Keep the helper dependency-free and Bun/Node-compatible:

- `writeFileAtomic(...)` writes to a same-directory unique temp file and renames.
- `withFileLock(...)` uses exclusive lock-directory creation with retry and
  stale-lock cleanup.
- `flow init` locks allocation plus initial package creation as one critical
  section.
- `gdskills` creation and learning application lock their read-modify-write
  sections and use atomic file writes for generated artifacts.

## Steps

1. Add tests for concurrent flow init and concurrent learning proposal apply.
2. Add shared filesystem helpers.
3. Wire helpers into `flow` and `gdskills` write paths.
4. Run targeted Bun tests.
5. Record results in the flow journal and mark tasks.

## Risks

- Lock implementation must not leave permanent stale locks after a crash.
- Atomic writes must use temp files in the same directory for rename semantics.
- Over-broad locking would serialize harmless reads; keep lock scopes narrow.
