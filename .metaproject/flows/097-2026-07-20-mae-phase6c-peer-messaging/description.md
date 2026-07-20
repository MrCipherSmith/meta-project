# Multi-Agent Engine Phase 6c: bounded peer messaging

Status: ready to freeze
Source: user description + docs/requirements/keryx-multi-agent-engine/ (brainstorm C3, schemas/agent-event-extensions.schema.json)

## Problem

Sibling subagents cannot exchange results without a side channel, which risks
context blowup and prompt injection (free-form chatter between children). The
engine needs a bounded, auditable way for peers to hand each other artifacts —
without a mutable side store and without letting any child message any other.

## Expected Outcome

**Peer messaging as an event projection**: a `peer_message` agent-event (already
in `schemas/agent-event-extensions.schema.json`) carries ONLY an artifact-ref
(bounded, hash-addressed — never inline free-text). A pure
`reducePeerMessages(events) → inboxes` fold reconstructs per-recipient inboxes
from the log (inbox/outbox as a projection, not a side channel), and a policy gate
admits a `peer_message` only from a child whose dispatch grants a `peer` action.
Bounded and replayable: messages are artifact-refs, gated, and fully derived from
the append-only stream.

## Out of Scope

- Event-sourced state fold (Phase 6a, flow 095) and worktree isolation (Phase 6b,
  flow 096).
- A live delivery/transport loop between running children — this phase delivers the
  pure projection + the admission gate; wiring it into a live fleet is later.
- Inline message bodies — refs only (bounded), enforced by the schema + gate.
