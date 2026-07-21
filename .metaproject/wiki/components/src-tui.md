# Module src/tui

Version: 1.0.0
Type: component
Status: accepted

## Summary

`src/tui` groups 11 file(s). Depends on `src/lib`, `src/commands`, `src/harness/tool/builtin`. Exposes 17 public symbol(s).

## Overview

`src/tui` implements the OpenTUI-based interactive shell renderer — the `keryx shell --tui` entry point. It replaces the readline shell's IO layer (`createRichIo`) while the deterministic driver (`runAgentTurn`) and pure render helpers remain unchanged. The module owns layout and composition (transcript box + split-footer composer), block navigation (modal Ctrl+O interface for toggling/copying), live markdown segmentation, and UI overlays (choice menus, approval gates, side-worker activity, wiki-enrich pickers). OpenTUI is an optional dependency loaded only via dynamic `import()` and guarded by the capability layer; the shell falls back to readline if absent or unsupported.

## How it works

The module is organized in three layers. The **shell backbone** (`tui-shell.ts`, ~2300 lines) implements the `AgentIO` and `ShellIO` hook surfaces and manages the OpenTUI renderer lifecycle. It delegates to pure render helpers from `src/lib` (`markdownToChunks` for prose, `collapseToolOutput`/`summarizeToolArgs` for tools) to keep the two shells (TUI and readline) structurally synchronized. The `/`-menu router filters command registry by prefix and shows an interactive `SelectRenderable` in the composer dock; the composer textarea handles submission and Ctrl+C cancellation. The **block model** (`transcript-blocks.ts`, ~1000 lines) is two independently testable layers: a pure registry (`createBlockRegistry`) that stores bounded, addressable blocks (id, kind, summary, fullText clipped to retention cap, collapse state, line count), and a render layer (`createBlockView`/`createSegmentView`) that paints each markdown segment inside a block as a separate framed `BoxRenderable` (prose via `markdownToChunks`, code/diff via structural frame + language tag + line classification). Stream segmentation is incremental: the trailing segment re-renders on each token; earlier segments freeze once their closing fence is seen, preventing O(n²) re-segmentation. The **supporting surfaces** (`worker-fleet.ts`, `side-worker.ts`, `composer-choice.ts`, `ask-user-bridge.ts`, `subagent-bridge.ts`) are pure state machines that own status formatting (fleet display), side-worker prompt construction, interactive choice UI, tool-bridge registration, and subagent event emission, respectively. All surfaces take OpenTUI as a parameter and never import it at top level, satisfying ADR-0005's lazy-capability contract.

## Key concepts

- **Block registry** — a pure state machine (`createBlockRegistry`) storing id, kind, summary, fullText (clipped to cap if oversized), collapse state, and line count. Blocks are never removed; only their `fullText` is evicted when bounded retention (64 blocks / 400 KB by default) is exceeded. Provides `register()`, `toggle(id)`, `focus(id)`, `focusNext()`/`focusPrev()`, and `bodyText(id)` (returns payload, truncation notice, eviction marker, or unknown-id marker — three distinct strings for caller logic).
- **Stream segmentation** — incremental, re-segmentable markdown parsing via `createStreamSegmenter`. Splits prose from fenced code/diff blocks; segments each part independently (one segment can be prose, the next code, the next prose again). Trailing segment is repainted on each token; earlier segments are frozen once their closing fence line arrives. Pure helper `segmentMarkdown` in `src/lib/md-blocks.ts` defines the `MdSegment` type and is shared with readline mode.
- **Block navigation mode** — a modal keyboard interface entered via Ctrl+O (composer blurs, newest block focused). ↑/↓ move focus (clamped), Enter/Space toggle collapse, y copies the focused block's fullText via OSC-52 + toast, Esc exits (restores composer focus and scroll offset). Guarded so it never fires while the `/`-menu is active or an approval/picker overlay is up.
- **Structural rendering** — prose via `markdownToChunks` (chunks with ANSI foreground/background/styles); code/diff via pure frame helpers (`blockLabel`, `classifyDiffLine`, `renderDiff`) that paint a language tag and line classes (add/del/hunk/meta/context for diffs) instead of spawning tree-sitter workers (ADR-0005 decision D-2). Shared with readline mode so the two cannot drift structurally.
- **Worker fleet** — a mutable registry (`WorkerFleet`) of main agent + subagent/side-worker entries (id, label, status, phase detail, provider/model). Status glyphs match `keryx agents monitor`: ◐ running, ● done, ✗ failed, ○ ready, ◼ blocked. Pure formatting (`formatFleetSidebar`, `humanFleetPhase`) converts status + phase into human-readable labels for the sidebar Activity panel; the sidebar subscribes to changes and repaints on upsert/remove.
- **Lazy capability** — `@opentui/core` is an optional dependency, loaded only via `await import()` inside `launchTuiAgentShell`, guarded by `src/capability/no-optional-imports`. The shell always takes `otui` as a parameter, never at top level. If the TTY check fails, the package is absent, or the renderer fails to initialize, `launchTuiAgentShell` returns `false` and the caller falls back to readline.

## Main flows

