# Acceptance Criteria — flow 080 (persist provider/model/key)

- AC1: A `src/lib/shell-config.ts` module reads/writes `~/.local/share/keryx/auth.json` (mode 0600, owner-only) with `{provider, model, baseUrl?, openrouterKey?}` — opencode-style. `loadShellConfig`/`saveShellConfig` (merge semantics) are best-effort (never throw) and unit-tested (temp dir, 0600, malformed → {}).
- AC2: On the TUI startup path, a saved OpenRouter key populates `process.env.OPENROUTER_API_KEY` (unless already set); a saved provider+model become the default `initial` selection (no picker) when no `--provider` flag is given.
- AC3: Entering the OpenRouter key in the TUI persists it (`saveShellConfig({openrouterKey})`); resolving the provider/model selection persists it (`saveShellConfig({provider,model,baseUrl?})`). The key prompt note states where it is saved.
- AC4: `bunx tsc --noEmit` clean; `bun test` green with no reduction from baseline (1511) + new shell-config tests. No new dependency. The key is written owner-only, never logged. `/connect` + `/model` (switch on the fly) are flow 081.
