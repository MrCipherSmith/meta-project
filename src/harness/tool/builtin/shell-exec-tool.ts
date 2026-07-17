// shell_exec tool for interactive agent mode (flow 036 / SA-01 Flow C).
//
// This is the ONE write/execute capability. It is risk `shell` and is NEVER run
// except through the agent driver's DEFAULT-DENY approval gate (see
// `src/commands/agent.ts`): the model can propose a command, but nothing executes
// without an explicit user `y`. The command runs in the project root; output is
// bounded; failures return `{ isError: true }` rather than throwing. The runner is
// injectable so unit tests are deterministic (no real subprocess).

import type { InteractiveTool, InteractiveToolResult } from "./interactive-tools";

/** Runs a shell command string and returns bounded output (or an error result). */
export type CommandRunner = (command: string) => Promise<InteractiveToolResult>;

const MAX_OUTPUT_BYTES = 20_000;

/**
 * The default runner: execute `command` in `cwd = root` via `sh -c`, capturing
 * bounded stdout/stderr. Never throws — a non-zero exit or a spawn failure becomes
 * `{ isError: ... }`.
 */
export function makeCommandRunner(root: string): CommandRunner {
  return async (command) => {
    try {
      const proc = Bun.spawn(["sh", "-c", command], { cwd: root, stdout: "pipe", stderr: "pipe" });
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      const exit = await proc.exited;
      const combined = `${stdout}${stderr.length > 0 ? `\n${stderr}` : ""}`.trim();
      const bounded =
        combined.length > MAX_OUTPUT_BYTES
          ? `${combined.slice(0, MAX_OUTPUT_BYTES)}\n…(truncated)`
          : combined;
      const output = bounded.length > 0 ? bounded : `(no output; exit ${exit})`;
      return { output, isError: exit !== 0 };
    } catch (cause) {
      return {
        output: `command failed to start: ${cause instanceof Error ? cause.message : String(cause)}`,
        isError: true,
      };
    }
  };
}

/**
 * The `shell_exec` tool, bound to `root`. `run` defaults to a real subprocess
 * runner and is injectable for deterministic tests. Risk `shell` → the driver
 * requires approval before this ever executes.
 */
export function shellExecTool(root: string, run: CommandRunner = makeCommandRunner(root)): InteractiveTool {
  return {
    definition: {
      name: "shell_exec",
      description:
        "Run a shell command in the project root (e.g. `git status`, `bun test`). Requires the user's approval before it runs. Input: { command: string }.",
      inputSchema: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
        additionalProperties: false,
      },
      risk: "shell",
    },
    invoke: async (input) => {
      const command = typeof input.command === "string" ? input.command : "";
      if (command.length === 0) {
        return { output: "shell_exec requires a non-empty 'command'", isError: true };
      }
      return run(command);
    },
  };
}
