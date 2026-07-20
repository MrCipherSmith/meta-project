# Flow 059 — OpenTUI shell Phase 0 spike

Executes Phase 0 of docs/requirements/keryx-opentui-shell. Goal: de-risk before
the migration by validating R1–R5 and proving a live `/` dropdown. Adds
`@opentui/core`, identifies the real component/keyboard API, builds an isolated
`--tui` prototype, and records a go/adjust/fallback recommendation. The readline
shell stays the default and untouched; nothing ships to users this flow.
