# Harden Metaproject writes and command test isolation

Status: draft (flow-init skill formalizes this)
Source: user description

## Problem

The validated report found real concurrency risk in Metaproject write paths.
`flow init` allocates the next flow id before creating the directory, and
`gdskills` project-skill/learning operations update registries and skill files
without a shared inter-process lock. Multiple agents can therefore race and
lose registry entries, duplicate learning application, or fail flow creation.

## Expected Outcome

Metaproject has a small shared filesystem utility for atomic writes and
lock-protected critical sections. High-risk flow and gdskills write paths use
it, and tests cover concurrent flow initialization plus already-applied learning
proposal races.

## Out of Scope

Full TypeScript AST complexity replacement and a complete command-test
`process.chdir` refactor are out of scope for this flow. They remain documented
follow-up work in the report package.
