# Project Metaproject

This folder contains local Metaproject configuration, tools, generated data, and agent instructions.

## Installed Modules

- `gdgraph`: code graph and affected context.
- `gdctx`: compact command/search/read output and raw output archive.

## Common Commands

```bash
gd-metapro status
gd-metapro gdgraph build
gd-metapro gdgraph query "module pipelines"
gd-metapro ctx status
gd-metapro ctx diff
```

## Editing Policy

- Edit module manifests and skills manually when needed.
- Do not manually edit generated files under `data/*/storage`.
- Regenerate artifacts with CLI commands.
