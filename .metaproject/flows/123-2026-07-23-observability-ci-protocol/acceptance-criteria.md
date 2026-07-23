# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: `.github/workflows/ci.yml` defines the four protocol jobs named exactly `typecheck-and-tests`, `standard-baseline`, `standard-pr`, and `metrics-contract`; `standard-pr` declares `needs: standard-baseline`.
- AC2: `standard-baseline` checks out `main` independently (actions/checkout with `ref: main`), runs `standard validate`, and exposes the measured result as a job output; the capture step does NOT hard-fail the job when main is red (a red baseline is data, not a job failure).
- AC3: `standard-pr` runs `standard validate` on the PR checkout and then invokes `keryx standard baseline --baseline <main-status> --pr <pr-status>` using the baseline job's output as the `--baseline` value; that classification step's exit code determines the job.
- AC4: `metrics-contract` runs the observability contract tests (src/metrics/service.test.ts, src/lib/git-hooks.test.ts, src/lib/templates.test.ts); all three are green locally.
- AC5: the three pre-existing unrelated jobs (`tui-pty-launch`, `linux-sandbox`, `opentui-native-matrix`) are preserved unchanged; the security eval gate is retained (in `typecheck-and-tests`); no existing coverage is dropped.
- AC6: `ci.yml` is valid YAML (parses cleanly); every CLI command and test path the workflow references exists; `standard validate` and the metrics-contract tests pass locally. (Actual green GitHub Actions run is observable only post-push and is explicitly out of local scope.)
- AC7: the deferred items (paired benchmark execution; branch-protection required-check renaming) are recorded in journal.md with rationale.
