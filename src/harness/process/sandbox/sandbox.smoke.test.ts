// Live OS-sandbox smoke (flow 093, T7). REAL processes — gated behind
// KERYX_ALLOW_REAL_SUBPROCESS=1 and a supported platform with the launcher
// present, exactly like real-process-adapter.smoke.test.ts. Under a normal
// `bun test` the whole block is skipped and nothing is spawned.
//
// Proves the two v1 boundaries on the real OS: a write OUTSIDE the workspace
// roots is denied, a write INSIDE succeeds. (Network-off is validated manually;
// asserting DNS failure in CI is environment-fragile.)

import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import path from "node:path";
import { detectSandboxLauncher } from "./detect";

const flag = process.env.KERYX_ALLOW_REAL_SUBPROCESS === "1";
const launcher = detectSandboxLauncher();
const supported = (process.platform === "darwin" || process.platform === "linux") && launcher.available;

describe.skipIf(!flag || !supported)("OS-sandbox live smoke", () => {
  test("write inside cwd succeeds; write outside the workspace is denied", async () => {
    const { RealProcessAdapter } = await import("../real-process-adapter");
    const { SandboxedProcessAdapter } = await import("./adapter");
    const { defaultSandboxProfile } = await import("./profile");

    // Canonicalize: macOS /tmp and /var are symlinks, and the sandbox matches on
    // the real path. Production wiring (T6) canonicalizes writable roots the same way.
    const work = realpathSync(mkdtempSync(path.join(tmpdir(), "keryx-sbx-")));
    const tmp = realpathSync(mkdtempSync(path.join(tmpdir(), "keryx-sbxtmp-")));
    const inside = path.join(work, "inside.txt");
    const outside = path.join(homedir(), `keryx_sbx_FORBIDDEN_${process.pid}.txt`);

    const profile = defaultSandboxProfile(work, tmp, homedir()); // workspace-write + net off
    const inner = new RealProcessAdapter({ allowRealSubprocess: true, timeoutMs: 8000 });
    const adapter = new SandboxedProcessAdapter({
      profile,
      inner,
      platform: process.platform,
      launcherAvailable: launcher.available,
      ...(launcher.path ? { bwrapPath: launcher.path } : {}),
    });

    try {
      adapter.spawn({
        path: "/bin/sh",
        argv: ["sh", "-c", `echo ok > ${inside}`],
        env: { PATH: "/usr/bin:/bin", HOME: homedir() },
        cwd: work,
      });
      expect(existsSync(inside)).toBe(true);

      adapter.spawn({
        path: "/bin/sh",
        argv: ["sh", "-c", `echo bad > ${outside}`],
        env: { PATH: "/usr/bin:/bin", HOME: homedir() },
        cwd: work,
      });
      expect(existsSync(outside)).toBe(false); // sandbox denied the write
    } finally {
      for (const f of [inside, outside]) if (existsSync(f)) rmSync(f);
      rmSync(work, { recursive: true, force: true });
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
