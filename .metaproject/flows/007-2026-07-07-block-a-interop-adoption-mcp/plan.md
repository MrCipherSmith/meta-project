# Implementation Plan

Status: ready

## Approach

Build `src/mcp/` as a **thin protocol adapter** over the existing `createXService()`
facades, instantiating the Block 0 Capability Seam for the `mcp` (and `http`) ceilings.
The MCP SDK is an `optionalDependency`, lazy-loaded ONLY inside `server.ts`. E3 (redaction
routing + `scan-mcp` detector + `mcp-threat` corpus) ships in the SAME cycle as the server
(untrusted from day one). Generators (`llms.txt`, gdskills plugin export) are pure/zero-dep
and independent of the server. Docs land last. The block-completion gate is the package-wide
byte-identical + no-socket test with `modules.mcp.enabled=false` and no SDK installed.

Because the block's shared single-writer files (`cli.ts`, `package.json`, `init.ts`,
`update.ts`, `src/commands/skills.ts`, `src/security/*`) would conflict across parallel
authors, the core is implemented coherently and verified as one unit, then adversarially
reviewed against the golden rule + M-3 import-boundary + E3 redaction-routing before PR.

## Steps (grouped from spec T1–T14)

1. **T1 — Scaffold.** `src/mcp/{server,tools,resources,config,discovery,redact-seam}.ts` +
   `transport/stdio.ts`; `src/commands/mcp.ts`; `cli.ts` `mcp` route. Declare the MCP SDK
   under `optionalDependencies`; lazy `await import()` only in `server.ts`. [spec T1]
2. **T2 — Manifest + config.** `modules.mcp` (default `enabled:false`) via `init --mcp/--no-mcp`
   through the Block 0 capability seam; `loadMcpConfig` deep-merge + malformed-JSON fallback;
   `discovery.ts` filters disabled modules. [spec T2]
3. **T3 — Tool registry.** `tools.ts`: each MCP Tool → exactly one `createXService()` method
   per spec §6 (gdgraph.affected/cycles/orphans, security.check/scan, flow.status[read],
   memory.search, health.gate/status, wiki.query, standard.validate). No new logic. [spec T3]
4. **T4 — Resource registry.** `resources.ts`: `metaproject://<class>/<relpath>` over
   artifacts/wiki/memory; read-only; path-confinement. [spec T4]
5. **T5 — stdio server.** `server.ts` + `transport/stdio.ts`: initialize handshake,
   `tools/list`/`tools/call`, `resources/list`/`resources/read`; no listening socket;
   sanctioned hard-fail on missing SDK. [spec T5]
6. **T7 (E3) — redact-seam.** Route EVERY tool result through `redactRaw({source:"tool-output"})`,
   wired into `server.ts` from the first commit; never throws. [spec T7]
7. **T8 (E3) — scan-mcp detector.** `src/security/detect/mcp.ts` pure `scanMcpManifest → DetectorMatch[]`
   (poisoning/line-jumping/rug-pull incl. pinned-hash baseline); slot into `runDetectors`;
   `security scan-mcp` command + `cli.ts` route; leak-safe findings. [spec T8]
8. **T9 (E3) — mcp-threat corpus + tests.** `fixtures/mcp-threat/` (poisoning/line-jumping/rug-pull +
   benign controls); test: 100% flagged, no false positives, tool output redaction-routed. [spec T9]
9. **T6 — server tests.** stdio round-trip + per-method in-process parity + import-boundary (M-3) +
   no-network sandbox tests. [spec T6]
10. **T10 — llms.txt.** `src/standard/emit-llms.ts` + `standard emit llms`: pure, deterministic,
    zero-dep + CI format validator. [spec T10]
11. **T11 — skills plugin export.** `skills export <s> --runtime plugin`; export→import round-trip;
    AGENTS.md/SKILL.md schema-valid post-export. [spec T11]
12. **T13 — HTTP opt-in.** `transport/http-sse.ts` behind `mcp serve --http` + `capabilities.http.enabled`;
    isolated/removable; localhost only, no auth. [spec T13]
13. **T12/T14 — Docs.** `metaproject-standard/` MCP-surface package doc; Standard-as-generator
    repositioning (doc-only); update roadmap-2026 status. [spec T12, T14]
14. **T15 — Review + PR.** Adversarial review (golden-rule / M-3 boundary / E3 redaction / no-socket).

## Risks

- **Golden-rule regression (top):** any top-level SDK import or any default-command behavior change
  breaks C0-7. Mitigation: EXTEND the Block 0 no-top-level-import guard to the SDK; package-wide
  byte-identical + no-socket sandbox test is the hard gate; run the full existing suite unchanged.
- **MCP SDK API drift:** pin a specific `@modelcontextprotocol/sdk` version in optionalDependencies
  (already declared by Block 0); if the SDK is not installable in CI, the server round-trip test must
  skip gracefully while the no-SDK golden-rule path stays mandatory.
- **Import-boundary violation (M-3):** `src/mcp/` must import only service facades + lib + guard. A
  static boundary test enforces it.
- **E3 redaction bypass:** a tool result path that skips `redact-seam.ts`. Mitigation: route in one
  choke point in `server.ts`; test asserts a seeded secret is masked in transported output.
- **flow.status has no literal method:** map to `list`/`get` (read-only); never expose mutating transitions.
- **Scope:** HTTP (T13) is a separable opt-in — if it risks the cycle, it can defer without blocking A-core.
