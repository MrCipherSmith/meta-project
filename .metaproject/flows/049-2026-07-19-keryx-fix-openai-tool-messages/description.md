# Flow 049 — fix OpenAI-compatible tool messages

Status: formalized
Source: user bug — with the openrouter provider (OpenAI-compatible), the agent
errors ("[error] Provider returned error") on every turn AFTER the first tool call.
Driven via flow-orchestrator.

## Problem

After a tool call, the agent driver appends the result as a normalized
`{ role: "tool", content }` message. The OpenAI-compatible adapter serializes it as
an OpenAI `role:"tool"` message — but OpenAI/OpenRouter STRICTLY require a
`role:"tool"` message to carry a `tool_call_id` referencing a preceding assistant
`tool_calls`, which keryx's `NormalizedMessage` model does NOT track. Local Ollama
tolerates the bare tool message; OpenRouter rejects it (upstream 400 → OpenRouter
"Provider returned error"), and because the tool message stays in history, EVERY
subsequent turn fails too.

## Expected Outcome

The OpenAI-compatible adapter serializes a normalized `role:"tool"` message as a
framed regular message the API accepts (there is no `tool_call_id` to reconstruct a
valid tool message): a `role:"user"` message prefixed to mark it as a tool result
(e.g. `Tool result:\n<content>`). `system`/`user`/`assistant` mapping is unchanged.
The agent then works across turns on OpenAI-compatible providers (OpenRouter) and
local Ollama alike.

## Out of Scope

- Not adding full OpenAI tool_calls/tool_call_id tracking to the normalized layer
  (a larger future change). The anthropic adapter is out of scope (separate wire).
  No new dependency; the agent driver / normalized types are unchanged.
