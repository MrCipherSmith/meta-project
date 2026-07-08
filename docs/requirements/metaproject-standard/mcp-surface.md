# Metaproject MCP Surface

Version: 0.1.0 · Status: draft

Cross-module documentation package for the Model Context Protocol (MCP) surface
that `gd-metapro` exposes. Mirrors the layout of the `security/` package doc: it
describes a cross-cutting adapter, not a new module. Implements Block A of the
2026 roadmap ([`roadmap-2026/A-interop-mcp/`](../roadmap-2026/A-interop-mcp/)).

## 1. Purpose

Expose the read-only Metaproject services (code graph, security, flow status,
memory, health, wiki, standard validation) to any MCP-capable client over a
stdio JSON-RPC server. The MCP package is a **thin protocol adapter**: each Tool
maps to exactly one `createXService()` facade method and defines no new module
logic.

## 2. Package

```
src/mcp/
  server.ts        # stdio JSON-RPC loop; the ONLY place the MCP SDK is loaded (lazy await import)
  dispatch.ts      # pure tools/resources dispatch (SDK-free; unit-testable in-process)
  tools.ts         # Tool registry: MCP Tool name → one createXService() method
  resources.ts     # metaproject://<class>/<relpath> read-only scheme
  config.ts        # loadMcpConfig(cwd): deep-merge over defaults, fallback on bad JSON
  discovery.ts     # manifest-driven filtering (disabled module ⇒ hidden)
  redact-seam.ts   # routes every tool result through security/guard.ts:redactRaw
  transport/
    stdio.ts       # default transport; no listening socket
    http-sse.ts    # SECOND opt-in behind --http; fully removable
```

**Import boundary:** `src/mcp/` imports ONLY `createXService()` facades +
`src/lib/*` + `security/guard.ts` (the `redactRaw` seam). A static
import-boundary test enforces this.

## 3. Tools (≥10)

Each Tool is a thin adapter over one facade method:

| Tool | Facade | Mutating |
|------|--------|----------|
| `gdgraph.affected` / `gdgraph.cycles` / `gdgraph.orphans` | `src/gdgraph/query.ts` over `loadGraph(root)` | no |
| `security.check` | `createSecurityService(cwd).check` | no |
| `security.scan` | `createSecurityService` / `runScan` | writes report |
| `security.scan-mcp` | `src/security/detect/mcp.ts:scanMcpManifest` (E3) | no |
| `flow.status` | `createFlowService().list`/`get` (read-only) | no |
| `memory.search` | `createMemoryService().search` | no |
| `health.gate` / `health.status` | `createCodeHealthService()` | no |
| `wiki.query` | `createGdWikiService().status`/`validate`/`checkLinks` | no |
| `standard.validate` | `src/standard/service.ts:runValidate` | no |

No mutating flow transition is exposed (NG-A4). **Every** tool result is routed
through `redactRaw({ source: "tool-output" })` before transport.

## 4. Resources (read-only)

`metaproject://<class>/<relpath>` with classes `artifacts | wiki | memory`:

- `artifacts` → `.metaproject/data/<module>/artifacts/**`
- `wiki` → `.metaproject/wiki/**`
- `memory` → `.metaproject/memory/**`

`resources/read` returns raw file contents; no computation, no mutation. URIs
are resolved and confined to their class root — any path-traversal is rejected.

## 5. Transports

- **stdio** (default): no listening socket.
- **HTTP/SSE** (`mcp serve --http` + `http.enabled=true`): a separate,
  isolated, removable opt-in bound to localhost with no auth.

## 6. Golden Rule

The MCP SDK is an `optionalDependency`, loaded ONLY via lazy `await import()`
inside `server.ts`. `package.json` `dependencies` stays `{}`. With
`modules.mcp.enabled=false` (the default) and the SDK not installed, every
default command and the full pre-existing test suite behave byte-identically —
no SDK loaded, no socket opened. The single sanctioned exception: `mcp serve`
invoked without the SDK hard-fails with an actionable install message.

## 7. Security surface (E3)

`gd-metapro security scan-mcp <manifest|dir>` runs `scanMcpManifest`, a pure,
network-free detector over MCP tool manifests that flags **tool-poisoning**,
**line-jumping**, and **rug-pull** (tool-definition sha256 drift from a pinned
baseline). Findings are leak-safe. The `fixtures/mcp-threat/` corpus is the
acceptance gate (100% of vectors flagged, no false positives on benign).

## 8. Related

- [A-interop-mcp specification](../roadmap-2026/A-interop-mcp/specification.md)
- [Standard as generator](specification.md#standard-as-generator) — the MCP
  server is one of the three LF-standard artifacts gd-metapro emits.
