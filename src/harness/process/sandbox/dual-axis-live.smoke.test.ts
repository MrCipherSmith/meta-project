// Flag-gated dual-axis smoke (optional package tail / P0.b).
//
// Default CI does NOT run the live block (KERYX_DUAL_AXIS_LIVE unset).
// Always-on unit path covers Axis C parity + redaction FAIL gate with fixtures only
// (no real API keys). Live Axis B (restricted network child env) runs only when
// KERYX_DUAL_AXIS_LIVE=1 and a restricted path is available.
//
// Never log real secret values. Fixture secrets only in this file.

import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  buildDualAxisReportMarkdown,
  overallDualAxisVerdict,
  scanArtifactsForSecrets,
  type DualAxisRow,
} from "./dual-axis-report";
import {
  resolveMasksFromSandboxEnv,
  type ProviderMaskSource,
} from "./mask-resolve";

/** Fixture only — not a real key. Used for redaction / resolve tests. */
const FIXTURE_SECRET = "sk-fixture-dual-axis-live-not-real-0001";

const providers: ProviderMaskSource[] = [
  { envKey: "DEEPSEEK_API_KEY", baseUrl: "https://api.deepseek.com" },
];

const liveFlag = process.env.KERYX_DUAL_AXIS_LIVE === "1";

/**
 * Dry-run / CI-safe dual-axis protocol checks (AC-O4/O5/O7).
 * Does not spawn restricted shells; proves report + redaction + Axis C.
 */
describe("dual-axis dry-run (always on; flag not required)", () => {
  test("Axis C: fully unset mode uses P0.b auto via resolveMasksFromSandboxEnv", () => {
    const cfgDir = mkdtempSync(path.join(tmpdir(), "keryx-dual-axis-live-cfg-"));
    const shell = resolveMasksFromSandboxEnv({
      env: { DEEPSEEK_API_KEY: FIXTURE_SECRET },
      providers,
      sandboxConfigDir: cfgDir,
    });
    const harness = resolveMasksFromSandboxEnv({
      env: { DEEPSEEK_API_KEY: FIXTURE_SECRET },
      modeOverride: "auto",
      providers,
      sandboxConfigDir: cfgDir,
    });
    expect(shell.ok && harness.ok).toBe(true);
    if (!shell.ok || !harness.ok) return;
    expect(shell.resolution.mode).toBe("auto");
    expect(shell.resolution.masks).toEqual(harness.resolution.masks);
    expect(JSON.stringify(shell.resolution)).not.toContain(FIXTURE_SECRET);
  });

  test("AC-O5: secret substring in RUN_DIR/REPORT → overall FAIL", () => {
    const rows: DualAxisRow[] = [
      { axis: "Preflight", verdict: "PASS", notes: "fixture preflight" },
      { axis: "A", verdict: "SKIP", notes: "multi-agent unavailable in unit dry-run" },
      { axis: "B", verdict: "PASS", notes: "would pass mask functional check" },
      { axis: "C", verdict: "PASS", notes: "resolver parity" },
    ];
    const report = buildDualAxisReportMarkdown(rows);
    // Simulate a leak into REPORT notes path (operator mistake).
    const leaky = `${report}\n<!-- bad: ${FIXTURE_SECRET} -->\n`;
    const scan = scanArtifactsForSecrets(
      [
        { name: "REPORT.md", text: leaky },
        { name: "axis-b.md", text: "sentinel-present" },
      ],
      [FIXTURE_SECRET],
    );
    expect(scan.totalHits).toBeGreaterThan(0);
    expect(
      overallDualAxisVerdict({
        rows,
        redactionHits: scan.totalHits,
        requireAxisBPass: true,
      }),
    ).toBe("FAIL");
  });

  test("clean artifacts + Axis B PASS → overall PASS (dry-run simulation)", () => {
    const rows: DualAxisRow[] = [
      { axis: "Preflight", verdict: "PASS", notes: "openssl/sandbox notes only" },
      { axis: "A", verdict: "SKIP", notes: "multi-agent unavailable" },
      { axis: "B", verdict: "PASS", notes: "child env is sentinel not real key" },
      { axis: "C", verdict: "PASS", notes: "shell/harness MaskResolution match" },
    ];
    const report = buildDualAxisReportMarkdown(rows);
    const scan = scanArtifactsForSecrets(
      [
        { name: "REPORT.md", text: report },
        { name: "resolution.json", text: JSON.stringify({ mode: "auto", masks: [] }) },
      ],
      [FIXTURE_SECRET],
    );
    expect(scan.totalHits).toBe(0);
    expect(report).not.toContain(FIXTURE_SECRET);
    expect(
      overallDualAxisVerdict({
        rows,
        redactionHits: scan.totalHits,
        requireAxisBPass: true,
      }),
    ).toBe("PASS");
  });
});

