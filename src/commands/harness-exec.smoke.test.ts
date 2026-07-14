// Flag-gated LIVE smoke test for `keryx harness exec --allow-real-subprocess`
// (flow 030, T5). Mirrors the established pattern in
// `src/harness/process/real-process-adapter.smoke.test.ts`: this suite is
// EXCLUDED FROM CI and SKIPPED entirely unless the explicit opt-in env flag
// `KERYX_ALLOW_REAL_SUBPROCESS === "1"` is set. Under a normal `bun test` (no
// flag), zero real processes are spawned and the dynamic `import("./harness")`
// inside the (skipped) test body never breaks collection.
//
// `harnessCommand` (`./harness.ts`) does not implement the "exec" subcommand
// yet (T6's job) — under the flag, this test is expected to be RED until then
// (it will observe the current fallback USAGE-line behavior, not a real
// "completed" outcome). Once T6 lands, running this file locally with
// `KERYX_ALLOW_REAL_SUBPROCESS=1 bun test src/commands/harness-exec.smoke.test.ts`
// proves a real `/bin/echo` actually runs end-to-end through the CLI.
import { describe, expect, test } from "bun:test";

const REAL_SUBPROCESS_FLAG = process.env.KERYX_ALLOW_REAL_SUBPROCESS === "1";

function captureConsoleLog(): { logs: string[]; restore: () => void } {
  const logs: string[] = [];
  const original = console.log;
  // biome-ignore lint: intentional console capture for assertions in this test only.
  console.log = (...values: unknown[]) => {
    logs.push(values.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join(" "));
  };
  return { logs, restore: () => { console.log = original; } };
}

function lastJson(logs: string[]): Record<string, unknown> | undefined {
  for (let i = logs.length - 1; i >= 0; i--) {
    const line = logs[i];
    if (line === undefined) continue;
    try {
      return JSON.parse(line) as Record<string, unknown>;
    } catch {
      // Not this line; keep scanning backwards.
    }
  }
  return undefined;
}

describe.skipIf(!REAL_SUBPROCESS_FLAG)(
  "keryx harness exec --allow-real-subprocess smoke (flag-gated via KERYX_ALLOW_REAL_SUBPROCESS=1, excluded from CI)",
  () => {
    test("a real /bin/echo runs end-to-end through the CLI and completes", async () => {
      // Dynamic import INSIDE the (conditionally-skipped) test body, mirroring
      // real-process-adapter.smoke.test.ts: safe regardless of whether "exec"
      // is implemented yet, since the module itself (./harness) already exists.
      const { harnessCommand } = await import("./harness");

      const { logs, restore } = captureConsoleLog();
      try {
        await harnessCommand(["exec", "--allow-real-subprocess", "--", "/bin/echo", "keryx-cli-smoke"]);
      } finally {
        restore();
      }

      const result = lastJson(logs);
      const outcome = result?.outcome as { kind?: string } | undefined;
      expect(outcome?.kind).toBe("completed");
    });
  },
);

// Always-running guard (never skipped): proves that WITHOUT the flag (and
// without --allow-real-subprocess on the exec args), no real subprocess is
// reachable via the CLI at all — zero spawns, by construction (no
// processAdapter injected, no --allow-real-subprocess flag passed).
test("without the flag and without --allow-real-subprocess, `keryx harness exec` never reports a completed outcome", async () => {
  const { harnessCommand } = await import("./harness");
  const { logs, restore } = captureConsoleLog();
  try {
    await harnessCommand(["exec", "--", "/bin/echo", "keryx-cli-smoke-guard"], { env: {} });
  } finally {
    restore();
  }
  const combined = logs.join("\n");
  expect(combined).not.toMatch(/"kind"\s*:\s*"completed"/);
});
