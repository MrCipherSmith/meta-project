# Metaproject Standard

Version: 0.1.1

Status: draft documentation package. This standard is not yet a stable public
v1.0 contract.

## 1. Purpose

Metaproject Standard defines a project-local `.metaproject/` format that can be
understood by humans, AI agents, CI systems and IDE integrations.

`gd-metapro` is the reference implementation of this draft standard. The CLI
creates, updates, validates and reads the `.metaproject/` workspace.

## 2. Documents

- [prd.md](prd.md) - product requirements and success criteria.
- [specification.md](specification.md) - draft technical standard.
- [profiles.md](profiles.md) - minimal, agent, CI and full compatibility
  profiles.
- [agent-protocol.md](agent-protocol.md) - discovery and routing protocol for
  coding agents.
- [ci-protocol.md](ci-protocol.md) - CI/CD integration protocol.
- [artifact-lifecycle.md](artifact-lifecycle.md) - versioning, generated data
  and transient artifact rules.
- [mcp-surface.md](mcp-surface.md) - the cross-module MCP server surface
  (Block A): Tool↔service registry, `metaproject://` resources, transports.
- [schemas/](schemas/) - initial JSON Schema contracts.

## 1a. Standard as Generator

`gd-metapro` is not a rival agent standard. It is a **generator of the three
Linux-Foundation agent-standard artifacts** plus a value-add data layer:

1. **`AGENTS.md`** — the agent entrypoint (root rules, index) synced by
   `gd-metapro rules sync`.
2. **Agent Skills** — portable `SKILL.md` packages produced by
   `gd-metapro skills export --runtime codex|claude|plugin` (A2).
3. **An MCP server** — `gd-metapro mcp serve`, exposing the read-only service
   surface documented in [mcp-surface.md](mcp-surface.md) (A1).

Additionally, `gd-metapro standard emit llms` generates a deterministic
`llms.txt` from the manifest + artifact index (A2). The `.metaproject/` data
layer (code graph, memory, health, wiki) is the value-add these generators draw
from — gd-metapro **feeds** the ecosystem standards rather than competing with
them.

## 3. Draft Scope

The v0.1 draft standardizes only the small core:

- `.metaproject/metaproject.json` discovery manifest;
- `.metaproject/index.md` LLM-friendly portal;
- `.metaproject/README.md` human technical guide;
- module registry and module manifests;
- rules and skills routing;
- artifact lifecycle policy;
- profile-based capability discovery;
- validation requirements.

Module-specific contracts such as `gdgraph`, `health`, `testing`, `memory`,
`gdwiki`, `gdctx`, `gdskills`, `tasks` and `security` remain separate specs
referenced by this standard.

## 4. Non-Goals

- Freeze a public v1.0 ecosystem contract before schemas and validators mature.
- Require every project to enable every module.
- Treat `gd-metapro` implementation details as mandatory for other tools.
- Replace existing agent or CI configuration systems.
