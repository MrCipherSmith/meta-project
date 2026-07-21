# Launch prompt — P2 Project policy + init skeleton (flow-orchestrator)
Version: 0.1.0

**Prerequisite:** P0 (#175), Verify (#176), P1 landed on main.

Copy the fenced block into a flow-orchestrator session. One phase only.

---

```text
Run flow-orchestrator for ONE phase only: P2 project sandbox policy + init skeleton.

## Metaproject hard gate
Project root: keryx worktree (prefer clean main).
Read `<project-root>/.metaproject/index.md` before any repo action.
Never edit flow.json by hand. All flow state: `keryx flow …` CLI only.

## Standing operator rule
When green: commit phase deliverables and push/merge to main.
Then stop — pipeline complete for sandbox auto-mask package (unless P0.b requested).

## Intent
Implement **P2 only** of Sandbox Credential Auto-Mask:

Package: docs/requirements/keryx-sandbox-credential-auto-mask/
Read: specification.md (project policy), schemas/project-sandbox-policy.schema.json,
implementation-plan.md Phase P2, policies.md P-INIT-1 / P-RES-1, README.

## Baseline (do not reimplement)
- P0 mask-resolve + shell/harness
- Verify dual-axis helpers
- P1 sandbox.json global defaults (env > global file > built-in)

## P2 deliverables
1. Optional project policy file (recommended path `.keryx/sandbox-policy.json`)
   — maskMode, extraMasks (NAME@host only), allowedDomains, tlsTerminate preference.
   NEVER store API key values.
2. Loader with project root discovery (git root / cwd consistent with sessions).
3. Merge into resolution order: env > project policy > global sandbox.json > built-in.
   extraMasks → explicitSpecs before resolve.
4. keryx init writes policy skeleton + short next-steps note pointing to `/connect` for keys.
5. Unit tests AC13; docs: keys via /connect only.
6. Update package README: P2 landed.

## Frozen AC
- AC-P2-1: missing project policy → no change vs P1 behavior
- AC-P2-2: project extraMasks merge as explicit masks
- AC-P2-3: env still overrides project and global
- AC-P2-4: policy file cannot store/load secret values
- AC-P2-5: init scaffold has no keys; comments only
- AC-P2-6: resolution order documented and unit-tested

## Out of scope
P0.b default=auto · new mask algorithms · live dual-axis changes

## Done report
flow id, files, tests, commit/PR, pipeline status
```
