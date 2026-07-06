# gdwiki: Product Requirements Document

Version: 0.1.0

## 1. Purpose

`gdwiki` provides a local, versioned project knowledge base for Metaproject.

It stores knowledge that should outlive a single task: architecture, domain models, business rules, user scenarios, components, services, integrations, known decisions, and module-specific explanations.

## 2. Problem

Project knowledge is often spread across:

- source code;
- comments;
- old issues;
- chat history;
- agent prompts;
- one large `AGENTS.md` or `CLAUDE.md`.

This makes agents read too much raw context and makes humans lose architectural and business decisions.

## 3. Goals

- Provide a structured Markdown knowledge base.
- Keep Wiki pages readable by humans and agents.
- Provide a short `index.md` entrypoint.
- Generate pages from templates.
- Validate internal links.
- Generate or refresh navigation indexes.
- Connect Wiki pages to code through `gdgraph` references.
- Use `gdctx` for compact context during generation and validation.
- Require `Version` metadata in Wiki and requirements documents.

## 4. Non-Goals

MVP does not include:

- UI;
- external hosting;
- Confluence/Notion sync;
- embeddings/vector search;
- automatic code-to-doc generation;
- multi-user permission system;
- remote database.

## 5. Users

- Developer: reads and updates project knowledge.
- AI agent: uses Wiki to understand project context before implementation/review.
- Tech lead/architect: records decisions and module boundaries.
- Product/domain owner: records business rules and user scenarios.

## 6. Core Content Types

`gdwiki` must support these page types:

- architecture;
- domain model;
- business rule;
- user scenario;
- component;
- service;
- integration;
- known decision.

Each page must include:

- title;
- Version;
- type;
- status;
- summary;
- body;
- related code/files/modules;
- related Wiki pages;
- last updated date or changelog note.

## 7. User Stories

### Story: Create Wiki page

As a developer, I want to create a Wiki page from a template so that documentation has a consistent structure.

Acceptance:

- CLI creates the correct file path.
- CLI adds required metadata.
- CLI refuses unsupported page types.
- CLI does not overwrite existing pages without explicit flag.

### Story: Generate Wiki index

As an agent, I want a short Wiki index so that I can navigate project knowledge without reading every page.

Acceptance:

- `wiki/index.md` lists page groups.
- Index includes title, type, summary, and path.
- Index is regenerated from existing pages.

### Story: Validate links

As a developer, I want to validate Wiki links so that documentation does not silently rot.

Acceptance:

- CLI checks relative Markdown links.
- CLI reports missing targets.
- CLI exits non-zero on broken links.

### Story: Connect Wiki to code

As an agent, I want Wiki pages to reference code modules/files so that I can move from business/domain context to implementation context.

Acceptance:

- page templates include `related_code`;
- `gdgraph` can be used to verify or suggest related files;
- broken code references are reported as warnings in MVP.

## 8. Success Metrics

- A new project can initialize Wiki through `gd-metapro init`.
- A page can be created with one command.
- Link validation catches broken relative links.
- Index generation produces a concise `wiki/index.md`.
- Agents can find Wiki from `.metaproject/index.md` without explicit user instruction.

## 9. Risks

- Wiki becomes another dumping ground if templates are too loose.
- Too much metadata makes pages annoying to maintain.
- Automatic index generation can overwrite human edits if boundaries are unclear.
- Link validation can be noisy if external links are included in MVP.

## 10. Open Questions

- Should page status be limited to `draft`, `active`, `deprecated`?
- Should `owner` be required?
- Should Wiki pages use YAML frontmatter or simple Markdown fields?
- Should `gdwiki` create one global Wiki or module-scoped Wikis?
