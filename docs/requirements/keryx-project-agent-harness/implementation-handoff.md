# Keryx Project Agent Harness — Implementation Handoff
Version: 1.0.0

## Status

`not started`. This document replaces a stale link to an uncommitted
`.metaproject/jobs/` artifact. It is the committed entry point for creating the
first managed implementation flow; it is not evidence that a Harness runtime
already exists.

## Preconditions for Release 0

1. Review and accept the Release 0 scope in [README.md](README.md) and the
   dependency order in [implementation-plan.md](implementation-plan.md).
2. Resolve the Task Manager evolution prerequisite identified by decision D7,
   including review/implementation lifecycle compatibility.
3. Create a dedicated Keryx flow with frozen acceptance criteria. The flow must
   reference this package and capture the exact provider-fixture strategy.
4. Keep the deterministic disabled floor, no-network default, schema fixtures,
   and replay evidence as mandatory gates.

## Evidence required before status changes

- Source implementation and focused tests for the Release 0 slice.
- JSON Schema validation fixtures, deterministic replay fixtures, and a
  no-network verification result.
- A managed review with documented decisions for any blocker or major finding.
- A roadmap update that links the resulting flow/PR evidence.

## Explicitly deferred

Production provider credentials, unrestricted shell/filesystem access, network
tools, subagents, parallel execution, third-party plugins, and TUI work remain
outside Release 0.

