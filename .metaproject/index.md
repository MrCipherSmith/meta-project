# Metaproject Index

## Purpose

This `.metaproject` folder contains agent-readable context, tools, generated data, and module manifests for this codebase.

## Enabled Modules

| Module | Purpose | Entry |
|--------|---------|-------|
| gdgraph | Code graph, dependencies, symbols, affected context | modules/gdgraph.md |
| gdctx | Token-aware command output and context compression | modules/gdctx.md |
## Rules

| Source | Purpose | Entry |
|--------|---------|-------|
| AGENTS.md | Imported repository agent instructions | rules/agents-md.md |

## Skills

| Skill | Purpose | Entry |
|-------|---------|-------|
| project-rules | Use imported repository rules before planning or editing | skills/project-rules/ |
| gdgraph | Default navigation layer for finding relevant project files before broad raw search | skills/gdgraph/SKILL.md |
| gdctx | Use compact command/search/read outputs before loading large raw output | skills/gdctx/SKILL.md |

## Agent Workflow

1. Read this file first.
2. Check enabled modules.
3. Load relevant rules from `rules/`.
4. For project navigation, file discovery, code understanding, implementation, review, debugging, or refactoring, use `skills/gdgraph/SKILL.md` before broad raw file search when gdgraph is enabled.
5. For commands, search, diff, test logs, and large file reads that can produce long output, use `skills/gdctx/SKILL.md` when gdctx is enabled.
6. Use relevant skills from `skills/`.
7. Use module manifests before reading raw generated data.
8. Prefer curated artifacts in `data/*/artifacts`.
9. Run module CLI commands when generated data is stale.

## Data

- `data/gdgraph/artifacts/summary.md`
- `data/gdgraph/artifacts/module-map.json`
- `data/gdgraph/queries/latest.md`
- `data/gdctx/artifacts/latest.md`

## Refresh

```bash
gd-metapro index refresh
gd-metapro gdgraph build
```
