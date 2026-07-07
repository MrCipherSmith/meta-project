# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `gd-metapro flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `gd-metapro flow ac confirm <id> <ACn>`.

These consolidate the block's AC0-1 … AC0-24 (docs/requirements/roadmap-2026/00-capability-seam/acceptance-criteria.md).

## Criteria

- AC1: `package.json` `dependencies` is empty; every new runtime lib appears only under `optionalDependencies`; a static scan finds NO top-level import of any optional dep in `src/` (each loaded only via `await import` inside its adapter); no install hook downloads anything. [AC0-1, AC0-2, AC0-18]
- AC2: With zero opt-in flags set and no assets present, every default command and the full pre-existing test suite behave byte-identically to baseline — no optional dependency loaded, no socket opened. This is the package-wide golden-rule gate. [AC0-3, AC0-22, AC0-24]
- AC3: `resolveCapability(cwd, spec)` returns an `Adapter` only when the capability is manifest-enabled AND its optional dep is importable AND its asset resolves; otherwise `null`. It NEVER throws, and an adapter that throws at `isAvailable()`/`run()` is caught so the caller still receives the deterministic result. [AC0-4, AC0-5, AC0-8, AC0-11]
- AC4: A capability enabled but with its dep not installed / asset missing / checksum failing warns exactly once to stderr (per invocation, regardless of call-site count), runs the deterministic fallback, and exits 0. [AC0-6, AC0-7]
- AC5: Capability config loaders deep-merge partial user config over defaults and fall back to defaults on malformed JSON without throwing; enable/disable is read from `metaproject.json`; a missing manifest = capability off. [AC0-10, AC0-11]
- AC6: `init` offers `--<cap>`/`--no-<cap>` (default OFF) and writes the capability into `modules.<m>.capabilities[]` + module config; `update` reconciles a newly-added capability without disabling already-enabled modules; `extractCapabilities` reads the enriched object shape and the bare-string form. [AC0-12]
- AC7: The Asset Resolver obtains assets only from a user-config path, an explicit `assets pull <id>`, or the user cache; verifies sha256 on every load and returns `null` (→ fallback) on missing/tampered; `assets pull` refuses on checksum mismatch (no file written); network occurs ONLY inside `assets pull`; `.metaproject/assets.lock.json` (id/version/url/sha256/size) is committed. [AC0-13, AC0-14, AC0-15, AC0-16, AC0-17]
- AC8: `runCorpus(dir, detect)` loads a committed `fixtures/<corpus>/`, runs a detector, and produces a deterministic report (fnRate/precision/recall) with an empty re-run diff; `gateCorpus(report, {maxFnRate})` returns fail (non-zero) on FN-rate regression and pass otherwise; the harness accepts a block's corpus with no per-block code. [AC0-19, AC0-20, AC0-21]
- AC9: A non-shipping reference capability is wired end-to-end (dep-import + asset-resolve + deterministic fallback) with BOTH an availability-true test (dep/asset stubbed) and an availability-false fallback test; the deterministic path is first-class and tested. [AC0-9, AC0-23]
- AC10: `bun run check` (typecheck + full suite) passes with the 159 pre-existing tests unchanged; a no-network sandbox test confirms every default command succeeds with no socket opened. [AC0-24 + suite]
