# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: `selectProviderModelInTui` is a provider → model → key wizard with BACK navigation: Esc at the provider step cancels the whole picker (resolves `undefined`); Esc at the model step returns to the provider list; Esc at the key step returns to the model list. Implemented as an async loop over `pickProviderStep`, `pickModelInTui`, `promptApiKeyStep`.
- AC2: `promptApiKeyStep` returns a discriminated result — Enter-with-text → `{kind:"key"}` (set env + persist 0600), empty Enter → `{kind:"skip"}` (proceed keyless), Esc → `{kind:"back"}` — via an `_internalKeyInput` keypress handler removed on close. `pickProviderStep` adds the same Esc handler. Hints updated (provider: "Esc to cancel"; model/key: "Esc to go back").
- AC3: No behavioural regression elsewhere: `/model` (single-step) still cancels on Esc; `/connect` uses the wizard; startup picker unchanged aside from back-nav; keys still never logged, persisted per-provider under `apiKeys[envKey]`.
- AC4: `bunx tsc --noEmit` clean; `bun test` green (1528 pass, no regression). No new dependency. Back-navigation validated by the user on a real terminal.
