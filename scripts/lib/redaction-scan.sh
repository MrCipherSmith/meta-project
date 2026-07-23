# shellcheck shell=bash
# Redaction scan for the sandbox deep probe (R1 gate).
#
# Extracted verbatim from scripts/sandbox-deep-probe.sh so the FAIL branch is
# unit-testable in isolation without launching the full sandbox/harness probe.
# This file only DEFINES a function — it sets no shell options and runs nothing
# at source time, so it is safe to `source` from both the probe and tests.
#
# keryx_redaction_scan <run_dir> <fixture_secret> <hits_log>
#   Scans every regular file under <run_dir> for the literal <fixture_secret>
#   substring, excluding the intentional `.fixture-secret-marker` source file.
#   Every file that contains the secret is a leak: its path is appended to
#   <hits_log> as `leak:<path>` and the running hit count is incremented.
#   Echoes the total hit count on stdout (0 == clean/PASS, >0 == FAIL).
keryx_redaction_scan() {
  local run_dir="$1" fixture_secret="$2" hits_log="$3"
  local hits=0 f base
  while IFS= read -r -d '' f; do
    base="$(basename "$f")"
    case "$base" in
      .fixture-secret-marker) continue ;;
    esac
    # Skip the probe script itself if copied
    if grep -F -q -- "$fixture_secret" "$f" 2>/dev/null; then
      hits=$((hits + 1))
      echo "leak:$f" >>"$hits_log"
    fi
  done < <(find "$run_dir" -type f -print0 2>/dev/null)
  printf '%s' "$hits"
}
