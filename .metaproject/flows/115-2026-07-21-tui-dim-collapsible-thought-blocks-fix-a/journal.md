# Flow Journal

- 2026-07-21T23:04:33.052Z - flow created
- 2026-07-21T23:09:48.756Z - task-added: T5: Half B - dim + bounded reasoning body, /think toggle + collapse hint
- 2026-07-21T23:09:48.902Z - task-added: T6: Docs: memory lesson, flow-109 R4 correction, OpenTUI spec + journal
- 2026-07-21T23:10:23.666Z - frozen: 8 criteria; checksum recorded
- 2026-07-21T23:10:23.809Z - started
- 2026-07-21T23:10:23.965Z - task-done: T1: Collect remaining context
- 2026-07-21T23:24:30.132Z - task-done: T3: Add/adjust tests and make them pass
- 2026-07-21T23:24:30.290Z - task-done: T2: Implement per plan
- 2026-07-21T23:24:30.417Z - task-done: T5: Half B - dim + bounded reasoning body, /think toggle + collapse hint

## Notes

### T1 — root cause

The reported "broken input line" is the **user-echo box**, not the reasoning
block: `alignSelf: "flex-start"` makes a transcript box stop measuring its
intrinsic height, so with the transcript overflowing it was laid out 2 rows tall
and drew its borders through its own text. The same mis-measurement made
`scroll.scrollHeight` report 23 against ~43 real rows, which is why the answer
below the expanded thought could not be scrolled to. Full matrices in
`context.md`; recorded as a project memory lesson
(`memory/lessons/tui-alignself-height-collapse.md`).

### T2/T5 — decisions taken while implementing

- `appendUserEcho` was extracted because the same echo box existed in THREE
  copies (agent shell, chat shell, side-worker question). Fixing the idiom in
  one place is what keeps the guard honest.
- `/expand` toggles too, not just `/think`. Same helper (`nav.toggleNewest`),
  and a one-way `/expand` had the identical dead-end.
- The flow-109 "known @opentui/core defect" test was NOT deleted but re-aimed:
  it now runs the same pure-primitive repro twice, `alignSelf` vs `maxWidth`,
  proving the bleed is ours and that the shipped hug never reproduces it. The
  `scrollTop !== 2` carve-out in the AC11 test is gone.

### T4 — verification

- `bunx tsc --noEmit`: clean.
- `bun test src/tui/ src/lib/md-blocks.test.ts src/capability/`: 191 pass, 0 fail.
- `bun run check` (full suite): 2094 pass, 11 skip, **1 fail** —
  `scripts/install-global.test.ts` times out in its `beforeEach` on
  `git -C <tmp>/snapshot add -A` (exit 143). **Pre-existing and unrelated**:
  reproduced identically on the stashed tree (flow 114's global-install smoke,
  environment-bound), and it touches no TUI code.
- `keryx health run --changed --since HEAD~3`: **PASS**, project score 93,
  trend stable.
- 2026-07-21T23:28:50.458Z - task-done: T4: Self-review and prepare draft PR
- 2026-07-21T23:28:50.599Z - task-done: T6: Docs: memory lesson, flow-109 R4 correction, OpenTUI spec + journal
