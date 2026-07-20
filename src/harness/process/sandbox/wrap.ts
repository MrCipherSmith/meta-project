// Platform dispatcher for OS-sandbox command wrapping (flow 093, T4).
//
// Pure: given a contained command + resolved sandbox profile + platform, returns
// the launcher-wrapped command (macOS seatbelt / Linux bwrap), an explicit
// "no containment" pass-through for the `danger-full-access` escape hatch, or a
// fail-closed reason for an unsupported platform. No spawning, no fs.

import type { ContainedCommand } from "../executor";
import type { SandboxProfile } from "./profile";
import { wrapSeatbelt } from "./seatbelt";
import { wrapBwrap } from "./bwrap";

export type WrapResult =
  | { ok: true; command: ContainedCommand; wrapped: boolean }
  | { ok: false; reason: string };

export interface WrapOptions {
  /** `process.platform` value ("darwin" | "linux" | "win32" | …). */
  platform: string;
  /** Resolved absolute bwrap path (Linux); falls back to PATH lookup. */
  bwrapPath?: string;
}

/**
 * Wrap `command` for OS containment under `profile`.
 * - `danger-full-access` ⇒ pass-through, `wrapped:false` (containment skipped).
 * - `darwin` ⇒ seatbelt-wrapped.
 * - `linux` ⇒ bwrap-wrapped.
 * - anything else ⇒ fail-closed reason (unsupported platform).
 */
export function wrapWithSandbox(
  command: ContainedCommand,
  profile: SandboxProfile,
  opts: WrapOptions,
): WrapResult {
  if (profile.mode === "danger-full-access") {
    return { ok: true, command, wrapped: false };
  }

  if (opts.platform === "darwin") {
    return { ok: true, command: wrapSeatbelt(command, profile), wrapped: true };
  }

  if (opts.platform === "linux") {
    const wrapped = opts.bwrapPath
      ? wrapBwrap(command, profile, opts.bwrapPath)
      : wrapBwrap(command, profile);
    return { ok: true, command: wrapped, wrapped: true };
  }

  return {
    ok: false,
    reason: `OS sandbox is unsupported on platform "${opts.platform}"; run inside WSL2 or a container, or use an explicit danger-full-access override.`,
  };
}
