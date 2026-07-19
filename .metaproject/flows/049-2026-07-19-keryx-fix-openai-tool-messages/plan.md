# Implementation Plan

Status: formalized

## Approach

In the ollama (OpenAI-compatible) adapter's message mapping, convert a normalized
`role:"tool"` message into `{ role:"user", content: "Tool result:\n"+content }`.
Keep system/user/assistant as-is. TDD via injected-fetch body capture.

## Steps

1. ollama-provider.ts: in the messages map, `role:"tool"` -> role "user" with a
   "Tool result:" prefix (no other role changes).
2. Test: a NormalizedRequest containing a role:"tool" message -> the captured
   request body `messages` has it as role "user" with the prefixed content, and NO
   role:"tool" is sent; existing text/tool-call tests stay green.

## Risks

- Model clarity — the "Tool result:" prefix keeps the tool output legible to the
  model. Consecutive user messages are valid for OpenAI-compatible APIs.
