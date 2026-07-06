# Testing Module brainstorm

Version: 0.1.0
Status: accepted decisions

## Problem Frame

Agents need reliable test context without reading noisy raw logs or guessing
project-specific testing conventions. At project initialization, Metaproject
should discover the test stack, scripts, configs, test files, CI usage and local
documentation, then expose a compact context that agents can reuse.

## Options

| Option | Approach | Pros | Cons | Effort | Risk |
|---|---|---|---|---|---|
| A. Testing Context first | Analyze project and create testing context + skill; keep test execution minimal. | Fast, safe, useful immediately for agents. | Does not fully solve failing-test diagnosis alone. | M | Low |
| B. Runner first | Build `test run/status/report` before context generation. | Gives executable value quickly. | Easy to duplicate Code Health and miss conventions. | M | Med |
| C. Test Intelligence | Context + runner + graph-related tests + skills/health/memory integration. | Highest long-term value. | Larger implementation surface. | L | Med |
| D. Full Test Orchestrator | Plan test strategy, choose unit/integration/e2e/smoke, manage gates. | Strong automation story. | Too broad for first release. | XL | High |

## Accepted Direction

Use **A + C**:

- MVP is Testing Context first.
- Architecture immediately supports Test Intelligence.
- Do not build a custom test framework.
- Do not install dependencies or modify host project tests without explicit future commands.

## Interview Decisions

| Question | Decision |
|---|---|
| Primary role | A + C: context first, architecture for intelligence. |
| Context storage | D: hybrid storage - skill summary, data context, wiki pages. |
| Missing tests/config | D: do not change project code; write recommendations. |
| Hooks | D: ask separately for post-commit refresh and pre-push gate. |
| Changed test selection | D: runner related mode -> gdgraph -> naming fallback. |
| Result contract | D: JSON source of truth + Markdown summary + optional raw log. |
| Code Health integration | D: Testing owns execution/reporting; Health consumes normalized result. |

## Critical Questions Answered

- **Will hooks block local work?** post-commit is non-blocking; only pre-push gate can block.
- **What if no test stack exists?** generate recommendations only, no project-code mutation.
- **How does the agent avoid raw logs?** read `latest.md` first, then `latest.json`, raw log only when needed.
- **How are related tests found?** prefer runner support, then gdgraph, then naming conventions.
- **How does this avoid duplication with health?** Testing owns execution; Health imports testing report.