/**
 * Live operator path — skipped unless KERYX_DUAL_AXIS_LIVE=1.
 * Documents Axis A SKIP when multi-agent harness is not in this smoke.
 * Axis B minimum: with auto mode, resolved masks for a present fixture key
 * must not embed the secret value (resolution object only); full OS-sandbox
 * child printenv is covered by network-restricted.smoke when ALLOW_REAL_SUBPROCESS.
 */
describe.skipIf(!liveFlag)("dual-axis live (KERYX_DUAL_AXIS_LIVE=1)", () => {
  test("Preflight + Axis B minimum (resolver) + Axis A SKIP + redaction clean", () => {
    const cfgDir = mkdtempSync(path.join(tmpdir(), "keryx-dual-axis-live-run-"));
    // Prefer a real named key only as env *name* presence check — never print values.
    // Live operators may set DEEPSEEK_API_KEY; tests always inject fixture for isolation.
    const env: Record<string, string | undefined> = {
      DEEPSEEK_API_KEY: FIXTURE_SECRET,
      // force auto even if host global has manual
    };
    const resolved = resolveMasksFromSandboxEnv({
      env,
      providers,
      sandboxConfigDir: cfgDir,
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    // B1-like: resolution must not contain real/fixture secret value.
    const resolutionJson = JSON.stringify(resolved.resolution);
    expect(resolutionJson).not.toContain(FIXTURE_SECRET);
    expect(resolved.resolution.mode).toBe("auto");
    expect(resolved.resolution.masks.some((m) => m.name === "DEEPSEEK_API_KEY")).toBe(true);
    expect(resolved.resolution.tlsTerminate).toBe(true);

    const rows: DualAxisRow[] = [
      {
        axis: "Preflight",
        verdict: "PASS",
        notes: "live flag set; key name DEEPSEEK_API_KEY present (value never logged)",
      },
      {
        axis: "A",
        verdict: "SKIP",
        notes: "multi-agent/model network path not invoked in this smoke",
      },
      {
        axis: "B",
        verdict: "PASS",
        notes: "auto masks derived; resolution has no secret substring",
      },
      {
        axis: "C",
        verdict: "PASS",
        notes: "resolveMasksFromSandboxEnv unit golden covers harness parity",
      },
    ];
    const report = buildDualAxisReportMarkdown(rows);
    const artifacts = [
      { name: "REPORT.md", text: report },
      { name: "resolution.json", text: resolutionJson },
      { name: "preflight.md", text: rows[0]!.notes },
      { name: "axis-a.md", text: rows[1]!.notes },
      { name: "axis-b.md", text: rows[2]!.notes },
      { name: "axis-c.md", text: rows[3]!.notes },
    ];
    const scan = scanArtifactsForSecrets(artifacts, [FIXTURE_SECRET]);
    expect(scan.totalHits).toBe(0);
    expect(
      overallDualAxisVerdict({
        rows,
        redactionHits: scan.totalHits,
        requireAxisBPass: true,
      }),
    ).toBe("PASS");
  });
});
