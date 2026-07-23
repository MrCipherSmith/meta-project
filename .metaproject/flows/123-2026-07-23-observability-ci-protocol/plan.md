# Implementation Plan

Status: formalized

## Approach

Rewrite `.github/workflows/ci.yml` to split the single `check` job into the four
protocol jobs, using GitHub Actions **job outputs** to carry the independently
measured main baseline status into the PR classification step. Keep the three
unrelated jobs verbatim.

- **typecheck-and-tests**: `bun install` + `bun run check` + the existing
  `security eval --corpus all` gate (moved here so nothing is lost).
- **standard-baseline**: `actions/checkout@v4` with `ref: main`, `bun install`,
  run `bun ./src/cli.ts standard validate`; capture exit status into a job output
  `status: pass|fail` (use a step that never hard-fails the job — the baseline may
  legitimately be red, which is data, not a job failure).
- **standard-pr** (`needs: standard-baseline`): checkout the PR, `standard
  validate` → pr status, then `keryx standard baseline --baseline
  ${{ needs.standard-baseline.outputs.status }} --pr <pr-status>`. This step's
  exit code decides the job (classification-only; CI owns both measured statuses).
- **metrics-contract**: `bun test src/metrics/service.test.ts
  src/lib/git-hooks.test.ts src/lib/templates.test.ts`.

Trade-off: cannot execute GitHub Actions locally, so verification is (a) YAML
validity via a parser, (b) every referenced CLI command + test file exists and is
green locally, (c) the three preserved jobs are byte-identical. Actual green CI is
observable only post-push — explicitly acknowledged, not hidden.

## Steps

1. Confirm the metrics-contract test set is green locally (baseline).
2. Rewrite ci.yml into the 4 jobs + preserved jobs (task-implementer).
3. Validate YAML parses; assert preserved jobs unchanged; run the referenced
   tests + `standard validate` locally.
4. Review the workflow (job outputs wiring, baseline never-hard-fail step).
5. Journal deferred items (benchmark run; branch-protection rename).

## Risks

- Job-output wiring bugs (a step that hard-fails on a red baseline would break the
  protocol's intent). Mitigated by a dedicated non-failing capture step + review.
- Required-status-check name drift in branch protection — documented, admin-owned.
