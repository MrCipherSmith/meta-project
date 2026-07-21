# Flow Journal

- 2026-07-21T21:42:58.491Z - flow created
- 2026-07-21T21:44:14.030Z - frozen: 12 criteria; checksum recorded
- 2026-07-21T21:44:14.099Z - started
- 2026-07-21T21:44:14.176Z - task-done: T1: Collect remaining context

## T2 — O-3 / O-5 / O-4 install clause (commit 7487234)

### Runner labels verified (2026-07-22)

Verified against docs.github.com "GitHub-hosted runners" and
actions/runner-images before wiring the matrix — the description's table was
trusted only where it still holds:

| N1 target | Label used | Status |
|---|---|---|
| linux-x64 | `ubuntu-latest` (→ ubuntu-24.04) | GA |
| linux-arm64 | `ubuntu-24.04-arm` | GA, free+unlimited on public repos |
| darwin-arm64 | `macos-latest` (→ macos-15) | GA |
| darwin-x64 | `macos-15-intel` | GA — **replaces the description's `macos-13`** |

`macos-13` from the description's proposed table is RETIRED (deprecation began
2025-09-22, fully unsupported 2025-12-04 — actions/runner-images#13046).
`macos-15-intel` is the current and LAST hosted x86_64 macOS image, available
through Aug 2027 (runner-images#13027/#13045). No target was dropped; the Intel
leg simply moved to the live label. All four are reachable, so O-3 has no
"unavailable label" caveat to record in the spec.

### AC2 positive native check

`scripts/verify-opentui-native.ts` — chosen over "no error" because the optional
dep is fallback-guarded: a missing binary degrades to readline silently, so
absence-of-error is exactly what an unsupported platform looks like. Positive
signals instead: (1) `@opentui/core-<platform>-<arch>` resolves to a real
>512KB shared library on disk; (2) `resolveRenderLib()` returns an `FFIRenderLib`
(the library dlopen'd); (3) a byte written by JS via `OptimizedBuffer.drawText`
comes back out of native memory (`getRealCharBytes`) — no stub/fallback can
forge that round trip. Also fails if `zig` is on PATH (N1: "no toolchain").
Local run (darwin-arm64): PROVEN, libopentui.dylib 3.60 MB, round-trip
"KERYX-NATIVE-ROUND-TRIP" recovered. Falsified by hiding
`@opentui/core-darwin-arm64`: exit 1, "@opentui/core-darwin-arm64 did not
resolve … the platform gap itself".

### AC3 zero-skip guard

`scripts/opentui-tests-no-skips.ts` reads bun's JUnit `<testsuites>` counts and
fails on skipped>0 OR tests==0 OR a missing report. Made it bite: the three
`tui-shell.test.ts` renderer tests used to `return` early when the dep was
absent (bun reports that as PASS) — now `test.skipIf(OTUI===undefined)`, so an
absent binary surfaces as a skip the guard converts to a hard failure.
Local: `src/tui` → 94 tests, 0 skipped, guard exit 0. Falsified against the
sandbox smoke suite (2 skipped under no flag) → exit 1 with the loud banner;
and against a non-existent path (0 matches) → exit 1.

### AC5 install-test falsification (exact output)

Broke install.sh's wrapper heredoc (replaced the `cat > "$BIN_DIR/keryx" <<EOF
… EOF` block with an echo), ran `--global` into a temp prefix from a local bare
clone. Recorded output:

```
Cloning into '…/prefix/keryx'... done.
flow114: wrapper step deliberately broken
chmod: …/bin/keryx: No such file or directory
installer exit: 1
--- wrapper present? ---            (bin dir empty)
--- try to run the (missing) wrapper ---
zsh: no such file or directory: …/bin/keryx
wrapper exit: 127
```

So the wrapper is absent and running it fails (spawn ENOENT / exit 127) — the
green AC4 assertions (`stat` exec bit + `keryx --version` → semver) are
load-bearing. Isolation: HOME/KERYX_HOME/KERYX_BIN_DIR redirected to the temp
prefix, KERYX_REPO_URL a local bare clone (no network to the published repo),
and the test asserts real `~/.keryx` / `~/.local/bin` are untouched.

### AC6/AC7 cold-start numbers

Machine: Apple M1 Pro x10, 16 GiB, macOS darwin-arm64, bun 1.3.12, commit
6c67985. 11 measured runs + 2 warm-ups discarded, medians:

| scenario | median | min | max |
|---|---|---|---|
| runtime-floor (empty module) | 12.0 ms | 11.5 | 12.5 |
| readline (`keryx shell --no-tui`, stdin EOF) | 61.2 ms | 59.8 | 62.9 |
| readline + TUI module graph + native dlopen | 170.7 ms | 169.4 | 173.1 |

The TUI load adds ~109.5 ms over readline (2.79x). AC7: this is NOT a rendered
first frame — `createCliRenderer` needs a controlling terminal neither the
script nor CI has, so the renderer is never constructed. It is the dominant
term of TUI start-up (process start + module graph + native import), which is
what R5 asked to compare, stated as such rather than implied as time-to-frame.

### AC8 / scope

No `src/` production behaviour changed — the only `src/` edit is
`tui-shell.test.ts` skip mechanics (a test file). AC12 ongoing-cost note lives
in the ci.yml job comment. AC11 (spec §10 close-out) left for the orchestrator.
Unverifiable locally: the matrix legs themselves — cannot run GitHub Actions
here; the YAML parses and the two evidence scripts pass on darwin-arm64, but the
three non-darwin-arm64 legs are unproven until the PR runs (AC10, orchestrator).
