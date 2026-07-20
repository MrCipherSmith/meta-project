# Acceptance Criteria — flow 058 (agent slash-command menu)

- AC1: A registry `AGENT_SLASH_COMMANDS` (in `src/commands/agent-commands.ts`) lists the agent-mode commands with one-line descriptions: `/help`, `/expand`, `/clear`, `/exit`. A pure, unit-tested `findAgentCommand(line)` resolves the first token to its command (or undefined), treating `/quit` as an `/exit` alias.
- AC2: In agent mode, submitting bare `/`, `/help`, or `/commands` prints a Pi-style command menu (each command name + dim description, gutter-indented). An UNKNOWN `/xyz` prints a notice AND the menu (discoverability).
- AC3: `/clear` resets the in-memory conversation history and prints a confirmation; `/expand` (flow 055) and `/exit`+`/quit` keep working. Chat mode is unaffected.
- AC4: `bunx tsc --noEmit` clean; `bun test` green with no reduction from baseline (1494 pass); new `agent-commands` unit tests pass (registry contents + findAgentCommand incl. /quit alias + unknown). No new runtime dependency. NOTE (documented, not a live dropdown): the menu is shown on submit — a live as-you-type dropdown needs a full-screen TUI and is out of scope (flow-048 readline constraint).
