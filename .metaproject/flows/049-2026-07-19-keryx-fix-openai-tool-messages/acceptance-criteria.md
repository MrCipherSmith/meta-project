# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: The OpenAI-compatible adapter (src/harness/provider/ollama/ollama-provider.ts) serializes a normalized `role:"tool"` message into a `role:"user"` wire message whose content marks it as a tool result (a clear prefix such as `Tool result:`), because keryx's `NormalizedMessage` carries no `tool_call_id` to form a valid OpenAI tool message. `system`/`user`/`assistant` role mapping is UNCHANGED. No `role:"tool"` is ever placed in the outgoing OpenAI-compatible request body.
- AC2: A unit test builds a `NormalizedRequest` containing a `{ role:"tool", content }` message, streams it through an injected fetch that captures the request `init.body`, and asserts the serialized `messages` array contains that entry as `role:"user"` with the prefixed tool content and contains NO entry with `role:"tool"`. Deterministic/offline.
- AC3: No regression / offline / deterministic — `tsc --noEmit` clean and full `bun test` >= the pre-change baseline of 1452 pass / 3 skip / 0 fail with the new test green and 0 fail; the existing ollama text + tool-call streaming tests stay green; `dependencies` REMAINS `{}`; the agent driver, the normalized types, and other providers are unchanged. A live smoke (openrouter, multi-turn with a tool call) no longer errors after the first tool call — recorded in the journal; not a CI gate.
