import { test, expect } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathExists } from "../lib/fs";
import { runTesting } from "./service";

const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
const RAW_LOG = path.join(".metaproject", "data", "testing", "logs", "latest.raw.log");

// A workspace whose `test` script echoes a secret, so the raw log carries a
// secret through the testing write seam. bun.lockb makes the runner resolve to
// `bun run test`, which is available in this environment.
async function scaffold(opts: { security?: boolean; mode?: string }): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "gd-testing-seam-"));
  await mkdir(path.join(root, ".metaproject"), { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ scripts: { test: `echo ${AWS_KEY}` } }),
    "utf8",
  );
  await writeFile(path.join(root, "bun.lockb"), "", "utf8");
  if (opts.security !== undefined) {
    await writeFile(
      path.join(root, ".metaproject", "metaproject.json"),
      JSON.stringify({ modules: { security: { enabled: opts.security } } }),
      "utf8",
    );
  }
  if (opts.mode) {
    await writeFile(
      path.join(root, ".metaproject", "security.config.json"),
      JSON.stringify({ mode: opts.mode }),
      "utf8",
    );
  }
  return root;
}

test("advisory testing run persists the raw log just like security-off", async () => {
  const off = await scaffold({ security: false });
  const advisory = await scaffold({ security: true, mode: "advisory" });
  try {
    const offResult = await runTesting({ cwd: off, changed: false, since: null, scope: null, kind: null, strict: false });
    const advResult = await runTesting({ cwd: advisory, changed: false, since: null, scope: null, kind: null, strict: false });

    // Both persist the raw log (behavior unchanged in advisory).
    expect(offResult.report.rawLogPath).not.toBeNull();
    expect(advResult.report.rawLogPath).not.toBeNull();
    expect(await pathExists(path.join(advisory, RAW_LOG))).toBe(true);
    // Advisory may add a leak-safe warning but never suppresses.
    expect(advResult.securityWarnings?.every((w) => !w.includes("not persisted"))).toBe(true);
    expect(JSON.stringify(advResult.securityWarnings ?? [])).not.toContain(AWS_KEY);
  } finally {
    await rm(off, { recursive: true, force: true });
    await rm(advisory, { recursive: true, force: true });
  }
});

test("enforced testing run suppresses raw-log persistence for a planted secret", async () => {
  const root = await scaffold({ security: true, mode: "enforced" });
  try {
    const result = await runTesting({ cwd: root, changed: false, since: null, scope: null, kind: null, strict: false });
    // The run itself is never broken; only raw-log persistence is suppressed.
    expect(result.report.rawLogPath).toBeNull();
    expect(await pathExists(path.join(root, RAW_LOG))).toBe(false);
    expect(result.securityWarnings?.some((w) => w.includes("not persisted"))).toBe(true);
    expect(JSON.stringify(result.securityWarnings ?? [])).not.toContain(AWS_KEY);
    // The normalized report is still written.
    expect(result.jsonPath.length).toBeGreaterThan(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

// Regression (leak review): a secret in a FAILING test command's output must not
// reach the committable report via the failure message, even though the raw log
// is suppressed. The report is built from the redacted copy of the output.
test("a secret in failing test output never reaches the committable report", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "gd-testing-leak-"));
  try {
    await mkdir(path.join(root, ".metaproject"), { recursive: true });
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ scripts: { test: `echo ${AWS_KEY}-leak; exit 1` } }),
      "utf8",
    );
    await writeFile(path.join(root, "bun.lockb"), "", "utf8");
    await writeFile(
      path.join(root, ".metaproject", "metaproject.json"),
      JSON.stringify({ modules: { security: { enabled: true } } }),
      "utf8",
    );
    await writeFile(
      path.join(root, ".metaproject", "security.config.json"),
      JSON.stringify({ mode: "enforced" }),
      "utf8",
    );

    const result = await runTesting({ cwd: root, changed: false, since: null, scope: null, kind: null, strict: false });

    // Report failure messages carry no raw secret.
    expect(JSON.stringify(result.report.failures)).not.toContain(AWS_KEY);
    // The persisted report artifact carries no raw secret.
    const reportJson = await readFile(result.jsonPath, "utf8");
    expect(reportJson).not.toContain(AWS_KEY);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
