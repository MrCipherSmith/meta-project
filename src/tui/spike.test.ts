// Flow 059 — OpenTUI Phase 0 spike PROOF (headless).
//
// Validates, without a real TTY, that @opentui/core can (1) render a command
// dropdown (`SelectRenderable`, whose `{name, description}` option shape matches
// keryx's slash-command registry) and (2) accept typed keyboard input into a
// single-line `InputRenderable` — the two primitives the OpenTUI shell migration
// (docs/requirements/keryx-opentui-shell) depends on. Uses OpenTUI's own headless
// test renderer, which is also the testing pattern the real migration will use.
//
// `@opentui/core` is an OPTIONAL dependency, loaded ONLY via dynamic `import()`
// (keryx's zero-`dependencies` floor + lazy optional imports; see
// src/capability/no-optional-imports). The test skips if the package is absent.
import { expect, test } from "bun:test";

async function loadOpenTui(): Promise<{
  core: typeof import("@opentui/core");
  testing: typeof import("@opentui/core/testing");
} | undefined> {
  try {
    const [core, testing] = await Promise.all([import("@opentui/core"), import("@opentui/core/testing")]);
    return { core, testing };
  } catch {
    return undefined; // optional dep not installed → skip
  }
}

test("OpenTUI headless: Select renders slash-command options", async () => {
  const otui = await loadOpenTui();
  if (otui === undefined) {
    return; // optional dependency absent — skip
  }
  const { renderer, renderOnce, captureCharFrame } = await otui.testing.createTestRenderer({ width: 70, height: 12 });
  const select = new otui.core.SelectRenderable(renderer, {
    id: "cmds",
    width: 70,
    height: 8,
    options: [
      { name: "/help", description: "Show commands" },
      { name: "/expand", description: "Show last tool output" },
      { name: "/clear", description: "Clear conversation" },
      { name: "/exit", description: "Leave" },
    ],
  });
  renderer.root.add(select);
  await renderOnce();
  const frame = captureCharFrame();
  expect(frame).toContain("/help");
  expect(frame).toContain("/expand");
  renderer.destroy();
});

test("OpenTUI headless: Input accepts typed keys and exposes .value", async () => {
  const otui = await loadOpenTui();
  if (otui === undefined) {
    return; // optional dependency absent — skip
  }
  const { renderer, mockInput } = await otui.testing.createTestRenderer({ width: 70, height: 4 });
  const input = new otui.core.InputRenderable(renderer, { id: "prompt" });
  renderer.root.add(input);
  input.focus();
  await mockInput.pressKeys(["/", "h", "e", "l", "p"]);
  expect(input.value).toBe("/help");
  renderer.destroy();
});
