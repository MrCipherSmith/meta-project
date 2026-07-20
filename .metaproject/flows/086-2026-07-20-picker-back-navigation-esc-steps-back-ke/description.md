# Picker back-navigation (Esc = step back)

Status: formalized
Source: user (screenshot of the API-key step) — "нужно чтобы на esc был шаг назад"

## Problem

The provider → model → key picker only moved forward: at the API-key step Esc did
nothing (no way to return to the model list), and the model step's Esc cancelled the
whole flow. A mis-pick meant restarting `/connect` from scratch.

## Expected Outcome

- Esc at the provider step cancels the picker.
- Esc at the model step returns to the provider list.
- Esc at the key step returns to the model list.
- Empty Enter at the key step proceeds without a key; a typed key is saved.

## Out of Scope

- `/model` stays single-step (Esc cancels — there is no earlier step to return to).
- No change to persistence, live model fetch, or the provider registry (flow 085).
