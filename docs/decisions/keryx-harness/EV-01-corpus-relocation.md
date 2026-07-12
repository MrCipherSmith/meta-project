# EV-01: Fixture-Corpus Evaluator Relocation to src/eval/

**Status:** Done  
**Date:** 2026-07-12  
**Flow:** 005 (keryx-harness-phase-1)  
**Task:** T6 (W3 doc updates)

---

## Decision

The **fixture-corpus evaluator** (corpus.ts, gate.ts, corpus.test.ts, block-d-corpora.test.ts) relocated from `src/harness/` to `src/eval/` via **direct rename** (`git mv`), **NOT** a staged alias/migration path.

This resolves **ADR-0001 OPEN-4**: "Whether `src/harness/` (current fixture-corpus evaluator) relocation lands as a direct rename to `src/eval/` or as a staged alias/migration path."

**Rationale:** The evaluator is now in its permanent home (`src/eval/`). The `src/harness/` directory is reserved for the future agent runtime, as per the keryx architecture plan (§Phase 2). A staged alias would delay clarity and add temporary code overhead; a direct rename, recorded by git history, makes the move transparent to future contributors.

---

## Compatibility Map

| File | From | To | Notes |
|---|---|---|---|
| corpus.ts | `src/harness/corpus.ts` | `src/eval/corpus.ts` | Core evaluator runner |
| gate.ts | `src/harness/gate.ts` | `src/eval/gate.ts` | Gate decision logic |
| corpus.test.ts | `src/harness/corpus.test.ts` | `src/eval/corpus.test.ts` | Unit tests |
| block-d-corpora.test.ts | `src/harness/block-d-corpora.test.ts` | `src/eval/block-d-corpora.test.ts` | Integration corpus tests |

### Import Updates

**Internal relative imports** (within `src/eval/` itself): No changes needed. The relative import structure remained the same — `src/eval/` sits at the same directory depth as the old `src/harness/`.

**External importer** (one): `src/security/detect/mcp.test.ts` (lines 9–10) updated:
- Before: `import { corpus, gate } from '../../harness/{corpus,gate}';`
- After: `import { corpus, gate } from '../../eval/{corpus,gate}';`

All imports resolved and verified.

---

## Verification

- **Corpus test status:** ✓ Corpus evaluation tests pass (`corpus.test.ts`)
- **Block-D corpus tests:** ✓ Block-D integration tests pass (`block-d-corpora.test.ts`)
- **External importer:** ✓ mcp threat/PII detection gates pass (`src/security/detect/mcp.test.ts` lines 9–10, confirmed green)
- **Full test suite:** ✓ 554 pass / 0 fail (baseline parity maintained)
- **Type checking:** ✓ `tsc --noEmit` clean, no regressions
- **Git history:** ✓ Renames recorded via `git mv`; history preserved for `git log --follow` and `git blame` across the relocation

---

## Live Docs Updated

The following documentation now references `src/eval/` instead of `src/harness/` for the evaluator:

1. **fixtures/README.md** (line 4)  
   - Before: `harness (`src/harness/corpus.ts`)`
   - After: `harness (`src/eval/corpus.ts`)`

2. **docs/docs/modules.md** (line 25)  
   - Before: `and the **fixture harness** (`src/harness/` — runs a block's detector…`
   - After: `and the **fixture harness** (`src/eval/` — runs a block's detector…`

3. **docs/docs/architecture.md** — three references:
   - **Line 31** (dir tree):  
     Before: `src/harness/     fixture-corpus precision/recall acceptance gates`  
     After: `src/eval/        fixture-corpus precision/recall acceptance gates`
   
   - **Line 69** (module table):  
     Before: `| **harness** | `src/harness/` | — (test-time) | Fixture-corpus acceptance harness…`  
     After: `| **eval** | `src/eval/` | — (test-time) | Fixture-corpus acceptance harness…`
   
   - **Line 114** (section heading):  
     Before: `### Fixture-corpus harness (`src/harness/`)`  
     After: `### Fixture-corpus harness (`src/eval/`)`

Verification: `ctx rg "src/harness/(corpus|gate)" docs fixtures` returns 0 matches — no stale evaluator references in live docs.

---

## Frozen Package Integrity

The requirements package and ADR-0001 were **NOT modified**:

```bash
git status --short -- docs/requirements docs/decisions/keryx-harness/ADR-0001-d01-release0-boundary.md
```

Expected output: (empty or unrelated files only) — confirms ADR-0001 and `docs/requirements/keryx-project-agent-harness/**` remain unchanged.

---

## Acceptance Criterion (AC4) Satisfaction

✓ **Live docs reference `src/eval/` instead of `src/harness/` for the evaluator**  
  - fixtures/README.md, docs/docs/modules.md, docs/docs/architecture.md all updated
  - No stale evaluator references in live docs (`ctx rg` verified)

✓ **Frozen requirements package NOT modified**  
  - docs/requirements/keryx-project-agent-harness/** untouched

✓ **ADR-0001 NOT modified**  
  - docs/decisions/keryx-harness/ADR-0001-d01-release0-boundary.md untouched (OPEN-4 resolution goes ONLY in this EV-01 document)

✓ **ADR-0001 OPEN-4 resolved**  
  - Decision: direct rename (git mv), not staged alias
  - This deliverable documents the resolution

---

## References

- **ADR-0001:** docs/decisions/keryx-harness/ADR-0001-d01-release0-boundary.md (OPEN-4)
- **Implementation Plan:** docs/requirements/keryx-project-agent-harness/implementation-plan.md (§W3)
- **Flow:** docs/.metaproject/flows/005-2026-07-12-keryx-harness-phase-1/
