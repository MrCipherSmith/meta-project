# Flow 058 — agent slash-command menu (Pi-style)

## Problem
Pi shows a live command dropdown when you type `/`. keryx has hidden slash
commands (only `/help` prose). User wants Pi's discoverable command list. A live
as-you-type dropdown needs a full-screen TUI (Pi uses Bubble Tea); keryx is
line-based on node:readline (a live dropdown is the flow-048 conflict class). The
robust port: a command registry + a menu printed on `/` / `/help` / unknown.

## Approach
- `agent-commands.ts`: `AGENT_SLASH_COMMANDS` registry + pure `findAgentCommand`
  (with `/quit`→`/exit` alias), unit-tested.
- REPL: `/`, `/help`, `/commands` → print the menu (cyan name + dim desc,
  gutter-indented); unknown command → notice + menu; new `/clear` resets history.

## Out of scope
Live as-you-type dropdown / fuzzy filtering (needs full-screen TUI), readline TAB
completion (needs `output` on the readline interface → prompt/echo conflict),
chat-mode command menu.
