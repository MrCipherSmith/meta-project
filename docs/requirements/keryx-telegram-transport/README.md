# Keryx Telegram Companion Transport
Version: 1.0.0

## Purpose

This package specifies a future, optional Telegram companion transport for the
Keryx Project Agent Harness. It lets explicitly paired users observe long-running
local work and approve or cancel only policy-eligible operations. It is a
requirements package, not a runtime implementation.

## Status

**Specification ready (future).** Neither the Telegram integration nor the
Project Agent Harness runtime is claimed to be implemented by this package.

## Scope

Release 0 is a private-chat companion bot for one or more explicitly paired
users. A desktop/local process uses long polling by default; it validates a
locally supplied token, pairs a chat through a one-time deep link, and then
delivers status, progress, error summaries, approval prompts, and cancellation
of the user's own active operation.

The desktop UI remains canonical for connecting, access revocation, policy
inspection, and emergency disablement. Task Manager remains the only writer of
managed-flow state; Telegram never writes `flow.json`.

## Non-goals

- A second agent runtime, domain-state owner, or remote control plane.
- Free-form shell execution, filesystem mutation, network access, subagent
  dispatch, or arbitrary agent tasks initiated from Telegram messages.
- Groups, channels, inline mode, Mini Apps, Telegram Login/OIDC, webhooks, and
  a chat-first agent UX in Release 0.

## Document index

| Document | Purpose |
|---|---|
| [PRD](prd.md) | Product problem, users, scenarios, outcomes, and risks. |
| [Specification](specification.md) | Architecture, ownership, lifecycle, state machine, and acceptance criteria. |
| [Transport protocol](transport-protocol.md) | Typed inbound/outbound transport contracts and operational behavior. |
| [Security policy](security-policy.md) | Trust, authorization, redaction, approvals, and secret-handling rules. |
| [UX flows](ux-flows.md) | Desktop-led setup, pairing, status, approval, cancellation, and recovery journeys. |
| [Metrics and validation](metrics-and-validation.md) | Success metrics, fake-adapter tests, and release validation evidence. |
| [Brainstorm](brainstorm.md) | Alternatives considered and Release 0 recommendation. |
| [Telegram transport configuration schema](schemas/telegram-transport-config.schema.json) | Safe configuration without a raw token. |
| [Credential reference schema](schemas/credential-reference.schema.json) | Opaque OS credential-store reference. |
| [Pairing request schema](schemas/pairing-request.schema.json) | One-time, expiring pairing material. |
| [Pairing result schema](schemas/pairing-result.schema.json) | Safe terminal pairing outcome. |
| [Authorized chat binding schema](schemas/authorized-chat-binding.schema.json) | Explicit local authorization record. |
| [Inbound update receipt schema](schemas/normalized-inbound-update-receipt.schema.json) | Provider-neutral, bounded input record. |
| [Outbound notification schema](schemas/outbound-notification.schema.json) | Redacted, correlated notification contract. |
| [Approval callback schema](schemas/approval-callback.schema.json) | Opaque, expiring one-time callback. |
| [Webhook configuration schema](schemas/webhook-configuration.schema.json) | Future server/headless mode configuration. |

## Related modules

- `src/flow`: Task Manager is the authoritative managed-flow lifecycle and state
  owner.
- `src/security`: existing security/policy boundary, input scanning, and
  redaction seam to be integrated by a future adapter.
- Future Project Agent Harness: owner of typed intents, policy classification,
  evidence, and local-session outcomes.
- `.metaproject`: source of truth for flow, policy/security, evidence, graph,
  wiki, memory, skills, testing, and health capabilities.

## Sources

Telegram protocol claims are constrained to the official documentation:
[Bots overview](https://core.telegram.org/bots),
[Bot features](https://core.telegram.org/bots/features),
[Bot API](https://core.telegram.org/bots/api), and
[webhooks guide](https://core.telegram.org/bots/webhooks).
