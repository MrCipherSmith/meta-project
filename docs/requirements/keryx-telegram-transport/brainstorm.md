# Brainstorm: Telegram Companion Transport Options
Version: 1.0.0

## Decision question

Which Telegram surface best meets the need for safe companion visibility while
the Project Agent Harness remains local-first and Task Manager stays the sole
managed-flow owner?

## Options

| Option | Benefits | Costs and risks | Fit |
|---|---|---|---|
| Local long-polling companion bot | No public endpoint; aligns with desktop/local process; simple private-chat pairing; smallest Release 0 attack surface. | Requires local process availability and careful polling/restart idempotency. | **Selected for Release 0.** |
| Server webhook companion bot | Always-on server delivery and centralized operations. | Requires public HTTPS, webhook secret verification, rate limiting, durable idempotency, observability, credential operations, and clearer remote-control threat model. | Deferred to separate headless/server release. |
| Telegram Mini App/control surface | Rich list/run/approval UI and session browsing potential. | Larger UX/auth/data-exposure surface; does not reduce core transport/policy work; risks becoming a second control plane. | Release 2+ exploration only. |

## Evaluation criteria

- Keeps Harness and Task Manager as the only lifecycle/state owners.
- Avoids a public control plane in the first release.
- Supports explicit user pairing and bounded approvals.
- Minimizes secret and sensitive-output exposure.
- Is testable offline through a fake provider adapter.
- Leaves a clear path to future server/webhook and Mini App modes without
  contaminating the provider-neutral transport port.

## Selected decision

Use a private-chat, local long-polling companion adapter. It sends status and
notifications and accepts only typed, policy-constrained status, approval, and
own-operation cancellation intents. The desktop UI remains canonical; Telegram
is never a second Harness runtime or Task Manager writer.

## Deferred decisions

- Exact credential-store implementations and supported platforms.
- Numeric limits for retries, send rate, message size, TTL, and retention.
- Precise Harness port names and evidence payload versioning.
- Server/headless ownership model and multi-tenant webhook operations.
- Mini App authentication and session-browsing policy.

## External basis

Official Telegram documentation supports the relevant primitives: bot deep links,
inline keyboards/callbacks, long polling, webhooks, and Mini Apps. See
[Bots](https://core.telegram.org/bots),
[features](https://core.telegram.org/bots/features),
[Bot API](https://core.telegram.org/bots/api), and
[webhooks](https://core.telegram.org/bots/webhooks).
