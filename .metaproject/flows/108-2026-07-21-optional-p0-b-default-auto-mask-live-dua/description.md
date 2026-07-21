# Optional P0.b default auto-mask + live dual-axis + UX

## Problem

After P0–P2, the product still defaults to P0.a `maskMode=manual` when env,
project policy, and global `sandbox.json` are all unset. Operators must
explicitly opt into auto-mask. Live dual-axis remains runbook-only without a
flag-gated smoke path.

## Expected outcome

1. **Track A (P0.b):** Built-in default becomes `auto` when fully unset.
   Explicit `manual` via env or file still wins. Docs explain how to restore P0.a.
2. **Track B:** Flag-gated live dual-axis smoke (`KERYX_DUAL_AXIS_LIVE=1`);
   default CI does not run it. Redaction fails if secrets leak into RUN_DIR/REPORT.
3. **Track C:** Light UX note (resolution order, auto default, keys via `/connect`);
   launch-prompts README updated. Optional read-only defaults show is docs-only
   if CLI surface is too large.

## Out of scope

- New mask algorithms or providers
- Making OS sandbox shell default-on
- Forcing live dual-axis green on every CI job
- P3 features

## Standing rule

When green: commit, PR, merge to main. Optional tail only; core P0–P2 already done.
