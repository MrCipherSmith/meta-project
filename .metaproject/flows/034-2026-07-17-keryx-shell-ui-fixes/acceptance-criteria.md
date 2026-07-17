# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: Scroll-region enter preserves the cursor — `scrollRegion(rows).enter` (`src/lib/statusbar.ts`) sets the DECSTBM region `1..rows-1` and preserves the cursor position via DECSC/DECRC (`ESC7`…`ESC8`) instead of forcing the cursor to the bottom row. Verifiable: the returned string contains the region set `[1;<rows-1>r`, contains both the save (`ESC7`) and restore (`ESC8`) controls, and does NOT contain a `[<rows-1>;1H` bottom-row cursor jump. The `src/lib/statusbar.test.ts` scroll-region test is updated to assert exactly this (and that `drawAt`/`exit` are unchanged), and passes.
- AC2: Header breathing room — `createRichIo`'s `printHeader` emits a blank line of vertical padding so the shell header is not cramped; the change is confined to the (not-unit-tested) header renderer and does not alter the status bar or prompt logic.
- AC3: No regression / offline — `tsc --noEmit` is clean and the full `bun test` suite is ≥ the pre-change baseline of 1381 pass / 3 skip / 0 fail with the updated statusbar test green and 0 fail; chat (`runShell`) and agent (`runAgentTurn`) behavior is otherwise unchanged, `dependencies` REMAINS `{}`, and no full-screen TUI is introduced. A manual live smoke shows the prompt directly below the header (no large blank gap), the status bar still pinned to the bottom, and the terminal restored after `/exit` — recorded in the journal; not a CI gate.
