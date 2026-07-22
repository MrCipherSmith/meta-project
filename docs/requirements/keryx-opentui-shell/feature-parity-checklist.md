# Feature-parity checklist — flows 050–057 → the OpenTUI shell

Verified 2026-07-22 against the working tree. This artifact exists because the
PRD names "a feature-parity checklist passes" as a success criterion and no such
checklist had ever been written; parity was asserted in flow 061's task titles
only.

**Verdict: the criterion does NOT pass as written.** Three features are absent or
silently changed on the default (TUI) surface, and none of the three is recorded
in a decision or an open item. The remaining eighteen are present, several of
them deliberately re-implemented — those are listed as *changed* with the
decision that authorises the change.

## Method and its limits

The feature list is derived from the acceptance criteria of flows 050–057
(`.metaproject/flows/05{0..7}-*/acceptance-criteria.md` and `description.md`) —
what the readline shell actually delivered — not from the PRD's prose. Each
flow's AC4 is a build/test hygiene gate (`tsc` clean, `bun test` ≥ baseline, no
new dependency), not a user-visible feature, so 8 of the 32 ACs are excluded and
21 features remain.

Every row was checked by reading the source at the cited line. Flow journals were
**not** treated as evidence. What is *not* verified here: no row was confirmed by
running the TUI and looking at it — this is a source audit, so a feature that is
wired but visually broken would still read as present.

Legend: **present** — implemented, evidence cited · **changed** — the behaviour
exists but differs · **absent** — not on the TUI path.

## Checklist

