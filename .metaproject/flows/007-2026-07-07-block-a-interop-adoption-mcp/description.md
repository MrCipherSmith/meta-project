# Implement Block A: Interop & Adoption (MCP) — thin protocol adapter + E3 + generators

Status: formalized
Source: docs/requirements/roadmap-2026/A-interop-mcp/ (PRD/spec/AC1..AC11/tasks are the authoritative source)

## Problem

The gd-metapro workspace is not consumable by the coding agents everyone already uses
(Cursor, Claude Code, Copilot, Codex, Devin). Block A ships a cross-cutting `src/mcp/`
package that speaks the **Model Context Protocol**: a **stdio-first** MCP server exposing
existing module services as **Tools** (thin adapters over `createXService()` facades) and
generated artifacts as read-only **Resources**. It ships **with E3** (MCP output is
untrusted from day one) and the portable-artifact generators (`llms.txt`, gdskills plugin
export, Standard-as-generator docs). Built on the Block 0 Capability Seam: the MCP SDK is
an `optionalDependency`, lazy-loaded only inside `server.ts`; with `modules.mcp.enabled=false`
(the default) nothing changes and no SDK loads.

## Expected Outcome (Block A spec §§, tasks T1–T14)

- `src/mcp/` — `server.ts` (stdio JSON-RPC loop; lazy `await import()` of the MCP SDK ONLY here),
  `tools.ts` (Tool registry: each MCP Tool → exactly one `createXService()` method, spec §6),
  `resources.ts` (`metaproject://<class>/<relpath>` read-only scheme, path-confined),
  `config.ts` (deep-merge over defaults + malformed-JSON fallback), `discovery.ts`
  (manifest-driven filtering of disabled modules), `redact-seam.ts` (routes EVERY tool result
  through `security/guard.ts:redactRaw({source:"tool-output"})`), `transport/stdio.ts`,
  `transport/http-sse.ts` (separate `--http` opt-in, isolated/removable).
- `src/commands/mcp.ts` + `cli.ts` `mcp` route. `modules.mcp` manifest entry (default `enabled:false`)
  via `init --mcp/--no-mcp`, wired through the Block 0 capability seam.
- **E3 (ships WITH A):** `src/security/detect/mcp.ts` — pure `scanMcpManifest(manifest) → DetectorMatch[]`
  (tool-poisoning / line-jumping / rug-pull incl. pinned-hash baseline), slotted into `runDetectors`;
  `security scan-mcp <manifest|dir>` command + `cli.ts` route; leak-safe findings;
  `fixtures/mcp-threat/` acceptance corpus (poisoning/line-jumping/rug-pull + benign controls).
- **Generators:** `src/standard/emit-llms.ts` + `standard emit llms` (pure, deterministic, zero-dep);
  gdskills plugin/marketplace export (`skills export <s> --runtime plugin`, round-trips, schema-valid).
- **Docs:** `metaproject-standard/` MCP-surface package doc; Standard-as-generator repositioning (doc-only).
- **Golden rule (C0-7 / AC9):** with `modules.mcp.enabled=false` AND the SDK not installed
  (`bun install --omit=optional`), the full existing suite passes byte-identically and every default
  command opens no socket. `dependencies` stays empty; SDK only under `optionalDependencies`; no
  top-level SDK import (only lazy `await import()` in `server.ts`).
- **Sanctioned exception (AC10):** `mcp serve` invoked without the SDK hard-fails with an actionable
  message — the ONE opt-in command allowed to hard-require its dep; no other command is affected.

## Out of Scope

- Hosted/multi-tenant MCP service; default HTTP listener; auth/identity (NG-A1/A3).
- Mutating flow transitions as tools (NG-A4) — only read-only `flow.status` (list/get) is exposed.
- A new rival interop standard (NG-A2). Block B/C/D adapters (they layer on this seam later).
