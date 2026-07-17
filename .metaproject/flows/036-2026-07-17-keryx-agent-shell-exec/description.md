# Flow 036 — keryx agent shell_exec + inline approval (Flow C of SA-01)

Status: formalized
Source: RFC SA-01 §8 Flow C + §7 approval decision. Follows flows 033/035
(agent mode, read-only tools). Adds the one WRITE/execute capability, gated.

## Problem

The agent can read the project (flows 033/035) but cannot ACT — run a command,
build, run tests. That needs `shell_exec`, which is arbitrary execution and must
be safe: the model must never run anything without explicit user approval.

## Expected Outcome

1. **`shell_exec` tool** (risk `shell`) — input `{ command: string }`, executed in
   the project root via an injectable runner (default: subprocess, bounded output,
   errors → isError). It is NEVER executed except through the driver's approval
   gate.
2. **Approval gate in the driver** — the flow-033 read-only gate is extended:
   `read` → auto-allow; `shell` → require approval via an injected
   `requestApproval(tool, input)` callback (DEFAULT-DENY: if no callback is present
   or it returns false, the call is denied and a "denied" result is fed back to the
   model, never executed); any other risk → denied.
3. **Inline approval UX** — the agent REPL implements `requestApproval` by printing
   `Run <command>? [y/N]` and reading the next input line (allow only on `y`/`yes`);
   `shell_exec` is registered in the agent registry. The chat core is unchanged.

## Out of Scope

- No `always-approve` toggle, no per-command allowlist, no network/write tool
  beyond `shell_exec` (future). No token counter (separate). No new dependency.
- Default-deny is mandatory: absent approval MUST mean no execution.
