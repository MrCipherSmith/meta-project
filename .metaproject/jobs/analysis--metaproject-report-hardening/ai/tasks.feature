Feature: Harden gd-metapro after validated report

  Scenario: Protect flow initialization from concurrent ID allocation
    Given two agents can run flow init in the same repository
    When both compute the next flow id concurrently
    Then flow creation must allocate unique directories
    And the critical section must cover nextFlowId and initial package writes
    And tests must simulate concurrent init calls

  Scenario: Add shared atomic write utilities
    Given multiple modules write files under .metaproject
    When a process crashes or two agents write concurrently
    Then generated JSON and Markdown artifacts must not be partially written
    And shared helpers must write to a same-directory temp file before rename
    And high-risk read-modify-write paths must use a lock

  Scenario: Lock gdskills registry and learning proposal writes
    Given project skill creation updates metaproject.json and skills catalog
    And learning proposal application updates SKILL.md and skill-changelog.md
    When two agents perform these operations concurrently
    Then no registry entry, lesson, or changelog entry may be lost or duplicated

  Scenario: Replace complexity approximation with AST-backed analysis
    Given complexity metrics influence Code Health findings
    When code contains TypeScript syntax, nested functions, methods, decorators, JSX, and async arrows
    Then complexity must be computed per function using AST traversal where available
    And the current token implementation may remain as fallback

  Scenario: Remove process.chdir from command unit tests
    Given Bun may execute test files in parallel
    When command tests run together
    Then tests must not mutate global process cwd
    And command functions should accept an explicit cwd through options or context

  Scenario: Deduplicate file-write helpers and split templates
    Given init and update duplicate file write helpers
    And src/lib/templates.ts is over 2400 lines
    When maintainers change module scaffolding
    Then helpers must be centralized
    And module templates must live near module ownership

---

<!-- Document Metadata -->
| Key | Value |
|-----|-------|
| Created | 2026-07-08T09:26:04Z |
| Agent | job-documenter |
| Task | Create Gherkin remediation tasks |
| Job | analysis--metaproject-report-hardening |
| Version | 1.0 |
| Status | final |
