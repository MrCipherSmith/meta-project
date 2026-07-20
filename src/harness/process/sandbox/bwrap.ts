// Linux bubblewrap (bwrap) launcher builder (flow 093, T3).
//
// Pure: builds the `bwrap` argv for a workspace-write / read-only OS sandbox. No
// spawning, no fs, no clock.
//
// Boundary model:
//   --ro-bind / /        whole host filesystem, READ-ONLY
//   --bind <root> <root> re-bind each writable root (cwd + session tmp) RW
//   --tmpfs <secret>     mask each secret path with an empty tmpfs (deny-read)
//   --unshare-net        no network namespace ⇒ network OFF (when profile off)
//   --dev /dev --proc /proc  minimal device + proc for tool compatibility
//   --die-with-parent --new-session --unshare-ipc  hardening (no orphan, no
//                        TIOCSTI tty injection, ipc isolation)
//
// Landlock/seccomp are a follow-up hardening layer; `--ro-bind` + `--unshare-net`
// already enforce the v1 filesystem + network boundary. Real-kernel behavior is
// validated by the flag-gated live smoke (T7). `danger-full-access` never
// reaches this module — the wrap dispatcher skips containment for it.

import type { ContainedCommand } from "../executor";
import type { SandboxProfile } from "./profile";

/** Default launcher program name (resolved via PATH; detect.ts confirms it). */
export const BWRAP_PROGRAM = "bwrap";

/**
 * Build the `bwrap` argument list (everything up to and including `--`, before
 * the wrapped command). Deterministic given the profile.
 */
export function buildBwrapArgs(profile: SandboxProfile): string[] {
  const args: string[] = [
    "--ro-bind",
    "/",
    "/",
    "--dev",
    "/dev",
    "--proc",
    "/proc",
    // Ephemeral scratch /tmp; explicit writable roots re-bind over it below.
    "--tmpfs",
    "/tmp",
  ];

  // Re-bind writable roots RW (order after --ro-bind / and --tmpfs /tmp wins).
  for (const root of profile.writableRoots) {
    args.push("--bind", root, root);
  }

  // Mask secrets with empty tmpfs so reads see nothing (deny-read).
  for (const secret of profile.readDenyList) {
    args.push("--tmpfs", secret);
  }

  if (profile.network === "off") {
    args.push("--unshare-net");
  }

  args.push("--unshare-ipc", "--die-with-parent", "--new-session");
  return args;
}

/**
 * Wrap a contained command under `bwrap <args...> -- <cmd> [args...]`.
 * `env`/`cwd` are preserved; `argv[0]` stays the launcher name by convention.
 * `launcherPath` defaults to `bwrap` (PATH-resolved) but a caller that resolved
 * an absolute path (detect.ts) may pass it.
 */
export function wrapBwrap(
  command: ContainedCommand,
  profile: SandboxProfile,
  launcherPath: string = BWRAP_PROGRAM,
): ContainedCommand {
  return {
    path: launcherPath,
    argv: [BWRAP_PROGRAM, ...buildBwrapArgs(profile), "--", command.path, ...command.argv.slice(1)],
    env: command.env,
    cwd: command.cwd,
  };
}
