# Requirements Roadmap
Version: 0.3.0

## Status

This roadmap tracks Metaproject requirements packages and their implementation
state. Runtime claims must be backed by source, tests, or a verification report.

## Packages

| Package | Status | Summary |
|---|---|---|
| [Managed Review Feedback Loop](managed-review-feedback-loop/README.md) | implemented (initial runtime slice) | Low-level managed review persistence supports standalone/attached packages, ingest, coverage, findings, decisions, learning, and structural completion. Target orchestration ownership moves to Flow Reviewer. |
| [Flow Reviewer](flow-reviewer/README.md) | specification ready (future) | Task Manager-aware review orchestrator above stateless Review Orchestrator, with one task and durable history per reviewer, adaptive model routing, compact shared context, resume, schemas, and Gherkin acceptance scenarios. |
