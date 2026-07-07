# Implementation Plan

Status: ready

## Approach

Generalize the existing `security.backends` idiom into a project-wide Capability
Seam, following the block spec's task graph (T1–T18). Build the seam + warn-once,
then the dependency policy, the Asset Resolver, the fixture harness, the init/update
wiring, and finally a throwaway reference capability that exercises the whole path
— gated by the package-wide golden-rule test. Everything is additive; the
deterministic default path is a first-class, tested code path. No end-user feature
ships in this block.

## Steps (grouped from spec T1–T18)

1. **T2 — Seam core.** `src/capability/seam.ts` (`CapabilitySpec`, `CapabilityAdapter`,
   `resolveCapability` → Adapter|null, never-throws) + `src/capability/warn-once.ts`
   (process-scoped, once per invocation) + unit tests. [spec T1–T4]
2. **T5 — Dependency policy.** `package.json` `dependencies` stays empty; declare
   first-wave optional libs under `optionalDependencies`; add a guard/lint that
   fails on any top-level import of an optional dep; no install-hook download. [spec T5]
3. **T6 — Asset Resolver.** `src/assets/{resolver,lock,pull}.ts` (user-path/pull/cache;
   sha256 every load → null on missing/tampered; network ONLY in `pull`) + committed
   `.metaproject/assets.lock.json` + `assets list|verify|pull <id>` subcommand + tests. [spec T7–T9]
4. **T7 — Fixture harness.** `src/harness/{corpus,gate}.ts` (`runCorpus`/`gateCorpus`,
   deterministic FN/precision/recall + FN-rate gate) usable without per-block code +
   two seed corpora + self-test. [spec T10–T11]
5. **T8 — init/update wiring.** Uniform `--<cap>`/`--no-<cap>` (default OFF),
   `modules.<m>.capabilities[]` + config (deep-merge + malformed-JSON fallback),
   `extractCapabilities` enriched-shape read, `update` reconciliation preserving
   enabled modules + integration tests. [spec T12–T14]
6. **T9 — Reference capability + golden-rule gate.** Wire one non-shipping reference
   capability end-to-end (dep-import + asset-resolve + fallback) with availability
   true/false tests; the package-wide golden-rule + no-network sandbox test. [spec T15–T17]
7. **T3 — Tests consolidation.** Ensure every AC has a test; `bun run check` green;
   the 159 pre-existing tests unchanged.
8. **T10 — Docs.** Mark Block 0 landed in roadmap.md / roadmap-2026/README; note A–E
   may now instantiate the seam. [spec T18]
9. **T4 — Review + PR.** Adversarial review focused on the golden rule.

## Risks

- **Golden-rule regression (top risk):** any top-level optional import, or any default
  command whose output/behavior changes, breaks the zero-dep/byte-identical guarantee.
  Mitigation: the static-scan guard (T5) + the package-wide byte-identical + no-network
  sandbox test (T9) are hard gates; run the full existing suite unchanged.
- **Never-throw discipline:** `resolveCapability` and adapters must catch ALL errors
  (dep import failure, asset I/O, adapter run). Fault-injection tests required.
- **Network leak:** only `assets pull` may open a socket. No-network sandbox test asserts
  no socket on any default command.
- **First optionalDependency:** ensure `bun install` without optionals still works and
  the guard/lint runs in CI.
- **Scope creep:** no A–E adapters; reference capability is throwaway.
