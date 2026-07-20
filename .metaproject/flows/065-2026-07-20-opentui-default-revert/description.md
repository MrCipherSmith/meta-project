# Flow 065 — revert the OpenTUI default (hotfix)

Flow 064 made the OpenTUI shell the default on a TTY, but a real-terminal run
showed the readline-picker → OpenTUI stdin handoff leaks the terminal's responses
to OpenTUI's capability/DA/DSR queries as literal text, corrupting the terminal.
Revert to readline-by-default; OpenTUI stays reachable via explicit `--tui` for
iterating the handoff fix. TUI code unchanged.
