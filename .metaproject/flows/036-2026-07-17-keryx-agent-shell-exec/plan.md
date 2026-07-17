# Implementation Plan

Status: formalized

## Approach

Add `shell_exec` (risk `shell`) as an `InteractiveTool` with an injectable runner.
Extend the flow-033 driver's risk gate with an injected `requestApproval` callback
(default-deny). Implement the callback in the (not-unit-tested) REPL as an inline
`[y/N]` prompt reading the next input line. All new logic is additive; the chat
core and read-only tools are untouched.

## Steps

1. `src/harness/tool/builtin/shell-exec-tool.ts`: `shellExecTool(root, run?)` —
   risk `shell`, input `{ command }`, default runner = `Bun.spawn(["sh","-lc",cmd],
   {cwd: root})`, bounded, errors→isError. Injectable for tests.
2. `src/commands/agent.ts`: `AgentIO.requestApproval?(tool, input) => Promise<boolean>`;
   `executeCall` → read: allow; shell: `requestApproval ?? false`, deny result when
   false; else deny. Tests (approve→runs, deny/absent→not run).
3. `src/commands/shell.ts`: `runAgentRepl` implements `requestApproval` (print
   `Run <cmd>? [y/N]`, read next line via the shared iterator; refactor to a single
   `readLine()` consumer to avoid double iteration); register `shellExecTool(cwd)`.
4. tsc + full bun test; live smoke (agent proposes a command, `[y/N]` prompt,
   y → runs & reports real output, N → refuses).

## Risks

- Arbitrary execution — SAFETY via mandatory default-deny approval + cwd=root; the
  model can never execute without a typed `y`. Covered by a default-deny test.
- Reading the y/N mid-turn — the REPL uses ONE shared line iterator; the approval
  reads the next line while the main loop is suspended in the turn (no race).
