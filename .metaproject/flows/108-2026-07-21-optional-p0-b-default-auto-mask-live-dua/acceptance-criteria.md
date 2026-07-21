# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: With fully unset mode (no env, empty project policy, empty global file), resolveMasksFromSandboxEnv uses maskMode auto (P0.b / AC-O1).
- AC2: Explicit manual (env or file) still forces manual; regression tested (AC-O2).
- AC3: Migration/docs explain how to get P0.a behavior back via maskMode manual in sandbox.json or KERYX_SANDBOX_MASK_MODE=manual (AC-O3).
- AC4: Live dual-axis path exists and is off on default CI (flag-gated KERYX_DUAL_AXIS_LIVE=1) (AC-O4).
- AC5: Live or dry-run path fails overall when secret substring appears in RUN_DIR/REPORT artifacts (AC-O5).
- AC6: No secrets in committed fixtures; zero new runtime npm deps (AC-O6).
- AC7: Order still env > project > global > built-in (now auto); project and global still override correctly after default flip (AC-O7).
