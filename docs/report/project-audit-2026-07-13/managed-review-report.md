# Managed Project Review — origin/main
Version: 1.0.0

## Target and evidence

Target: `origin/main` at `7020bc405c375f98b62fcdb4a0e932fa60d9e3f7`.

Review coverage: logic, architecture, security, performance, testing practice,
requirements and developer documentation. Full `flow-reviewer` runtime is not
implemented; this report is persisted through the existing managed
`review-flow` package.

## Verdict

REQUEST CHANGES. Runtime P0/P1 remediation must precede any claim that the
enforced security/quality gates protect managed completion.

## Findings

### F-001 [major] Enforced flow completion accepts `needs-approval`

- Files: `src/security/service.ts:133-150`, `src/security/guard.ts:204-209`
- Impact: an enforced or CI-managed flow may finish without an explicit approval
  even though the latest security decision requires one.
- Follow-up: make `needs-approval` blocking until a flow-bound approval receipt
  is verified; add a completion regression test.

### F-002 [major] Flow security evidence is missing-or-stale fail-open

- Files: `src/security/service.ts:136-141`, `src/security/guard.ts:183-209`
- Impact: a flow can pass with no scan or with a workspace-global stale scan
  unrelated to its changed range.
- Follow-up: require fresh flow/commit-bound scan attestation in enforced/CI.

### F-003 [major] Invalid security config can downgrade enforcement

- Files: `src/security/config.ts:117-163`, `src/security/guard.ts:71-75`
- Impact: unsupported mode/policy values are accepted and can make a detected
  failure non-blocking.
- Follow-up: validate config enums and nested fields; reject or safely default
  invalid effective config with regression coverage.

### F-004 [major] MCP resources allow symlink escape and bypass redaction

- Files: `src/mcp/resources.ts:168-216`, `src/mcp/server.ts:115-122`
- Impact: a symlink under an exposed root can disclose arbitrary readable local
  files, including unredacted secrets, through a resource URI.
- Follow-up: use realpath confinement, reject symlink escape, require listed
  resources, redact resource payloads, and test all cases.

### F-005 [minor] MCP boundary documentation omits approved direct imports

- Files: `docs/docs/architecture.md:123`, `src/mcp/tools.ts:11-21`
- Impact: architecture documentation overstates facade-only isolation.
- Follow-up: document direct-import exceptions and rationale, or refactor them
  behind service facades.

### F-006 [minor] MCP HTTP transport is not constrained to loopback

- Files: `src/mcp/config.ts:72-80`, `src/mcp/transport/http-sse.ts:39-45`
- Impact: a `0.0.0.0` config can expose the unauthenticated HTTP/SSE endpoint.
- Follow-up: allowlist loopback or require an explicit dangerous override plus
  authentication design.

### F-007 [major] Health can hide a globally failing TypeScript check

- Evidence: `bun run check` reports TS2688 when `bun-types` is unavailable,
  while strict Health reports TypeScript available with zero findings.
- Impact: a CI-grade quality signal may appear non-failing despite a failed
  typecheck without parseable file diagnostics.
- Follow-up: classify non-zero TypeScript adapter exit with no diagnostics as a
  failed configured source and cover it in tests.

### F-008 [minor] Coverage and Health gating are not enforced by CI

- Files: `.github/workflows/ci.yml`, health/testing configuration
- Impact: stated coverage objectives are not measured; CI does not consume the
  strict Health gate.
- Follow-up: choose an explicit policy, add coverage evidence, and wire the
  appropriate quality gate into CI.

### F-009 [major] Requirements roadmap omitted the Harness prerequisite

- Files: `docs/requirements/roadmap.md`,
  `docs/requirements/keryx-project-agent-harness/README.md`
- Impact: product sequencing made Telegram appear independent of an unlisted,
  unimplemented Harness capability.
- Resolution: corrected in this audit; retain the updated dependency order.

### F-010 [major] Requirements package referenced an uncommitted handoff

- File: `docs/requirements/keryx-project-agent-harness/README.md`
- Impact: two broken links pointed to an absent `.metaproject/jobs/` handoff.
- Resolution: replaced with committed `implementation-handoff.md` in this audit.

### F-011 [minor] Current-behavior documentation omitted Execution Metrics

- Files: `docs/docs/{README,index,cli-reference,modules}.md`
- Impact: users cannot discover the implemented `metrics` CLI or distinguish it
  from future benchmark claims.
- Resolution: corrected in this audit.

## Validation notes

- Tests: 538/538 passed through normalized `keryx test run`.
- Security corpus: 44 cases passed.
- Health: WARN (score 89; 72 P2 complexity findings); strict-warn gate fails.
- `bun run check`: blocked locally by absent installed `bun-types`; dependency
  installation was intentionally outside this review scope.

