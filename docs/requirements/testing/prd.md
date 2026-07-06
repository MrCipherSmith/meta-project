# Testing Module PRD

Version: 0.1.0
Status: spec ready

## 1. Summary

Testing Module gives Metaproject a project-local test intelligence layer. It
discovers test tooling and conventions, creates agent-readable testing context,
runs or narrows tests when requested, and writes normalized reports for agents,
Code Health, gdskills and future memory workflows.

## 2. Goals

- Create testing context during `gd-metapro init` when enabled.
- Make agents aware of local testing conventions before generating or editing tests.
- Normalize test run results into stable JSON and compact Markdown.
- Support changed-scope test selection without always running the full suite.
- Provide safe hooks: non-blocking post-commit analysis and optional blocking pre-push gate.
- Let Code Health consume test results instead of owning execution.

## 3. Non-goals

- Replace Bun, Vitest, Jest, Playwright, Cypress or other test frameworks.
- Install a test stack automatically.
- Create or modify host project test files during MVP.
- Guarantee perfect related-test selection without runner or graph support.
- Run expensive full suites in lightweight hooks.

## 4. Users

- AI agents implementing, refactoring or reviewing code.
- Developers who want concise test reports and stable test context.
- Orchestrators that need test status without parsing raw logs.

## 5. User Stories

### 5.1 Init Testing Context

As a developer, I want `gd-metapro init` to ask whether to enable Testing Module,
so that Metaproject can analyze my project and create reusable testing context.

Acceptance criteria:

- init creates `.metaproject/data/testing/context.md`;
- init creates `.metaproject/data/testing/context.json`;
- init creates `.metaproject/skills/testing/SKILL.md`;
- init creates wiki testing pages when gdwiki is enabled;
- init does not modify project test code or install dependencies.

### 5.2 Agent Uses Testing Context

As an agent, I want a testing skill and context artifact, so that I can follow
local testing conventions without reading every test file.

Acceptance criteria:

- `.metaproject/index.md` references the testing skill and context;
- testing skill explains when to use `gd-metapro test`;
- testing context lists scripts, configs, frameworks, test file patterns and conventions.

### 5.3 Changed-Scope Test Run

As an orchestrator, I want `gd-metapro test run --changed`, so that verification
can focus on likely affected tests.

Acceptance criteria:

- command detects changed files from git;
- command tries runner-related strategy first when available;
- command falls back to gdgraph-related tests;
- command falls back to naming conventions;
- command records strategy and selected tests in `latest.json`.

### 5.4 Normalized Failure Report

As an agent, I want a short test failure summary, so that I can debug without
loading the full raw test log.

Acceptance criteria:

- `latest.md` lists priority failures and likely files;
- `latest.json` contains structured failures;
- raw log is stored separately when a test command ran;
- `gd-metapro test explain <file>` returns relevant failures/context.

### 5.5 Health Consumes Tests

As Code Health, I want to read Testing Module reports, so that test execution is
not duplicated.

Acceptance criteria:

- health tests adapter imports `.metaproject/data/testing/artifacts/latest.json`
  when available;
- health fallback runner mode is retained only for legacy compatibility;
- health findings include raw testing report provenance.

## 6. Success Metrics

- Init produces testing context in projects with and without tests.
- Agents can answer "how do I test this change?" from testing context.
- `gd-metapro test run` writes JSON/Markdown artifacts.
- Code Health can mark test source available from Testing Module report.
- `skills learn --from-test` can consume testing JSON or Markdown evidence.

