# Tasks — Flow 005 (W3 EV-01 corpus relocation)

Task definitions live here; task **statuses** live in flow.json and are managed
only via `keryx flow task done <id> <taskId>`.

Scope: **only W3 / EV-01** (implementation-plan.md §W3). Pure relocation +
compatibility. No behavior change, no other wave.

| ID | Kind | Model | Title / definition |
|----|------|-------|--------------------|
| T1 | context | Haiku | Compat-map + baseline (554/0 green) — done in context.md. |
| T2 | implement | — | Umbrella: implement per plan (closed when T5 done). |
| T3 | test | — | Umbrella: gates green before/after (no new tests; existing corpus/Block-D are the net). |
| T4 | review | — | Umbrella: self-review + completion prep (closed when T7 + completion done). |
| T5 | implement (EV-01) | Opus | `git mv` corpus.ts/gate.ts/corpus.test.ts/block-d-corpora.test.ts `src/harness/`→`src/eval/`; fix `src/security/detect/mcp.test.ts` imports (lines 9-10 → `../../eval/*`); run corpus+Block-D+mcp + full `bun test` (554/0) + `tsc --noEmit` green; confirm `src/harness/` freed & `git status` shows renames. |
| T6 | docs | Haiku | Update `fixtures/README.md`, `docs/docs/modules.md`, `docs/docs/architecture.md` (`src/harness`→`src/eval`); create `docs/decisions/keryx-harness/EV-01-corpus-relocation.md` (compat-map + OPEN-4 resolved = direct rename). Do NOT edit frozen requirements pkg or ADR-0001. |
| T7 | review | Opus | code-verifier (`tsc --noEmit` + full `bun test` = 554/0); `ctx rg` proves no `src/harness/{corpus,gate}` importer remains; git proves frozen requirements pkg untouched; corpus gates green; compat-map accurate. |
