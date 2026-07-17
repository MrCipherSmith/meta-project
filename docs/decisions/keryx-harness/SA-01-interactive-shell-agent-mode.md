# SA-01: Interactive Shell Agent Mode
## Wiring the interactive `keryx shell` onto the agentic run-loop (tools + metaproject context)

**Status**: Design / RFC (proposed — not frozen; open questions in §7 must be resolved before Flow A freezes)
**Proposed**: 2026-07-17
**Depends on**: ADR-0003 (D-03 security profiles / containment), ADR-0004 (D-04 provider branch child), the flow-009 run-loop (`src/harness/run/run.ts`), flow-026 subprocess executor
**Reviewer Track**: architecture
**Source of Truth**: this document (until frozen; Flow A implements the resolved subset)

---

## 1. Problem

The interactive `keryx shell` (flows 021/022/031/032) is a **chat-only REPL**: it
calls `provider.stream()` directly, sends a request with **no `tools`**, and uses a
one-line `systemInstruction` with **no project context**. The model therefore has
no way to touch the filesystem, run commands, or read the codebase — asked to run
`pwd`, a local model can only *hallucinate* plausible output (observed:
`gemma4:e4b` returned `/home/user` for an unrelated cwd).

This contradicts keryx's value proposition, which is to give an agent **hands
(tools)** plus **metaproject context**. Comparable TUIs (grok, opencode) run the
model inside a tool-execution loop; keryx has such a loop but the interactive
surface does not use it.

## 2. Key finding — the engine already exists

The agentic machinery is built and tested; this is an **integration**, not a
greenfield effort.

| Capability | Location | State |
|---|---|---|
| Normalized tool protocol | `provider/types.ts` — `NormalizedRequest.tools`, role `tool`, events `tool_call_start/delta/end`, caps `toolCalls`/`parallelToolCalls` | ✅ |
| ollama tool-calling adapter | `provider/ollama/ollama-provider.ts` + real `fixtures/tool-call-stream.recorded.sse` | ✅ |
| anthropic tool-calling adapter | `provider/anthropic/*` (`toolCalls: true`) | ✅ |
| Agentic run-loop | `run/run.ts` → `runOffline(deps)`: `stream → tool_call_end → policy decide → budget/loop guards → executor → result back` | ✅ |
| Tool subsystem | `tool/registry.ts` (`ToolRegistry`), `tool/tool-port.ts` (`ToolExecutorPort`, `validateToolCall`), risk classification | ✅ |
| Real subprocess execution | `extension/execute.ts`, `child/spawn.ts`, `child/isolation.ts` (flow 026) | ✅ |
| Run metrics (tool calls, tokens) | `run/run.ts` `HarnessRunOutputMetrics` (`toolCalls`, `inputTokens`, `outputTokens`) | ✅ |

`RunDeps` already carries **`interactive: boolean`**, and `runOffline` is already
invoked by `commands/harness.ts`. The spec constraint (`tool-port.test.ts:361`,
`specification.md`) fixes the security posture: *the model must not receive direct
filesystem or shell access outside registered tools.*

## 3. Target architecture

```
NOW:    shell → provider.stream(request WITHOUT tools) → render text     (hallucinates)
TARGET: shell → runOffline({ provider, toolRegistry, toolExecutor, policyProfile, interactive:true })
                   ↳ reuse the flow-031/032 UI layer (roles, markdown, spinner, status bar)
```

The flow-031/032 rich UI is **retained** as the presentation layer for the loop.
The `ShellIO` hooks (`onTurnStart`/`onTurnEnd`/`onSystem`) extend to loop events:
`onToolCall`, `onToolResult`, `onApprovalRequest`.

`runShell` (the deterministic chat core) is **not deleted** — agent mode is a
parallel path (see §7.1), preserving flows 021/022/031/032 tests unchanged.

## 4. The tool set ("hands")

Every system touch is a registered tool (spec constraint). Proposed initial set:

- **`shell_exec`** — run a command in an isolated subprocess (reuse
  `extension/execute.ts` + `child/spawn.ts` + isolation). This is the real
  `pwd`/`ls`/`git`. Risk: **mutating** → policy approval.
- **`read_file`**, **`list_dir`** — read-only. Risk: **read** → auto-allow.
- **Metaproject tools (keryx's differentiator)** — thin wrappers over the CLI:
  `gdgraph_query`, `gdwiki_read`, `ctx_rg`, `memory_search`. The agent navigates
  the codebase via the graph/wiki instead of blind grep.

Each tool declares `risk` in its `NormalizedToolDefinition`; the policy engine
(`policy/engine.ts` `decide`) resolves allow/approve per the active profile.

## 5. Metaproject context injection

Inject a compact orientation block into `systemInstruction` using the existing
**`keryx orient`** (graph + wiki summary), so the agent starts knowing the
architecture rather than cold. Provenance stays `trusted` (assembled by keryx,
not model/project input).

## 6. Side benefits

- **Token counter in the status bar** (grok-style `23K/500K`) — `runOffline`
  already returns `inputTokens`/`outputTokens`; closes the deferred flow-032 item.
- Provenance / evidence / redaction already run inside the loop.

## 7. Open questions (resolve before Flow A freeze)

1. **Parallel mode vs replacement.** *Recommended:* keep `keryx shell` as chat;
   enable hands behind `--agent` / an in-session `/agent` toggle. Preserves the
   deterministic core + its tests.
2. **`runOffline` is documented "offline read-only".** Confirm/extend it to drive
   the **real** executor and stream events to an interactive UI (its executor is
   injected, so a real one is supplied; verify no test-only assumptions block
   live streaming + approval pauses).
3. **Provider for agent mode.** `gemma4:e4b` is weak at reliable tool-calling;
   decide the validation target (likely anthropic for agent mode, ollama for
   chat) — capabilities degrade documented per `ProviderCapabilities`.
4. **Approval UX.** Inline y/n per mutating call vs a grok-style `always-approve`
   toggle; where it renders in the flow-031/032 UI.
5. **Default policy profile** for the interactive agent (which risks auto-allow).

## 8. Phasing (one flow each)

- **Flow A** — `shell → runOffline` behind `--agent`, with `shell_exec` +
  `read_file` + `orient` context on one provider. Goal: prove the hands work
  end-to-end (real `pwd`/`ls`, policy gate, result fed back).
- **Flow B** — metaproject tools (`gdgraph`/`gdwiki`/`ctx`/`memory`) as
  first-class tools.
- **Flow C** — approval UX, token counter in the status bar, parallel tool calls.

## 9. Non-goals

- No full-screen TUI framework (consistent with flows 022/031/032 — hand-rolled).
- No new provider adapter; reuse ollama/anthropic.
- No change to the durable wire schemas, ADR-0001…0004, or the deterministic
  `runShell` chat core semantics.
