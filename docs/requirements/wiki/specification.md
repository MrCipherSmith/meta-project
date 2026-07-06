# gdwiki: technical specification

Version: 0.1.0

## 1. Purpose

`gdwiki` is a Metaproject module for a local Markdown knowledge base. It stores project knowledge from business logic to implementation details and provides CLI commands for page creation, link checking, and index generation.

## 2. Placement

When enabled, `gd-metapro init` should create:

```text
.metaproject/
  wiki/
    index.md
    architecture/
    domain-models/
    business-rules/
    user-scenarios/
    components/
    services/
    integrations/
    decisions/
    templates/
  modules/
    gdwiki.md
  skills/
    gdwiki/
      SKILL.md
  data/
    gdwiki/
      artifacts/
      link-check/
```

## 3. Versioning

Every Wiki page and every requirements document must include:

```markdown
Version: 0.1.0
```

Rule:

- new generated pages start at `0.1.0`;
- any edit to a versioned document must update `Version`;
- patch/minor/major increments follow [documentation-versioning.md](../documentation-versioning.md).

## 4. Page Types

Supported MVP page types:

| Type | Folder | Purpose |
|---|---|---|
| `architecture` | `architecture/` | system or module architecture |
| `domain-model` | `domain-models/` | entities, invariants, relationships |
| `business-rule` | `business-rules/` | business constraints and decisions |
| `user-scenario` | `user-scenarios/` | user workflows and expected outcomes |
| `component` | `components/` | UI/component behavior and ownership |
| `service` | `services/` | backend/service responsibility and APIs |
| `integration` | `integrations/` | external systems and contracts |
| `decision` | `decisions/` | known decisions and ADR-like records |

## 5. Page Template

MVP uses simple Markdown fields instead of YAML frontmatter.

```markdown
# <Title>

Version: 0.1.0
Type: <page-type>
Status: draft

## Summary

One paragraph summary.

## Details

Main content.

## Related Code

- `src/...`

## Related Wiki

- [Other Page](../path/page.md)

## Changelog

- 0.1.0 - Initial version.
```

Reason: simple fields are easier for agents to edit safely without needing a YAML parser in MVP.

## 6. CLI

Namespace:

```bash
gd-metapro wiki <command>
```

### 6.1 status

```bash
gd-metapro wiki status
```

Shows:

- whether Wiki is enabled;
- page counts by type;
- last index generation;
- last link check result.

### 6.2 new

```bash
gd-metapro wiki new <type> <slug> --title "<title>"
```

Behavior:

- validates page type;
- creates folder if missing;
- writes page from template;
- sets `Version: 0.1.0`;
- refuses overwrite unless `--force`;
- prints created path.

### 6.3 index

```bash
gd-metapro wiki index
```

Behavior:

- scans `.metaproject/wiki`;
- reads page title/type/status/summary;
- generates `.metaproject/wiki/index.md`;
- writes generated details between managed markers;
- keeps manually editable intro outside managed markers.

### 6.4 check-links

```bash
gd-metapro wiki check-links
```

Behavior:

- scans Markdown links in `.metaproject/wiki/**/*.md`;
- validates relative file links;
- ignores external URLs in MVP or reports them as skipped;
- writes report to `.metaproject/data/gdwiki/link-check/latest.md`;
- exits non-zero if broken internal links exist.

### 6.5 validate

```bash
gd-metapro wiki validate
```

Runs:

- required metadata check;
- version field check;
- link check;
- index freshness check.

## 7. Manifest

`.metaproject/modules/gdwiki.md`:

```markdown
# gdwiki

Version: 0.1.0

## Purpose

Project knowledge base from business logic to implementation.

## Commands

- `gd-metapro wiki status`
- `gd-metapro wiki new <type> <slug>`
- `gd-metapro wiki index`
- `gd-metapro wiki check-links`
- `gd-metapro wiki validate`

## Entry

- `wiki/index.md`
```

## 8. Skill

`.metaproject/skills/gdwiki/SKILL.md` should tell agents:

- use Wiki by default for architecture, domain, business rules, user scenarios, service/component explanations, integrations, and known decisions;
- read `.metaproject/wiki/index.md` first;
- do not read all Wiki pages unless necessary;
- use `gdgraph` to move from Wiki concept to code;
- use `gdctx` for compact reads/searches.

## 9. Git Policy

Versioned:

- `.metaproject/wiki/**/*.md`;
- `.metaproject/modules/gdwiki.md`;
- `.metaproject/skills/gdwiki/SKILL.md`.

Ignored:

- `.metaproject/data/gdwiki/link-check/`;
- `.metaproject/data/gdwiki/artifacts/`;
- transient generated reports.

## 10. Service Contract

```ts
export interface GdWikiService {
  status(input: WikiStatusInput): Promise<WikiStatusResult>;
  createPage(input: WikiCreatePageInput): Promise<WikiCreatePageResult>;
  generateIndex(input: WikiIndexInput): Promise<WikiIndexResult>;
  checkLinks(input: WikiCheckLinksInput): Promise<WikiCheckLinksResult>;
  validate(input: WikiValidateInput): Promise<WikiValidateResult>;
}
```

## 11. Acceptance Criteria

### Scenario: initialize Wiki

Given пользователь запускает `gd-metapro init`
And выбирает `gdwiki`
When init завершается
Then создается `.metaproject/wiki/index.md`
And создается `.metaproject/modules/gdwiki.md`
And создается `.metaproject/skills/gdwiki/SKILL.md`.

### Scenario: create page

Given Wiki включена
When пользователь запускает `gd-metapro wiki new business-rule invoice-payment --title "Invoice Payment"`
Then создается `.metaproject/wiki/business-rules/invoice-payment.md`
And файл содержит `Version: 0.1.0`
And файл содержит required sections.

### Scenario: check links

Given Wiki содержит broken relative link
When пользователь запускает `gd-metapro wiki check-links`
Then CLI сообщает путь страницы и broken target
And exit code is non-zero.

### Scenario: generate index

Given Wiki содержит страницы разных типов
When пользователь запускает `gd-metapro wiki index`
Then `.metaproject/wiki/index.md` содержит сгруппированный список страниц
And summary каждой страницы доступен без чтения всего файла.

## 12. Implementation Phases

### Phase 1: Documentation and scaffold

- requirements docs;
- init integration;
- module manifest;
- skill;
- folder structure;
- page templates.

### Phase 2: CLI MVP

- `wiki new`;
- `wiki index`;
- `wiki check-links`;
- `wiki status`.

### Phase 3: Integration

- `gdgraph` references;
- `gdctx` usage guidance;
- validation reports;
- release metrics.
