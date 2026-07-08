# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `gd-metapro flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `gd-metapro flow ac confirm <id> <ACn>`.

These consolidate Block A's AC1..AC11 (docs/requirements/roadmap-2026/A-interop-mcp/acceptance-criteria.md).

## Criteria

- AC1: With `modules.mcp.enabled=true` and the MCP SDK installed, a stdio round-trip test completes the initialize handshake, and `tools/list` returns N ≥ 10 Tools including `gdgraph.affected`, `gdgraph.cycles`, `gdgraph.orphans`, `security.check`, `security.scan`, `flow.status`, `memory.search`, `health.gate`, `wiki.query`, `standard.validate`; `tools/call` on each returns a result equal to the corresponding `createXService()` method's in-process result (paired unit test). [Block A AC1]
- AC2: `resources/list` enumerates ≥3 classes (artifacts/wiki/memory) under `metaproject://<class>/<relpath>`; `resources/read` returns raw file contents; a full read sweep leaves the tree hash unchanged (read-only); URIs resolving outside a configured root are rejected. [Block A AC2]
- AC3: A module with `modules.<m>.enabled=false` does not appear in `tools/list`/`resources/list`; with `modules.mcp.enabled=false`, no Tool/Resource is exposed and no SDK is loaded on any non-`serve` path. [Block A AC3]
- AC4: Every Tool handler routes its serialized output through `redactRaw({source:"tool-output"})` before returning (single choke point); a seeded secret with security enabled is masked in the transported output; with security disabled `redactRaw` returns byte-identical content and the tool still exits 0 (never throws). [Block A AC4]
- AC5: `security scan-mcp fixtures/mcp-threat/` flags 100% of the enumerated poisoning/line-jumping/rug-pull vectors (measured against the committed corpus) with no false positive on the labeled benign set; `src/security/detect/mcp.ts` is pure/network-free, returns `DetectorMatch[]`, slots into `runDetectors`, findings are leak-safe; a rug-pull manifest whose pinned tool-definition hash diverges from baseline is flagged and an unchanged one is not. [Block A AC5]
- AC6: `standard emit llms` emits `llms.txt`; re-running yields a byte-identical file; the output passes an `llms.txt` format validator in CI; the generator loads no runtime dependency. [Block A AC6]
- AC7: `skills export <skill> --runtime plugin` produces a plugin/marketplace package; an export→import round-trip reproduces an equivalent skill; `AGENTS.md`/`SKILL.md` stay schema-valid post-export. [Block A AC7]
- AC8: Default `mcp serve` opens no listening socket (no-network sandbox test); `mcp serve --http` requires `capabilities.http.enabled=true` (absent that, no HTTP path is reachable); stdio and HTTP transports are isolated in `transport/` and deleting `http-sse.ts` leaves stdio fully functional. [Block A AC8]
- AC9: With `modules.mcp.enabled=false` AND the SDK not installed (`bun install --omit=optional`), the full existing test suite passes byte-identically and every default command succeeds opening no socket; `package.json` `dependencies` stays empty and the SDK is only under `optionalDependencies`; `src/mcp/` has no top-level SDK import (only lazy `await import()` in `server.ts`), enforced by a static guard in CI. This is the package-wide golden-rule gate. [Block A AC9]
- AC10: `mcp serve` invoked without the SDK exits non-zero with an actionable message (how to install), rather than silently degrading — the single opt-in command allowed to hard-fail; no other command is affected. [Block A AC10]
- AC11: The `standard` module README/spec + `metaproject-standard/` docs state the 3-emitted-artifacts (AGENTS.md + Agent Skills + MCP server) generator framing, cross-linked to A1 (MCP) and A2 (llms.txt/skills export); roadmap-2026 status updated; the src/mcp import-boundary (M-3: only service facades + lib + guard) is enforced by a test. [Block A AC11 + M-3]
- AC12: `bun run check` (typecheck + full suite) passes with the 201 pre-existing tests unchanged.
