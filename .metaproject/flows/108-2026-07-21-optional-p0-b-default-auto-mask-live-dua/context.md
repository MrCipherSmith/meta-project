# Context — flow 108

## Package

`docs/requirements/keryx-sandbox-credential-auto-mask/`

## Baseline (do not reimplement)

| Phase | Status |
|-------|--------|
| P0 mask-resolve + shell/harness | PR #175 |
| Verify dual-axis-report | PR #176 |
| P1 global sandbox.json | PR #177 |
| P2 project policy + init | PR #178 |
| Default today | unset → **manual** (P0.a) |

## Key code

- `src/harness/process/sandbox/mask-resolve.ts` — `resolveMasksFromSandboxEnv` built-in `mode = "manual"`
- `src/harness/process/sandbox/mask-resolve.test.ts` — P0.a assumptions
- `src/harness/process/sandbox/dual-axis-report.ts` — REPORT + redaction helpers
- `src/lib/sandbox-config.ts` — global defaults load/save
- `src/lib/project-sandbox-policy.ts` — project policy + init skeleton

## Resolution order (unchanged)

CLI override → env → project policy → global sandbox.json → **built-in** (flip to auto)

## Verification

- Unit: always
- Live dual-axis: `KERYX_DUAL_AXIS_LIVE=1` only (see verification.md)
- No secrets in fixtures; zero new npm deps
