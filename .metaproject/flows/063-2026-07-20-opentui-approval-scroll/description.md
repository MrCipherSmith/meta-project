# Flow 063 — OpenTUI shell Phase 4 (approval + scroll + resize)

Phase 4 of docs/requirements/keryx-opentui-shell. Makes the transcript a
ScrollBoxRenderable (scroll + sticky-bottom for long output), adds a default-deny
shell_exec approval prompt reusing the composer, and confirms resize is handled
natively. runAgentTurn + the readline shell are unchanged; --tui + fallback + the
/ dropdown are preserved.
