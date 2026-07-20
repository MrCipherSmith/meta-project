# Known issue — OpenTUI stdin handoff on a real TTY (flow 065)

## Symptom
On a real terminal (iTerm2), after the readline provider/model picker, launching
the OpenTUI shell prints raw terminal responses as text (e.g. `10;rgb:...` color
queries, `...t35;56;...` cursor/size, `Capabilities=...`) and leaves the terminal
in a broken state. `reset` / `stty sane` restores it.

## Root cause (hypothesis)
`shellCommand` creates a `node:readline` interface over `process.stdin` up front
(for the picker) and it keeps consuming stdin. `createCliRenderer()` then writes
terminal capability/DA/DSR QUERIES and expects to read the RESPONSES from stdin —
but readline is still attached, so the responses are split/eaten and OpenTUI's
parser misses them; they echo to the screen. Closing readline in `onStart` happens
AFTER `createCliRenderer` already queried, so it is too late.

## Planned fix (follow-up; needs a real TTY to validate)
Hand off stdin BEFORE OpenTUI queries: either
- close the readline interface (and `process.stdin.setRawMode(false)` + remove its
  listeners) BEFORE `createCliRenderer`, recreating readline only if TUI declines; or
- do provider/model selection via flags / inside the TUI so no readline picker runs
  when `--tui` is used (OpenTUI owns the terminal from the start).

Until then: readline is the default; OpenTUI is opt-in via `--tui`.
