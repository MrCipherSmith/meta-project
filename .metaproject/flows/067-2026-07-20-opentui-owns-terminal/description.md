# Flow 067 — OpenTUI owns the terminal from start

The flows 065/066 corruption was a concurrent readline consuming the terminal's
responses to OpenTUI's capability queries. Definitive fix: when `--tui`, do NOT
create readline at all — OpenTUI owns the terminal from launch. Provider/model
come from flags or an in-TUI SelectRenderable picker. readline stays the default
and the fallback (absent dep / no TTY). User validates `--tui` on a real terminal.