| # | Feature (flow / AC) | State | Evidence and notes |
|---|---|---|---|
| 1 | Assistant markdown rendered, not raw (050 AC1) | changed | `markdownToChunks` at `src/tui/transcript-blocks.ts:400` covers ATX headings, `**bold**`, `` `inline code` ``, `-`/`*` bullets and fences — the same rules as the readline `renderMarkdown`, emitting OpenTUI chunks instead of ANSI. Authorised: specification §9 **D-2** (reject `MarkdownRenderable`). |
| 2 | Per-turn `↑in ↓out tokens` line (050 AC2) | **changed, undocumented** | `createTuiAgentIo.onUsage` does append the dim line (`src/tui/tui-shell.ts:141-152`), but the shell **overrides that hook** at `src/tui/tui-shell.ts:949-958` with a *cumulative* header counter (`chrome.setHeaderMeta`) plus a sidebar total. The per-turn transcript line therefore never renders in the running shell. Specification §4 still says `onUsage` → "render the dim usage line when the turn ends", and `tui-shell.ts:11` still claims the line in its own header comment. See gap **G-1**. |
| 3 | Styled assistant role header (050 AC3, 052 AC3) | present | `● keryx` + timestamp at `src/tui/tui-shell.ts:1747-1753`; chat renders the same marker at `src/tui/chat-shell.ts:376`. |
| 4 | Turn separator / whitespace, no heavy rules (050 AC3, 052 AC3) | present | `marginTop: 1` on the role header (`src/tui/tui-shell.ts:1751`); no rule characters anywhere in the transcript path. |
| 5 | Tool calls as `⚙ name(k=v)` via `summarizeToolArgs` (050 AC3) | present | `src/tui/tui-shell.ts:153-157` (default) and `:210-223` (block form). The pure helper is unchanged at `src/lib/ui.ts:203`. |
| 6 | No cursor-up / scroll-region math (050 AC3, 051 AC2) | present | OpenTUI owns the terminal; the flow-051 differ is not on this path. `src/lib/live-render.ts` is imported only by `src/commands/shell.ts:41,751` — the readline surface. |
| 7 | Live per-token markdown streaming (051 AC3) | changed | Preserved as behaviour, replaced as mechanism: `AssistantMessageStream.push` re-segments per chunk and repaints only from `frozen` onward (`src/tui/transcript-blocks.ts:678-685`). `LiveMarkdownBlock`/`computeRepaint` are not used. Authorised: PRD **N3** ("OpenTUI's buffered renderer replaces the hand-rolled flow-051 differ"). |
| 8 | Coalesced repaints, no O(n²) on long streams (051 AC3) | changed | The 50ms coalescing timer is gone; the equivalent guard is the `frozen` index — a settled segment is never repainted again (`transcript-blocks.ts:629-630, 657-675`). Same property, different mechanism. Not separately recorded, but it is the direct consequence of the documented N3 swap. |
| 9 | Non-TTY / `NO_COLOR` keeps the proven line-based path (051 AC3, 052 AC4) | present | `chooseShellSurface` returns `"readline"` whenever `!isTty` (`src/commands/shell.ts:1174-1182`); `src/tui/shell-fallback.test.ts` covers the triggers. Caveat already recorded in the PRD: the plain-output claim is pinned by comparing two *readline* runs, not TUI vs readline. |
| 10 | Exactly one prompt marker before first input (052 AC1) | present | Structurally unreachable: the TUI has a single persistent composer built once by `createShellChrome` (`src/tui/tui-shell.ts:791-801`). There is no second prompt to print. |
| 11 | Minimal one-line launch header (052 AC2) | present | `title: "keryx · agent · <provider>/<model>"` at `src/tui/tui-shell.ts:792`, painted dim at `src/tui/shell-chrome.ts:361`. No `banner()`, no rules. |
| 12 | …including `cwd` in the header meta (052 AC2) | **absent** | The readline header still prints it (`src/commands/shell.ts:1397-1401`, `collapseHome(process.cwd())`). Nothing in the TUI does: `cwd` appears in `src/tui/tui-shell.ts` only as an approval-context and session argument (`:302`, `:718`), never as displayed text, and the sidebar shows model/context/tools/status only (`:828-847`). See gap **G-2**. |
| 13 | Explicit `· agent` / `· chat` mode label (053 AC3) | present | Carried by the TUI title (`src/tui/tui-shell.ts:792`; chat's equivalent in `src/tui/chat-shell.ts`). Never blank. |
| 14 | Interactive agent/chat mode picker (053 AC1, AC2) | **absent** | `pickAgentMode` still exists and is tested (`src/commands/select.ts:190`) but its only call site is `src/commands/shell.ts:1366`, inside the readline branch. The TUI branch returns at `src/commands/shell.ts:1220` before that line, and `chooseShellSurface` (`:1174-1182`) reads `flags.modeFlag` alone. There is also no `/mode` command in `AGENT_SLASH_COMMANDS` (`src/commands/agent-commands.ts:59-113`). On the default surface the mode is reachable only via `--chat`/`--agent`. See gap **G-3**. |
| 15 | `--chat` flag forces chat mode (053 AC3) | present | Parsed at `src/commands/shell.ts:1125-1126`; routed to `"tui-chat"` at `:1181` and dispatched at `:1290`. |
| 16 | Consistent left gutter (054 AC1–AC3) | changed | Provided by layout instead of string padding: the transcript box carries `padding` (`src/tui/tui-shell.ts:12` states the mapping; block bodies add their own `paddingLeft` at `src/tui/transcript-blocks.ts:567, 845`). `indentBlock` (`src/lib/ui.ts:190`) survives for the readline path only (`src/commands/shell.ts:524, 754, 800`). Behaviourally equivalent and better — the gutter cannot desynchronise from the repaint math because there is no repaint math. |
| 17 | Collapsed multi-line tool output with hidden count (055 AC1, AC2) | present | `collapseToolOutput` (`src/lib/ui.ts:178`) drives both the default line (`src/tui/tui-shell.ts:158-163`) and the retained block (`:224-237`), rendering `↳ <summary> · +N more`. |
| 18 | `/expand` reveals the full retained output; `/help` lists it (055 AC3) | changed | Registered at `src/commands/agent-commands.ts:93` and handled at `src/tui/tui-shell.ts:1688`. Two differences: it **toggles** rather than only expands, and the affordance is the block's own hint (`/expand · ctrl+o`, `src/tui/tui-shell.ts:235`) rather than the inline `(/expand)` suffix. The TUI also retains *every* block, not just the last. Authorised: specification §3 (flow 115 refinement) and §9 **D-3**. |
| 19 | `reasoning_delta` normalized event + adapter emission (056 AC1) | present | `"reasoning_delta"` in `NormalizedEventKind` (`src/harness/provider/types.ts:18`), consumed by the driver at `src/commands/agent.ts:372, 522`. Driver-side, so shared by both surfaces. |
| 20 | Reasoning section rendered before the answer (056 AC2, AC3) | changed | The `onReasoning` hook fires unchanged (`src/commands/agent.ts:526`). Presentation differs: not a dim `⋯ thinking` section but a collapsed `▸ thought (n lines) · /think · ctrl+o` block (`src/tui/tui-shell.ts:193-209`, label built by `blockLabel` at `src/lib/md-blocks.ts:166-170`), dim and bounded to `MAX_THOUGHT_LINES = 12` when expanded, with the full payload retained for `y`/`/copy`. Authorised: specification §3 (flow 115) and §9 **D-2**. |
| 21 | Runaway tool-loop guard (057 AC1–AC3) | changed | Driver-side and therefore identical on both surfaces, but it has moved on from flow 057: the budget is now *unique tool signatures* (`DEFAULT_MAX_TOOL_CALLS = 48`, `src/commands/agent.ts:117`) with `MAX_ATTEMPTS_PER_HASH = 3` retries per signature counting as one slot (`:150`), and exhaustion no longer emits `[stopped]` and returns — it emits `[budget] Stopping tools: …` and forces one tool-free wrap-up round (`:480-515`). AC3's actionable `(required: …)` suffix survives verbatim (`:594`). This is post-057 evolution unrelated to the TUI migration — flow 057 itself listed the wrap-up round as a possible later refinement — and the TUI surfaces the notice through `io.onSystem`, which matches `[budget]` explicitly (`src/tui/tui-shell.ts:981-987`). |

**Tally: 12 present · 6 changed-and-authorised · 1 changed-and-undocumented · 2 absent.**

## Gaps

These are the rows that make the criterion fail. None is recorded in a decision,
an ADR, or specification §10's open items.

- **G-1 — the per-turn usage line does not exist on the default surface.** The
  code that would render it (`src/tui/tui-shell.ts:141-152`) is dead in the
  running shell, overridden at `:949`. A reader of specification §4 or of
  `tui-shell.ts`'s own header comment would conclude otherwise. The replacement
  (a cumulative header counter) is arguably better, but it is a different
  feature: per-turn cost feedback was flow 050's stated motivation ("relevant for
  the metered OpenRouter budget") and cumulative totals do not provide it.
- **G-2 — `cwd` is not shown anywhere in the TUI.** Flow 052 AC2 put it in the
  header for a reason: an agent with `shell_exec` and write tools acts on a
  directory, and the operator cannot see which one. The readline shell still
  shows it.
- **G-3 — the mode picker is unreachable on the default surface.** Flow 053
  existed because a picker-launched session silently ran chat mode and
  hallucinated; the fix was to *ask*. The TUI does not ask, and offers no
  in-session way to switch. The default is agent, so flow 053's actual bug has
  not regressed — but the picker it shipped is gone from the path users take.

Two of the three are omissions of a single line of chrome. G-3 is a genuine
scope question: it may be that the picker should not return, and the right
resolution is a decision saying so.

## What this checklist does not settle

- Nothing here was verified by rendering. Row 1's markdown rules, row 16's gutter
  and row 20's bounded body were read, not seen.
- Rows 19 and 21 are driver-level and shared with the readline path, so they
  prove the *driver* is intact rather than that the TUI presents it well.
- The PRD's separate "byte-identical plain output" claim is out of scope here and
  remains as the PRD's audit table describes it.
