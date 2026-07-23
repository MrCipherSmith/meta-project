// Regression test for the sandbox deep-probe redaction scan (R1 gate).
//
// The live probe (scripts/sandbox-deep-probe.sh) has only ever exercised the
// clean PASS path; the FAIL branch — a fixture secret leaking into a file under
// RUN_DIR — was never covered. The scan is factored into a sourceable shell
// function (scripts/lib/redaction-scan.sh, sourced byte-identically by the
// probe), so here we source that exact function and drive both branches over a
// temp dir. No network, no sandbox launcher, no keryx binary — just find+grep
// over planted files — so this stays ungated (not behind KERYX_ALLOW_REAL_SUBPROCESS).
import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const LIB = path.join(import.meta.dir, "lib", "redaction-scan.sh");
// Mirrors FIXTURE_SECRET in scripts/sandbox-deep-probe.sh — synthetic, never a
// real key (P-SEC-2): no `sk-` prefix, self-describing.
const FIXTURE_SECRET = "fixture-probe-redaction-only-not-a-real-key";

let RUN_DIR = "";

beforeEach(async () => {
  RUN_DIR = await mkdtemp(path.join(tmpdir(), "gd-redaction-"));
});

afterEach(async () => {
  if (RUN_DIR) {
    await rm(RUN_DIR, { recursive: true, force: true });
    RUN_DIR = "";
  }
});

/** Source the real lib and run the scan; returns hit count + the hits log. */
async function scan(): Promise<{ hits: number; hitsLog: string; stderr: string }> {
  const hitsLog = path.join(RUN_DIR, "redaction-hits.txt");
  const proc = Bun.spawn(
    [
      "bash",
      "-c",
      `set -euo pipefail; source "$1"; keryx_redaction_scan "$2" "$3" "$4"`,
      "bash",
      LIB,
      RUN_DIR,
      FIXTURE_SECRET,
      hitsLog,
    ],
    { stdout: "pipe", stderr: "pipe", stdin: new Blob([""]) },
  );
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  expect(exitCode).toBe(0);
  return { hits: Number(stdout.trim()), hitsLog, stderr };
}

test("FAIL branch: a planted fixture secret under RUN_DIR is reported as a hit", async () => {
  // The intentional marker file carries the secret but must be EXCLUDED.
  await writeFile(path.join(RUN_DIR, ".fixture-secret-marker"), `${FIXTURE_SECRET}\n`, "utf8");
  // A leak: the secret ends up in an evidence dump.
  await mkdir(path.join(RUN_DIR, "evidence"), { recursive: true });
  await writeFile(
    path.join(RUN_DIR, "evidence", "A2.json"),
    `{"stdout":"token=${FIXTURE_SECRET}"}\n`,
    "utf8",
  );

  const { hits, hitsLog } = await scan();

  // hits > 0 → overall=FAIL in the probe (scripts/sandbox-deep-probe.sh).
  expect(hits).toBeGreaterThan(0);
  expect(hits).toBe(1); // only the leaked file, marker excluded
  const log = await Bun.file(hitsLog).text();
  expect(log).toContain("leak:");
  expect(log).toContain(path.join("evidence", "A2.json"));
  // The excluded marker must not be logged as a leak.
  expect(log).not.toContain(".fixture-secret-marker");
});

test("PASS branch: no secret outside the excluded marker yields zero hits", async () => {
  await writeFile(path.join(RUN_DIR, ".fixture-secret-marker"), `${FIXTURE_SECRET}\n`, "utf8");
  await mkdir(path.join(RUN_DIR, "evidence"), { recursive: true });
  await writeFile(path.join(RUN_DIR, "evidence", "A2.json"), `{"stdout":"probe-a2"}\n`, "utf8");
  await writeFile(path.join(RUN_DIR, "REPORT.md"), "# clean report\n", "utf8");

  const { hits } = await scan();

  // hits == 0 → overall=PASS.
  expect(hits).toBe(0);
});
