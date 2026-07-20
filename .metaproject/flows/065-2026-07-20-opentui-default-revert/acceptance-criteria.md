# Acceptance Criteria — flow 065 (revert OpenTUI default)

- AC1: `keryx shell --agent` on a TTY uses the readline shell BY DEFAULT again (flow-064's default flip is reverted). The OpenTUI shell is reached ONLY by an explicit `--tui` flag. `--no-tui` remains accepted (harmless no-op). This un-breaks the shell for real terminals where the OpenTUI stdin handoff currently leaks terminal capability-query responses.
- AC2: `--tui` still attempts the OpenTUI shell (opt-in, for iterating the handoff fix on a real terminal); the readline fallback on no-TTY / absent dep / init failure is preserved. The TUI code (tui-shell.ts) is unchanged — only the launch gating reverts to opt-in.
- AC3: A known-issue note is recorded (a `README`/report in the flow package): on a real TTY the readline picker → OpenTUI handoff leaks terminal DA/DSR/capability responses; root-cause + planned fix (own the terminal before OpenTUI, no concurrent readline) captured for a follow-up.
- AC4: `bunx tsc --noEmit` clean; `bun test` green with no reduction from baseline (1506); smokes confirm default `--agent` (no --tui) → readline, and `--tui` non-TTY → readline fallback. No new dependency; nothing else changes.
