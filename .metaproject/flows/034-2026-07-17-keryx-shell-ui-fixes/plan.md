# Implementation Plan

Status: formalized

## Approach

Fix the scroll-region enter sequence (pure `src/lib/statusbar.ts`) so it no longer
moves the cursor to the bottom row: wrap the DECSTBM set in DECSC/DECRC
(`ESC7`/`ESC8`) so the cursor stays just below the header. Add one blank line of
padding in the header (`createRichIo` `printHeader`).

## Steps

1. `src/lib/statusbar.ts`: `scrollRegion(rows).enter` = `ESC7 + CSI 1;{rows-1}r +
   ESC8` (was `CSI 1;{rows-1}r + CSI {rows-1};1H`). Update the unit test.
2. `src/commands/shell.ts` `printHeader`: emit a blank line for breathing room.
3. `tsc` + full `bun test`; manual smoke: launch shows the prompt right under the
   header with no gap, bar pinned, terminal restored on exit.

## Risks

- Terminal-specific DECSTBM cursor behavior — mitigate by preserving the cursor
  with DECSC/DECRC and verifying in the live smoke; the bar path stays TTY-guarded.
