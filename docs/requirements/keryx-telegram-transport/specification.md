# Specification: Keryx Telegram Companion Transport
Version: 1.0.0

## Identity and status

`keryx-telegram-transport` is a future optional adapter around the Project
Agent Harness. It provides a Telegram-specific transport port and owns neither
domain state, Harness policy decisions, nor Task Manager state. No runtime
module, CLI command, bot, or provider SDK is introduced by this specification.

## Architecture and ownership

| Concern | Owner | Telegram transport responsibility |
|---|---|---|
| Local agent lifecycle, typed intents, policy classification, evidence | Future Harness | Submit normalized typed intents and consume permitted outcomes. |
| Managed-flow state, retries, review/fix, completion | Task Manager / `src/flow` | Read a safe projection only; never write `flow.json`. |
| Security scan, redaction, policy boundary | `src/security` / Security-Policy | Submit untrusted inbound content and outbound candidates to the existing boundary. |
| Project graph, wiki, memory, skills, testing, health, evidence | `.metaproject` | Reference authoritative local services; never shadow their state. |
| Telegram updates, message rendering, pairing, delivery receipts | Telegram adapter/transport port | Normalize provider data, maintain transport-local idempotency, and render safe notifications. |

The adapter depends inward on provider-neutral ports. A provider SDK, if added in
the future, must be behind the adapter boundary and must not leak Telegram
objects into Harness domain contracts.

## Configuration and credential model

`telegram-transport-config.schema.json` stores mode and safe references only.
The actual token is resolved through an OS credential store using
`credential-reference.schema.json`. A raw token is forbidden in config,
repository files, prompts, trace output, telemetry, schema fixtures, and
`.metaproject` artifacts.

## State machine

```text
disconnected -> token-validated -> awaiting-pairing -> paired -> polling-active
                                                  \-> disconnected
polling-active -> degraded -> polling-active | disconnected
any non-terminal state -> disconnected
```

- `disconnected`: no active transport session or a locally revoked credential.
- `token-validated`: credential reference resolved and `getMe` succeeds locally;
  validation result must be redacted in evidence.
- `awaiting-pairing`: an unconsumed, expiring pairing code exists.
- `paired`: an explicitly authorized private `chat_id` binding exists.
- `polling-active`: polling is running with the allowed update types and a
  persisted `update_id` checkpoint.
- `degraded`: delivery/polling cannot meet its current retry policy; the local
  UI presents recovery state and a final status is emitted when possible.

Polling startup must inspect active webhook state. A detected webhook is a
blocking `webhook-conflict` condition, not an implicit migration to webhook or
a destructive webhook deletion.

## Inbound lifecycle

```text
Telegram update
  -> size/type validation
  -> update_id idempotency and ordering check
  -> explicit private-chat authorization
  -> security and prompt-injection scan
  -> typed intent mapping
  -> Harness policy (allow | ask | deny)
  -> optional one-time approval
  -> Harness evidence/result
  -> redaction and outbound notification
```

Only these Release 0 typed intents may be emitted: `status.read`,
`operation.cancel-own`, `approval.respond`, and `pairing.start`. Unknown text,
unknown commands, unsupported update types, group/channel updates, or security
failures yield no privileged action. A policy `deny` is final; Telegram cannot
turn it into an approval.

## Transport protocol and data contracts

The provider-neutral contract is defined in [transport-protocol.md](transport-protocol.md).
All JSON contracts use Draft 2020-12 and are versioned:

- [Telegram transport configuration](schemas/telegram-transport-config.schema.json)
- [Credential reference](schemas/credential-reference.schema.json)
- [Pairing request](schemas/pairing-request.schema.json)
- [Pairing result](schemas/pairing-result.schema.json)
- [Authorized chat binding](schemas/authorized-chat-binding.schema.json)
- [Normalized inbound update receipt](schemas/normalized-inbound-update-receipt.schema.json)
- [Outbound notification](schemas/outbound-notification.schema.json)
- [Approval callback](schemas/approval-callback.schema.json)
- [Webhook configuration](schemas/webhook-configuration.schema.json)

Every async transport operation carries `correlationId`, supports cancellation
where applicable, has an explicit timeout, and produces a final local and
Telegram-facing status. Notification text is bounded in size and rendered from
structured summary fields; raw provider/tool payloads are not forwarded.

## Reliability and lifecycle rules

- **Idempotency/order:** use Telegram `update_id` as the deduplication and
  ordering key. Persist a checkpoint only after the update reaches a terminal
  safe outcome. Pairing and approval nonces are one-time and atomically
  consumed.
- **Retries/rate limits:** retry only transient polling or send failures with
  bounded exponential backoff and jitter. Do not retry non-idempotent policy or
  approval effects without their idempotency key. Apply per-chat and global
  outbound limits before send.
- **Cancellation:** cancellation requires the binding owner and an operation
  ownership match. It requests cancellation through a future Harness port; it
  never edits Task Manager records directly.
- **Rotation/revoke:** token rotation invalidates the old credential reference
  and forces a fresh local validation. Desktop revoke disables binding, removes
  future authorization, and stops dispatch for that chat.
- **Retention/redaction:** retain only minimal redacted transport evidence and
  idempotency metadata for an explicitly configured period. Never retain raw
  token material; redact secret/PII/prompt-injection findings before persistence
  or notification.

## Local polling versus server webhook

Release 0 runs locally through long polling and requires no public endpoint.
Future headless/server mode is a separate release and requires HTTPS, Telegram
webhook `secret_token`, explicit allowed update types, rate limiting,
idempotency persistence, observability, and an operator-owned credential store.
It must not reuse the local mode's assumptions about user presence or storage.

## Testability

An offline fake Telegram adapter is required. It must inject updates,
simulate duplicate/reordered delivery, webhook conflict, send failures, callback
presses, and restart checkpoints without any network call or token. Contract
tests validate all schemas; scenario tests validate the lifecycle against fake
Harness, policy, security, evidence, and Task Manager projection ports.

## Acceptance criteria

| ID | Given / when / then |
|---|---|
| AC-01 Happy path | Given a valid credential reference and an unpaired local install, when `/start` carries an unexpired one-time pairing code, then one private `chat_id` binding is created and a redacted test notification is sent. |
| AC-02 Unauthorized sender | Given an unbound or non-allowlisted chat, when it sends any update, then no Harness intent, approval, cancellation, or notification side effect is produced. |
| AC-03 Duplicate update | Given a terminally processed `update_id`, when it is delivered again, then it creates no second action, approval, or dangerous notification. |
| AC-04 Expired pairing | Given an expired or consumed pairing code, when `/start` presents it, then pairing fails without binding a chat. |
| AC-05 Denied action | Given policy returns `deny`, when a Telegram request is normalized, then no inline approval is rendered and the response is a safe denial summary. |
| AC-06 Approval expiry | Given an expired or consumed approval callback, when pressed, then it cannot confirm the action and reports expiry safely. |
| AC-07 Restart/replay | Given a persisted update checkpoint or approval receipt, when the adapter restarts and receives replayed input, then no confirmed action is re-executed. |
| AC-08 Revoked token | Given desktop token revoke or rotation, when a later poll/send is attempted, then the adapter enters `disconnected`, performs no dispatch, and requires fresh setup. |
| AC-09 Webhook conflict | Given an active webhook, when local polling starts, then polling does not start and the desktop presents an explicit resolution requirement. |
| AC-10 Secret-leak prevention | Given token-like, secret, absolute-path, or sensitive tool-output fixtures, when evidence or notification is rendered, then raw values never appear in config, trace, telemetry, schema fixtures, or Telegram text. |