**Flow 1 — User invokes a `/`-command (e.g., `/help`)**
User types `/help` in the composer. On each keystroke, the `/`-menu router in `tui-shell.ts` detects the leading `/`, filters `AGENT_SLASH_COMMANDS` (from `src/commands/agent-commands.ts`) by prefix via `filterCommands`, and shows a `SelectRenderable` in the `dock` above the composer. User presses ↑/↓ to move the highlight, then Enter. `showComposerChoice` resolves the chosen option id, the menu is torn down, and `runLine` invokes the command handler (e.g., print help text) or inserts output into the transcript.

**Flow 2 — Streaming assistant response with segmented rendering**
Assistant message begins. `onAssistantText` is called incrementally. `write(token)` appends to a pending buffer. On each flush, `createStreamSegmenter` re-segments the partial markdown output via `segmentMarkdown`, emitting new/updated segments (prose, code, diff). For each segment, `createSegmentView` renders a separate `BoxRenderable`: prose via `markdownToChunks` (styled chunks), code via a framed box with language tag, diff via `renderDiff` (colorized lines with +/−/hunk classes). Only the trailing segment's renderable is re-painted on each token; earlier segments are frozen once their closing fence is detected. When `onAssistantText` finalizes the message, the container is added to the transcript and a new empty container is created for the next message.

**Flow 3 — User navigates and toggles tool output blocks (Ctrl+O flow)**
Tool result arrives. `onToolResult` calls `registry.register(block)` with kind="tool", summary (collapsed preview), and fullText (retained up to the cap). The block is displayed collapsed (`▸ tool (42 lines) · ctrl+o`). User presses Ctrl+O. `createBlockNavController.enter()` is called: the registry focuses the newest block, `stickyScroll` is disabled, the current scroll offset is saved. The focused block's header is highlighted. User presses ↓. `registry.focusNext()` moves focus to the next block; `paint()` updates the highlight. User presses Space. `toggle(id)` flips the collapse state. If expanding, `createBlockView` creates the body child renderable (prose/code/diff from `chunksFor`); if collapsing, the body is destroyed. User presses y. `copy(id)` retrieves `registry.bodyText(id)`, copies via OSC-52 escape sequence, and shows a toast. User presses Esc. `exit()` is called: composer regains focus, scroll offset is restored, `stickyScroll` is re-enabled.

**Flow 4 — Side worker answers user question while main agent is busy**
User types a question (e.g., "what's the latest commit?") while the main agent is in "running" phase. A side worker spawns with `buildSideWorkerPrompt`, which includes a snapshot (phase: "running", detail: "thinking", elapsed: 42.5s) and the recent conversation history (last 10 messages, truncated). The side worker runs headless (no shell exec, read-only tools). `setSubagentFleetListener` is wired before the TUI mounts, so `emitSubagentFleet` events (from the spawn_subagent tool) update `WorkerFleet` in real time: `{kind: "upsert", id: "d-123", label: "q&a", status: "running", phase: "querying"}`. The sidebar subscribes to the fleet and repaints with the new worker entry. When the side worker finishes, `{kind: "remove", id: "d-123"}` is emitted and the worker disappears from the panel.

---

## Reference (from code graph)

Extracted deterministically by `keryx wiki collect`; regenerated by
`--force`. The prose sections above are the agent/human-owned part.

### Public API

- `TuiSelection`
- `createTuiAgentIo`
- `BlockSink`
- `BlockIoChrome`
- `attachBlockIo`
- `isShellApproved`
- `ShellApprovalChoice`
- `WikiEnrichChoice`
- `fmtTokens`
- `COMPOSER_MIN_ROWS`
- `COMPOSER_MAX_ROWS`
- `composerHeightForLines`
- `estimateContextTokens`
- `selectBoxHeight`
- `KeypressEvent`
- `onKeypress`
- `launchTuiAgentShell`

### Key files

- `src/tui/tui-shell.ts` - imported by 2, imports 17
- `src/tui/tui-shell.test.ts` - imported by 0, imports 5
- `src/tui/transcript-blocks.ts` - imported by 3, imports 1
- `src/tui/ask-user-bridge.ts` - imported by 2, imports 0
- `src/tui/side-worker.ts` - imported by 2, imports 0
- `src/tui/subagent-bridge.ts` - imported by 2, imports 0

### Depends on

- `src/lib` - 6 import(s)
- `src/commands` - 6 import(s)
- `src/harness/tool/builtin` - 1 import(s)
- `src/harness/provider` - 1 import(s)
- `src/session` - 1 import(s)
- `src/wiki` - 1 import(s)

### Depended on by

- `src/commands` - 2 import(s)
- `src/harness/tool/builtin` - 1 import(s)

### Graph signals

- Files: 11
- Cross-module imports: 16

## Related Wiki

Graph-derived - regenerated by `keryx wiki collect --force`. Only pages that
exist are linked; when enriching, add new links only to pages you have verified.

- [Wiki Index](../index.md)
- [Module src/lib](src-lib.md)
- [Module src/commands](src-commands.md)

## Changelog

- 1.0.0 - Prose sections enriched by gdwiki enrich workflow. Verified against tui-shell.ts, transcript-blocks.ts, specification.md, ADR-0005, and supporting modules.
- 0.1.0 - Generated by `keryx wiki collect` at 2026-07-21T18:34:17.412Z. Prose sections are drafts for the gdwiki enrich workflow.
