# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: shell_exec tool — `src/harness/tool/builtin/shell-exec-tool.ts` exports `shellExecTool(root, run?)` → an `InteractiveTool` of risk `shell`, input schema `{ command: string }` (required), that maps the validated command to an injectable `run(command)` (default runner spawns the command in `cwd = root` via an argv array to a shell, captures bounded output, and returns `{ isError: true }` — never throws — on failure). Injectable `run` so unit tests are deterministic (no real subprocess).
- AC2: Default-deny approval gate — `src/commands/agent.ts` adds an optional `AgentIO.requestApproval(tool, input) => Promise<boolean>`; the driver's risk gate becomes: `read` → allow; `shell` → allowed ONLY when `requestApproval` is present AND resolves `true` (otherwise a "denied" result is fed back to the model and the tool is NEVER invoked); any other risk → denied. Unit tests prove: approve → the shell tool's runner IS invoked; deny → NOT invoked (denied result); and NO `requestApproval` callback → NOT invoked (default-deny).
- AC3: Inline approval UX + wiring — `runAgentRepl` implements `requestApproval` by printing a `Run <command>? [y/N]` prompt and reading the next input line (allow only on `y`/`yes`, case-insensitive), and registers `shellExecTool(cwd)` in the agent registry alongside the read-only + metaproject tools. The REPL consumes input through a single shared line iterator so the approval read does not race the main loop. The chat `runShell` core is unchanged.
- AC4: No regression / offline / safety — `tsc --noEmit` clean and full `bun test` >= the pre-change baseline of 1387 pass / 3 skip / 0 fail with the new tests green and 0 fail; the entire suite is OFFLINE/deterministic (injected `run` + injected approval; no real subprocess). Default-deny is enforced (a `shell` call with no approval callback never executes — asserted by test). No new dependency (`dependencies` stays `{}`). A live smoke (`bun src/cli.ts shell --agent`, tool-capable model): the agent proposes a command, the `[y/N]` prompt appears, `y` runs it and reports the REAL output, `N` refuses — journaled; not a CI gate.
