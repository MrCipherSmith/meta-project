// Bounded peer messaging as an event projection (flow 097, multi-agent engine
// Phase 6c).
//
// Sibling subagents hand each other results WITHOUT a mutable side channel or
// free-form chatter: a `peer_message` agent-event carries ONLY an artifact-ref
// (bounded, hash-addressed — never an inline body), it is admitted only from a
// dispatch that was granted the `peer` action (fail-closed gate), and per-
// recipient inboxes are a PURE FOLD over the append-only stream. This keeps peer
// traffic bounded, auditable, replayable, and injection-safe.
//
// Pure and deterministic: no clock/RNG/network/fs (timestamps/ids are supplied by
// the caller from injected sources). Mirrors
// docs/requirements/keryx-multi-agent-engine/schemas/agent-event-extensions.schema.json.

/** A bounded, hash-addressed artifact reference — the ONLY legal peer payload. */
export interface PeerArtifactRef {
  path: string;
  kind: string;
  hash: string | null;
}

/** The minimal dispatch view the admission gate needs. */
export interface DispatchView {
  dispatch_id: string;
  allowed_actions: readonly string[];
}

/** A peer message the gate inspects before it becomes an event. */
export interface PeerMessageInput {
  from_dispatch_id: string;
  to_dispatch_id: string;
  /** The bounded payload. Required — a peer message with no ref is rejected. */
  artifact_ref?: PeerArtifactRef;
  /** Any inline body is ILLEGAL (bounded/injection-safe) — its presence is rejected. */
  body?: unknown;
}

/** Result of {@link admitPeerMessage}: admitted, or a fail-closed denial. */
export type PeerAdmitResult = { ok: true } | { ok: false; reason: string };

/** The dispatch allowed-action that authorizes sending peer messages. */
export const PEER_ACTION = "peer";

/**
 * Fail-closed admission gate for a peer message. Admits ONLY when the sender's
 * dispatch was granted the `peer` action AND the payload is a well-formed
 * artifact-ref (no inline body). Any missing grant, inline body, or malformed ref
 * is denied. Pure.
 */
export function admitPeerMessage(from: DispatchView, msg: PeerMessageInput): PeerAdmitResult {
  if (!from.allowed_actions.includes(PEER_ACTION)) {
    return { ok: false, reason: `dispatch "${from.dispatch_id}" lacks the "${PEER_ACTION}" allowed action` };
  }
  if (msg.body !== undefined) {
    return { ok: false, reason: "peer message must carry an artifact_ref, not an inline body" };
  }
  const ref = msg.artifact_ref;
  if (
    ref === undefined ||
    typeof ref.path !== "string" ||
    ref.path.length === 0 ||
    typeof ref.kind !== "string" ||
    ref.kind.length === 0
  ) {
    return { ok: false, reason: "peer message artifact_ref must have a non-empty path and kind" };
  }
  return { ok: true };
}

/** A `peer_message` agent-event (mirrors agent-event-extensions.schema.json). */
export interface PeerMessageEvent {
  schemaVersion: 1;
  type: "peer_message";
  dispatch_id: string;
  run_id?: string;
  recorded_at: string;
  data: { from_dispatch_id: string; to_dispatch_id: string; artifact_ref: PeerArtifactRef };
}

/** Inputs to {@link buildPeerMessageEvent}: identity + payload + injected stamps. */
export interface BuildPeerMessageInput {
  dispatchId: string;
  runId?: string;
  recordedAt: string;
  fromDispatchId: string;
  toDispatchId: string;
  artifactRef: PeerArtifactRef;
}

/**
 * Build a schema-valid `peer_message` event (artifact-ref only). Pure — the
 * timestamp/ids are supplied by the caller from injected sources. Optional
 * `run_id` is set only when provided (respects `additionalProperties:false`).
 */
export function buildPeerMessageEvent(input: BuildPeerMessageInput): PeerMessageEvent {
  return {
    schemaVersion: 1,
    type: "peer_message",
    dispatch_id: input.dispatchId,
    ...(input.runId !== undefined ? { run_id: input.runId } : {}),
    recorded_at: input.recordedAt,
    data: {
      from_dispatch_id: input.fromDispatchId,
      to_dispatch_id: input.toDispatchId,
      artifact_ref: input.artifactRef,
    },
  };
}

/** One delivered peer message in a recipient's inbox. */
export interface PeerInboxMessage {
  fromDispatchId: string;
  artifactRef: PeerArtifactRef;
  recordedAt: string;
}

/**
 * Fold `peer_message` events into per-recipient inboxes, keyed by
 * `to_dispatch_id`. Non-peer events are ignored. Per-recipient order is the
 * event (insertion) order — stable and deterministic for an identical log. Pure.
 */
export function reducePeerMessages(
  events: readonly PeerMessageEvent[],
): Map<string, PeerInboxMessage[]> {
  const inboxes = new Map<string, PeerInboxMessage[]>();
  for (const event of events) {
    if (event.type !== "peer_message") continue;
    const to = event.data.to_dispatch_id;
    const inbox = inboxes.get(to) ?? [];
    inbox.push({
      fromDispatchId: event.data.from_dispatch_id,
      artifactRef: event.data.artifact_ref,
      recordedAt: event.recorded_at,
    });
    inboxes.set(to, inbox);
  }
  return inboxes;
}
