# Documentation Versioning Standard

Version: 0.1.0

## 1. Purpose

Every human-facing and agent-facing Markdown document in `docs/requirements/` must declare a document version near the top of the file.

This makes documentation changes traceable and allows release notes, module manifests, and agent workflows to reference a stable document version.

## 2. Required Field

Each document must include:

```markdown
Version: x.y.z
```

Placement:

- directly after the H1 title;
- before the first section heading or body paragraph.

Example:

```markdown
# gdwiki: specification

Version: 0.1.0

## 1. Purpose
```

## 3. Versioning Rule

When a document changes, its `Version` must be updated in the same commit.

Recommended increments:

- patch: typo, clarification, formatting, non-behavioral wording;
- minor: new section, changed requirement, new acceptance criteria;
- major: incompatible change to module behavior, storage contract, CLI contract, or agent workflow.

## 4. Scope

This rule applies to:

- module README documents;
- PRD documents;
- specifications;
- metrics and validation documents;
- decision records;
- global requirements documents;
- versioning and documentation standards.

## 5. Agent Rule

Before editing any file under `docs/requirements/`, the agent must:

1. Check whether the file has a `Version` field.
2. Add it if missing.
3. Increment it when modifying an already versioned document.
4. Mention version changes in the final response.
