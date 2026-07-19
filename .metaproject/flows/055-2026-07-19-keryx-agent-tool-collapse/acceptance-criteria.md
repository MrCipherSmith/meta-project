# Acceptance Criteria — flow 055 (collapsible tool output)

- AC1: A pure, unit-tested `collapseToolOutput(text, maxWidth?)` helper (in `src/lib/ui.ts`) returns `{ summary, lineCount, hidden }`: `summary` is the first non-empty line clipped to `maxWidth`; `lineCount` is the total line count; `hidden` is the number of lines beyond the first (0 for single-line). Pure, deterministic.
- AC2: In agent mode a multi-line tool result renders collapsed: `↳ <first line> · +N more (/expand)` (dim); a single-line result renders just `↳ <line>`. The full output of the LAST tool call is retained in the REPL.
- AC3: A `/expand` slash command prints the full retained last tool output (gutter-indented, dim, with a `<tool> output:` header); when there is nothing to expand it prints a dim notice. `/help` lists `/expand`. Chat mode is unaffected.
- AC4: `bunx tsc --noEmit` clean; `bun test` green with no reduction from baseline (1480 pass); new `collapseToolOutput` unit tests pass. No new runtime dependency.
