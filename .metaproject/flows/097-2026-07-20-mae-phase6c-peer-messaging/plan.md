# Implementation Plan

Status: ready to freeze

## Approach

Same pure-projection pattern as the other folds: peer messaging is derived from
the append-only `agent-event` log, gated by policy, carrying artifact-refs only.

## Steps

1. New `src/harness/child/peer.ts`:
   - `admitPeerMessage(from: DispatchView, msg) → {ok}|{ok:false,reason}` — a
     `peer_message` is admitted only when the sender's dispatch `allowed_actions`
     include a `peer` action AND the payload is an artifact-ref (no inline body).
     Fail-closed.
   - `reducePeerMessages(events) → Map<toDispatchId, PeerMessage[]>` — pure fold of
     `peer_message` events into per-recipient inboxes (stable order); artifact-ref
     only.
   - `buildPeerMessageEvent(from, to, artifactRef, meta)` — construct a schema-valid
     `peer_message` (agent-event-extensions.schema.json).
2. New `src/harness/child/peer.test.ts`: admission gate (allowed vs denied),
   inline-body rejection, inbox fold (grouping, order, determinism), and
   schema-valid event construction (via the contracts validator).
3. Add a `peer` value to the dispatch `allowed_actions` vocabulary if required by
   the gate (extend subagent-dispatch.schema.json enum + both copies), backward-
   compatible (optional).

## Risks

- Refs only — reject any inline free-text body (bounded; injection-safe).
- Gate is fail-closed: no `peer` action ⇒ denied.
- Keep the fold PURE and deterministic (stable inbox ordering).
- If extending the allowed_actions enum, keep BOTH dispatch schema copies in sync
  (parity test) and the change additive.
