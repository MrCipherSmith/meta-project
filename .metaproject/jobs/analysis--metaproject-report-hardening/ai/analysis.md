# Evidence Matrix

| Claim | Status | Evidence | Action |
|-------|--------|----------|--------|
| Bun-native, zero runtime deps | confirmed | `package.json`: `type: module`, Bun scripts, `dependencies: {}` | keep |
| Modules include graph/context/wiki/skills/health/testing/memory/tasks/security | confirmed | `.metaproject/index.md` | keep |
| gdgraph import parser is regex-based | corrected | `src/gdgraph/build.ts`: `Bun.Transpiler().scanImports()` primary, regex fallback | update report wording |
| complexity parser is regex/token/manual brace based | confirmed | `src/health/metrics/complexity.ts` | plan AST refinement |
| `writeFlow` non-atomic write can corrupt file | corrected/stale | `src/flow/store.ts`: temp file plus `rename` | remove from bug list |
| flow init has TOCTOU ID allocation risk | confirmed | `src/flow/service.ts` uses `nextFlowId` before `mkdir` | add lock |
| gdskills manifest learning writes lack shared lock | confirmed | `src/gdskills/project-skills.ts`, `src/gdskills/learn.ts` | add lock + atomic writes |
| command tests mutate CWD | confirmed | `rg process.chdir` across command tests | refactor tests/commands |
| duplicated write helpers | confirmed | `src/commands/init.ts`, `src/commands/update.ts` | extract helper |
| `src/lib/templates.ts` overloaded | confirmed | `wc -l`: 2471 | split module templates |

## Verification Command

```bash
/Users/tsaitler.aleksandr/.bun/bin/bun test src/gdgraph/build.test.ts src/gdgraph/fallback.test.ts src/health/metrics/complexity.test.ts src/flow/service.test.ts src/gdskills/verify.test.ts src/commands/init.test.ts src/commands/update.test.ts
```

## Verification Result

```text
29 pass
0 fail
145 expect() calls
```

---

<!-- Document Metadata -->
| Key | Value |
|-----|-------|
| Created | 2026-07-08T09:26:04Z |
| Agent | job-documenter |
| Task | Create AI evidence matrix |
| Job | analysis--metaproject-report-hardening |
| Version | 1.0 |
| Status | final |
