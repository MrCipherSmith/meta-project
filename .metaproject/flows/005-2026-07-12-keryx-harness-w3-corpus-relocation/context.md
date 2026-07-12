# Context — Flow 005 (W3 EV-01 corpus relocation)

Collected by `keryx flow init` and enriched for W3. (T1 context.)

## Baseline (pre-move, verified green)

- `bun test src/harness/corpus.test.ts src/harness/block-d-corpora.test.ts src/security/detect/mcp.test.ts` → 15 pass / 0 fail.
- Full `bun test` → 554 pass / 0 fail (121 files).
- Branch `feature/keryx-harness-impl` @ 99952a5.

## Files to move (git mv — history preserved)

| From | To |
|---|---|
| `src/harness/corpus.ts` | `src/eval/corpus.ts` |
| `src/harness/gate.ts` | `src/eval/gate.ts` |
| `src/harness/corpus.test.ts` | `src/eval/corpus.test.ts` |
| `src/harness/block-d-corpora.test.ts` | `src/eval/block-d-corpora.test.ts` |

`src/eval/` does not yet exist; `git mv` creates it. `src/harness/` empties → reserved for W5+ runtime.

## Import analysis (KEY: internal imports do NOT change)

`src/eval/` is the same depth as `src/harness/` (both direct children of `src/`),
so every relative import inside the moved files resolves identically:
- `corpus.ts` → `../lib/fs` ✓ (still `src/lib/fs`)
- `gate.ts` → `./corpus` ✓
- `corpus.test.ts` → `./corpus`, `./gate`, and `import.meta.url` + `..`,`..` → repo-root `/fixtures` ✓
- `block-d-corpora.test.ts` → `./corpus`, `./gate`, `../health/source-analysis`, `../health/metrics/hotspot`, `../testing/coverage-map`, `../testing/types`, `../../fixtures/churn-complexity/churn.json`, `import.meta.dir`+`..`,`..` ✓

### External importer (the ONLY code edit)
`src/security/detect/mcp.test.ts`:
- line 9: `../../harness/corpus` → `../../eval/corpus`
- line 10: `../../harness/gate` → `../../eval/gate`
Verified via `ctx rg`: no other importer of `harness/{corpus,gate}` in `src/`.

## Live docs to update (`src/harness` → `src/eval`)

- `fixtures/README.md:4` (`src/harness/corpus.ts`)
- `docs/docs/modules.md:25` (fixture harness `src/harness/`)
- `docs/docs/architecture.md` lines 31, 69, 114

## Frozen — DO NOT edit (already describe the move as intended)

- `docs/requirements/keryx-project-agent-harness/{README,specification,implementation-plan,implementation-prompt}.md`
- `docs/decisions/keryx-harness/ADR-0001-*.md` (OPEN-4 resolution recorded in new EV-01 deliverable instead).

## Deliverable for OPEN-4 resolution

`docs/decisions/keryx-harness/EV-01-corpus-relocation.md` — compat-map + "OPEN-4 resolved: direct rename".

## Operational

- keryx CLI = `bun ./src/cli.ts`. Worktree @ 99952a5; never commit to main.
- State only via `keryx flow`; workers via subagent-dispatch/result.
- gdgraph index (`keryx gdgraph build`) is generated data — optional refresh after, out of commit scope.
