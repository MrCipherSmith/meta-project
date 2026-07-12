# Project Audit Remediation Plan — 2026-07-13
Version: 1.0.0

## P0 — close security/control-plane gaps

- [ ] Constrain MCP resources by real path, reject symlink escapes, require
  listed resources, and pass every resource payload through `redactRaw`.
  Evidence: traversal/symlink/secret-resource regression tests.
- [ ] Make `needs-approval` block an enforced/CI flow until an explicit,
  flow-bound approval record exists.
- [ ] Bind security completion evidence to the flow/commit range; missing or
  stale scans must fail in enforced/CI modes.
- [ ] Validate security config enum values and nested policies before use;
  invalid effective config must not silently downgrade enforcement.
- [ ] Restrict MCP HTTP/SSE to loopback hosts, or require an explicit dangerous
  override with an authentication design and tests.

## P1 — make quality gates truthful

- [ ] Make Health emit a failed/configured-but-failed TypeScript source when
  `tsc` exits non-zero without parser diagnostics.
- [ ] Decide and document whether ESLint/Health are CI-required; if yes, add
  `health gate --strict-warn` to CI with a coherent required-source policy.
- [ ] Add a coverage command/adapter and CI evidence before retaining coverage
  targets as an enforceable objective.
- [ ] Clarify that `test run --strict` changes changed-scope fallback behavior;
  it does not add checks to a full-suite run.

## P2 — documentation and requirements integrity

- [x] Add Project Agent Harness to the roadmap and mark Telegram dependency.
- [x] Replace the stale uncommitted Harness handoff link with a package-local
  committed handoff.
- [x] Document the implemented `metrics` command and correct optional MCP HTTP
  wording.
- [ ] Amend MCP architecture documentation to list approved direct-import
  exceptions, or move those operations behind service facades.
- [ ] Regenerate `docs/docs` from source after P0/P1 changes; retain historical
  2026-07-10 readiness report unchanged and publish a new dated report.

## P3 — product sequencing

- [ ] Start Project Agent Harness Release 0 only through a dedicated flow after
  the package-local handoff prerequisites are met.
- [ ] Keep Flow Reviewer, Context Operations and Telegram Transport
  specification-ready; do not claim runtime support until source/tests exist.
- [ ] Sequence Telegram after Harness Release 0; evaluate Context Operations
  adapters only after deterministic context/eval foundations exist.

## Completion evidence

Each item requires focused regression tests, a normalized health/test report,
and an updated managed-review decision. P0 changes require a security review;
P1 changes require CI evidence; P2 documentation changes require link and
source/CLI validation.

