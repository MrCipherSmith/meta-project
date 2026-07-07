# Tasks

Task definitions live here; task **statuses** live in flow.json and are managed
only via `gd-metapro flow task done <id> <taskId>`.

Maps the block spec's T1–T18 (docs/requirements/roadmap-2026/00-capability-seam/tasks.md)
onto flow task units.

| ID | Kind | Title | Spec tasks | Satisfies |
|----|------|-------|-----------|-----------|
| T1 | context | Study `security.backends`/`standard.capabilities`/init seams (done Phase 1) | T1 | — |
| T2 | implement | Seam core: `src/capability/seam.ts` + `warn-once.ts` (resolveCapability→Adapter\|null, never-throws) + unit tests | T2–T4 | AC3, AC4 |
| T5 | implement | Dependency policy: empty `dependencies`, optionalDependencies, no-top-level-import guard, no install-hook download | T5 | AC1 |
| T6 | implement | Asset Resolver: `src/assets/*` + `assets.lock.json` + `assets list\|verify\|pull` + tests | T7–T9 | AC7 |
| T7 | implement | Fixture harness: `src/harness/*` (runCorpus/gateCorpus) + seed corpora + self-test | T10–T11 | AC8 |
| T8 | implement | init/update wiring: capability flags + `modules.<m>.capabilities[]` + config + reconcile + tests | T12–T14 | AC5, AC6 |
| T9 | implement | Reference capability end-to-end + package-wide golden-rule + no-network gate | T15–T17 | AC2, AC9, AC10 |
| T3 | test | Consolidate: every AC has a test; `bun run check` green; 159 pre-existing tests unchanged | — | AC10 |
| T10 | docs | Mark Block 0 landed in roadmap.md / roadmap-2026/README; note A–E may instantiate the seam | T18 | — |
| T4 | review | Adversarial review (golden-rule/never-throw/network focus) + code-verifier + draft PR | — | AC10 |

## Notes
- **Golden rule is the block-completion gate:** T9's package-wide byte-identical + no-network test (AC2/AC10) must be green.
- Deterministic path is a first-class TESTED path everywhere (availability-false tests).
