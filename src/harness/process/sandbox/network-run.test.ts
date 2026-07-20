import { describe, expect, test } from "bun:test";
import { setupNetworkRun } from "./network-run";
import type { SandboxProfile } from "./profile";

const base: SandboxProfile = {
  mode: "workspace-write",
  network: "off",
  writableRoots: ["/w"],
  readDenyList: [],
  allowedDomains: [],
  required: false,
};

describe("setupNetworkRun", () => {
  test("non-restricted ⇒ no proxy, no env, noop close", async () => {
    const setup = await setupNetworkRun(base);
    expect(setup.profile.proxy).toBeUndefined();
    expect(setup.envAdditions).toEqual({});
    await setup.close(); // no throw
  });

  test("restricted ⇒ starts loopback proxy, fills addr + HTTP(S)_PROXY env", async () => {
    const setup = await setupNetworkRun({ ...base, network: "restricted", allowedDomains: ["localhost"] });
    try {
      expect(setup.profile.proxy?.host).toBe("127.0.0.1");
      expect(setup.profile.proxy?.port).toBeGreaterThan(0);
      const url = `http://localhost:${setup.profile.proxy?.port}`;
      expect(setup.envAdditions.HTTPS_PROXY).toBe(url);
      expect(setup.envAdditions.HTTP_PROXY).toBe(url);
      expect(setup.envAdditions.ALL_PROXY).toBe(url);
    } finally {
      await setup.close();
    }
  });

  test("masked credential ⇒ env gets a sentinel, never the real value", async () => {
    const setup = await setupNetworkRun(
      { ...base, network: "restricted", allowedDomains: ["api.github.com"] },
      { masks: [{ name: "GH_TOKEN", realValue: "ghp_realsecret", injectHosts: ["api.github.com"] }] },
    );
    try {
      expect(setup.envAdditions.GH_TOKEN).toBeDefined();
      expect(setup.envAdditions.GH_TOKEN).toStartWith("keryx-sentinel-");
      expect(setup.envAdditions.GH_TOKEN).not.toBe("ghp_realsecret");
      expect(JSON.stringify(setup.envAdditions)).not.toContain("ghp_realsecret");
    } finally {
      await setup.close();
    }
  });

  test("empty-value masked credential is skipped", async () => {
    const setup = await setupNetworkRun(
      { ...base, network: "restricted", allowedDomains: ["x.com"] },
      { masks: [{ name: "EMPTY", realValue: "", injectHosts: ["x.com"] }] },
    );
    try {
      expect(setup.envAdditions.EMPTY).toBeUndefined();
    } finally {
      await setup.close();
    }
  });
});
