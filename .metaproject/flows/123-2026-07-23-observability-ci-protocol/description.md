# execution-observability: wire the CI 4-job protocol

Status: formalized
Source: user description + audit (AC-7 PARTIAL)

## Problem

The keryx-execution-observability runtime is implemented, but the documented CI
Protocol (docs/requirements/keryx-execution-observability/ci-protocol.md) is NOT
wired into `.github/workflows/ci.yml`. Today a single combined `check` job runs
`bun run check` + `standard validate` + security eval on the PR checkout only.
There is no independent `main` baseline validation feeding
`keryx standard baseline`, so the classification logic (baseline-green /
baseline-red / baseline-unknown) exists in code but is never exercised by CI.

## Expected Outcome

`.github/workflows/ci.yml` implements the four documented jobs:
1. `typecheck-and-tests` — `bun run check` (+ the existing security eval gate).
2. `standard-baseline` — checks out **main** independently, runs
   `standard validate`, and exposes its pass/fail as a job output.
3. `standard-pr` — runs `standard validate` on the PR, then calls
   `keryx standard baseline --baseline <main-status> --pr <pr-status>` to classify
   (classification-only; CI owns the measured statuses).
4. `metrics-contract` — runs the schema/provenance/latest-pointer/hook/
   lightweight-mode tests (src/metrics/service.test.ts, src/lib/git-hooks.test.ts,
   src/lib/templates.test.ts).

The three unrelated existing jobs (`tui-pty-launch`, `linux-sandbox`,
`opentui-native-matrix`) are preserved unchanged. YAML is valid; every command and
test path the workflow references exists and passes locally.

## Out of Scope (deferred; journaled)

- **Actually running a paired Keryx/no-Keryx benchmark** (audit AC-10): that is a
  measurement activity, not code; the harness/template is already shipped and the
  roadmap status is "benchmark harness ready". Deferred.
- **Branch-protection required-check renaming**: splitting `check` into new job
  names changes the required-status-check names in GitHub branch protection, which
  is repo-admin configuration this flow cannot change. Called out in journal.
