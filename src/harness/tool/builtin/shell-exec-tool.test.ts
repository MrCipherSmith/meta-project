import { expect, test } from "bun:test";
import { type CommandRunner, shellExecTool } from "./shell-exec-tool";

function recordingRunner(result = { output: "done", isError: false }): {
  run: CommandRunner;
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    run: async (command) => {
      calls.push(command);
      return result;
    },
  };
}

test("shell_exec is risk shell with a command input schema", () => {
  const { run } = recordingRunner();
  const tool = shellExecTool("/proj", run);
  expect(tool.definition.name).toBe("shell_exec");
  expect(tool.definition.risk).toBe("shell");
  expect(tool.definition.inputSchema.required).toEqual(["command"]);
});

test("shell_exec passes the command through to the runner", async () => {
  const { run, calls } = recordingRunner();
  const tool = shellExecTool("/proj", run);
  const result = await tool.invoke({ command: "git status" });
  expect(calls).toEqual(["git status"]);
  expect(result.isError).toBe(false);
});

test("shell_exec errors on a missing command WITHOUT invoking the runner", async () => {
  const { run, calls } = recordingRunner();
  const tool = shellExecTool("/proj", run);
  const result = await tool.invoke({});
  expect(result.isError).toBe(true);
  expect(calls).toHaveLength(0);
});

test("shell_exec propagates a runner failure", async () => {
  const { run } = recordingRunner({ output: "boom", isError: true });
  const tool = shellExecTool("/proj", run);
  const result = await tool.invoke({ command: "false" });
  expect(result.isError).toBe(true);
  expect(result.output).toBe("boom");
});
