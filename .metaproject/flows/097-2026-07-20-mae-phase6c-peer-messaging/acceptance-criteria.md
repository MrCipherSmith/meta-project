# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: `admitPeerMessage(from, msg)` in `src/harness/child/peer.ts` admits a peer message only when the sender's dispatch `allowed_actions` include a `peer` action; otherwise it returns a fail-closed `{ok:false, reason}`. Pure.
- AC2: A peer message payload MUST be an artifact-ref (path/kind/hash) — an inline free-text body is rejected (bounded, injection-safe).
- AC3: `reducePeerMessages(events)` is a pure fold of `peer_message` events into per-recipient inboxes (keyed by `to_dispatch_id`), with stable ordering and deterministic output on identical logs.
- AC4: `buildPeerMessageEvent(...)` produces a `peer_message` event that validates against `docs/requirements/keryx-multi-agent-engine/schemas/agent-event-extensions.schema.json` (artifact-ref only).
- AC5: If a `peer` value is added to the dispatch `allowed_actions` enum, BOTH `subagent-dispatch.schema.json` copies (`.metaproject/core/...` and `src/gdskills/...`) stay identical (parity) and the change is additive/backward-compatible.
- AC6: `peer.test.ts` covers the admission gate (allow/deny), inline-body rejection, inbox fold (grouping/order/determinism), and schema-valid event construction; the full suite (incl. the zero-`dependencies` guard) passes and `tsc --noEmit` is clean.
