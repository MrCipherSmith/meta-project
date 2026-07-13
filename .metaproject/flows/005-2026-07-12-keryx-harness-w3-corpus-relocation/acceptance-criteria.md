# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: The four evaluator files are relocated `src/harness/` → `src/eval/` (corpus.ts, gate.ts, corpus.test.ts, block-d-corpora.test.ts) using `git mv` so git records renames (history preserved); after the move `src/harness/` contains no corpus/gate evaluator files.
- AC2: The sole external importer `src/security/detect/mcp.test.ts` imports from `src/eval/*`; a repository search confirms no code under `src/` still references `src/harness/corpus` or `src/harness/gate`; internal relative imports inside the moved files are unchanged (same directory depth).
- AC3: The corpus gates stay green — `bun test src/eval/corpus.test.ts src/eval/block-d-corpora.test.ts src/security/detect/mcp.test.ts` passes, and the full `bun test` suite equals the pre-move baseline of 554 pass / 0 fail; `tsc --noEmit` is clean.
- AC4: Live docs (`docs/docs/architecture.md`, `docs/docs/modules.md`, `fixtures/README.md`) reference `src/eval/` instead of `src/harness/` for the evaluator; the frozen requirements package (`docs/requirements/keryx-project-agent-harness/`) and `ADR-0001` are NOT modified; ADR-0001 OPEN-4 is resolved (direct rename) in a new `docs/decisions/keryx-harness/EV-01-corpus-relocation.md`.
- AC5: No behavior change — `runCorpus`/`gateCorpus` output is identical to pre-move; a compatibility map records every moved file and every changed import, and no other reference to the relocated evaluator remains in code.
