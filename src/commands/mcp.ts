// `gd-metapro mcp` command (specification.md §3, §9; T1, T5).
//
// Thin handler: parses `serve` / `--http` and calls `src/mcp/server.ts`. It does
// NOT import the MCP SDK — `serveMcp` loads it lazily and hard-fails with an
// actionable message when it is missing (the sanctioned XP2 exception, AC10).

import { helpOptions, helpTitle, helpUsage, heading, style } from "../lib/ui";
import { serveMcp } from "../mcp/server";

export async function mcpCommand(
  args: string[] = [],
  cwd: string = process.cwd(),
): Promise<void> {
  const subcommand = args[0];

  if (subcommand === "--help" || subcommand === "-h") {
    printMcpHelp();
    return;
  }

  // `mcp` (no subcommand) is an alias for `mcp serve`.
  if (!subcommand || subcommand === "serve") {
    const http = args.includes("--http");
    try {
      await serveMcp({ cwd, http });
    } catch (error) {
      // AC10: the single opt-in command allowed to hard-fail. Print the
      // actionable message and exit non-zero.
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
    return;
  }

  console.error(`Unknown mcp command: ${subcommand}`);
  printMcpHelp();
  process.exitCode = 1;
}

export function printMcpHelp(): void {
  helpTitle("gd-metapro mcp", "expose Metaproject services over the Model Context Protocol");
  helpUsage([
    "gd-metapro mcp serve            # stdio JSON-RPC MCP server (default)",
    "gd-metapro mcp serve --http     # HTTP/SSE opt-in (requires capabilities.http.enabled)",
    "gd-metapro mcp                  # alias for `mcp serve`",
  ]);
  helpOptions([
    { flag: "--http", desc: "Use the isolated HTTP/SSE transport (localhost only) instead of stdio." },
  ]);
  heading("Notes");
  console.log(
    `  ${style.dim("Requires the optional @modelcontextprotocol/sdk. Disabled by default (modules.mcp.enabled=false).")}`,
  );
}
