# Requirements Roadmap
Version: 0.5.2

## Status

This roadmap tracks Metaproject requirements packages and their implementation
state. Runtime claims must be backed by source, tests, or a verification report.

## Packages

| Package | Status | Summary |
|---|---|---|
| [Managed Review Feedback Loop](managed-review-feedback-loop/README.md) | implemented (initial runtime slice) | Low-level managed review persistence supports standalone/attached packages, ingest, coverage, findings, decisions, learning, and structural completion. Target orchestration ownership moves to Flow Reviewer. |
| [Flow Reviewer](flow-reviewer/README.md) | specification ready (future) | Task Manager-aware review orchestrator above stateless Review Orchestrator, with one task and durable history per reviewer, adaptive model routing, compact shared context, resume, schemas, and Gherkin acceptance scenarios. |
| [Keryx Execution Observability](keryx-execution-observability/README.md) | specification ready (future) | Provenance-aware execution metrics, active-time accounting, per-run evidence, baseline-aware CI, lightweight profiles, retry taxonomy, and paired Keryx/no-Keryx validation. |
| [Keryx Project Agent Harness](keryx-project-agent-harness/README.md) | specification ready (future) | Future independent project-oriented harness. Documentation/contract remediation is complete; implementation remains gated by the handoff's runtime evidence checks. |
