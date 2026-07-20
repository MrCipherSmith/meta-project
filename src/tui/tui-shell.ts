// Flow 059 — OpenTUI Phase 0 spike: an isolated, fallback-safe `--tui` skeleton.
//
// This is NOT the migration — it is the spike proof-of-shape for
// docs/requirements/keryx-opentui-shell. It renders a static transcript, a
// bottom composer (`split-footer` screen mode → a fixed footer input over a
// scrolling main region, Pi/grok layout), and a `/` command dropdown. It is NOT
// yet wired to `runAgentTurn` (Phase 1). `launchTuiShell()` is defensive: it
// returns `false` (so the caller falls back to the readline shell) whenever there
// is no TTY, the optional `@opentui/core` package is absent, or the renderer
// cannot initialise; the real interactive look is validated on a live terminal.
//
// `@opentui/core` is an OPTIONAL dependency and is loaded ONLY via a dynamic
// `import()` (never a top-level import) — keryx keeps a zero-`dependencies` floor
// and lazy-loads every optional capability (see src/capability/no-optional-imports).

/** Dummy commands for the spike dropdown (the real registry lands in Phase 3). */
const SPIKE_COMMANDS = [
  { name: "/help", description: "Show commands" },
  { name: "/expand", description: "Show the last tool call's full output" },
  { name: "/clear", description: "Clear the conversation" },
  { name: "/exit", description: "Leave agent mode" },
];

/** The subset of `@opentui/core` the spike uses (structurally, via dynamic import). */
type OpenTui = typeof import("@opentui/core");
type Renderer = Awaited<ReturnType<OpenTui["createCliRenderer"]>>;

/** Build the static spike component tree: transcript + composer + `/` dropdown. */
function buildSpikeTree(otui: OpenTui, renderer: Renderer): void {
  const transcript = new otui.BoxRenderable(renderer, {
    id: "transcript",
    flexGrow: 1,
    flexDirection: "column",
    padding: 1,
  });
  transcript.add(
    new otui.TextRenderable(renderer, {
      id: "header",
      content: "keryx — OpenTUI spike · type / for commands · Ctrl+C to exit",
    }),
  );
  renderer.root.add(transcript);

  const menu = new otui.SelectRenderable(renderer, {
    id: "menu",
    height: 6,
    visible: false,
    options: SPIKE_COMMANDS,
  });
  renderer.root.add(menu);

  const input = new otui.InputRenderable(renderer, {
    id: "prompt",
    placeholder: "type a task or / for commands",
  });
  renderer.root.add(input);
  input.focus();

  // The essence of the Pi/grok composer: `/` opens the command dropdown.
  input.on(otui.InputRenderableEvents.INPUT, () => {
    menu.visible = input.value.startsWith("/");
  });
}

/**
 * Attempt the OpenTUI shell. Returns `true` if it ran to completion (user exited),
 * `false` if it declined/failed and the caller should fall back to the readline
 * shell. Never throws.
 */
export async function launchTuiShell(): Promise<boolean> {
  if (!process.stdout.isTTY) {
    return false; // no interactive terminal → fall back
  }
  let otui: OpenTui;
  try {
    otui = await import("@opentui/core"); // optional dep; absent → fall back
  } catch {
    return false;
  }

  let renderer: Renderer | undefined;
  let resolveDone: () => void = () => {};
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  try {
    renderer = await otui.createCliRenderer({
      exitOnCtrlC: true,
      screenMode: "split-footer",
      onDestroy: () => resolveDone(),
    });
    buildSpikeTree(otui, renderer);
    await done;
    return true;
  } catch {
    return false; // any init/runtime failure → fall back
  } finally {
    try {
      renderer?.destroy();
    } catch {
      // best-effort teardown
    }
  }
}
