# Implement Block 0: Capability Seam (opt-in adapter seam + Asset Resolver + fixture harness)

Status: formalized
Source: docs/requirements/roadmap-2026/00-capability-seam/ (the block's PRD/spec/AC/tasks are the authoritative source)

## Problem

Blocks A–E of the 2026 roadmap add optional model/precision features (MCP SDK, tree-sitter, embeddings, Prompt Guard 2, NER). gd-metapro's core must stay **zero-runtime-dependency, zero-network, deterministic, git-diffable**. Today there is no uniform mechanism to add an opt-in feature that (a) keeps the default install dep-free, (b) degrades gracefully when a dep/asset is absent, and (c) never breaks or changes default behavior. Block 0 builds that foundation once, centrally, so A–E instantiate it instead of each inventing its own.

## Expected Outcome (Block 0 spec §§, tasks T1–T18)

- `src/capability/` — `CapabilitySpec` + `CapabilityAdapter` + `resolveCapability(cwd, spec) → Adapter | null` (gates on manifest-enabled AND dep-importable via lazy `await import` AND asset-resolved; **never throws**; adapter errors caught → deterministic result), + a process-scoped **warn-once** helper.
- Dependency policy: `package.json` `dependencies` stays **empty**; opt-in libs only under `optionalDependencies`; **no top-level import** of any optional dep in `src/`; no install-hook download.
- `src/assets/` — Asset Resolver (`resolveAsset` from user-path / `assets pull` / user cache; **sha256 verified on every load**, `null` on missing/tampered; **network only inside `assets pull`**), committed `assets.lock.json`, uniform `assets list|verify|pull <id>` subcommand.
- `src/harness/` — `runCorpus` + `gateCorpus` (deterministic FN/precision/recall report + FN-rate CI gate) usable by any block's fixture corpus without per-block code; seed corpora.
- `init`/`update` wiring: uniform `--<cap>`/`--no-<cap>` flags (default OFF), `modules.<m>.capabilities[]` + config (deep-merge, malformed-JSON fallback), `update` reconciles without disabling enabled modules; `extractCapabilities` reads the enriched shape + bare-string form.
- One throwaway **reference capability** exercising the full path (dep-import + asset-resolve + fallback) with availability-true/false tests.
- **Golden rule (AC0-22):** with zero opt-in flags and no assets, the full existing suite + every default command behave byte-identically to today — no new dep loaded, no socket opened. `bun run check` green; `standard validate` PASS.

## Out of Scope

- Any end-user feature of Blocks A–E (the reference capability is non-shipping).
- Concrete tree-sitter/embedding/Prompt Guard adapters (they land in A/B/C/E on top of this seam).
- Changing existing module behavior beyond the additive init/update capability wiring.
