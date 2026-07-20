# Implementation Plan

Status: done

## Approach

Split the picker into per-step promises (`pickProviderStep`, `pickModelInTui`,
`promptApiKeyStep`) and drive them from an async state machine in
`selectProviderModelInTui` that interprets each step's "back" signal.

## Steps

1. `promptApiKeyStep` → discriminated `{key|skip|back}` with an Esc keypress handler. [done]
2. `pickProviderStep` extracted with an Esc → cancel handler. [done]
3. `selectProviderModelInTui` async loop: provider(cancel) → model(back) → key(back). [done]
4. Update hint strings; tsc + full suite green. [done]

## Risks

- Esc consumed by the focused Input/Select → handled via `_internalKeyInput`
  (runs before the focused widget) with preventDefault/stopPropagation.
