// Host bridge for `ask_user` tool ↔ TUI composer-dock picker.
//
// makeAgentDeps builds tools before the TUI dock exists; the TUI registers the
// real interactive host here, and the tool invokes through this bridge.

import type { AskUserFn } from "../harness/tool/builtin/ask-user-tool";

let host: AskUserFn | undefined;

export function setAskUserHost(fn: AskUserFn | undefined): void {
  host = fn;
}

export async function invokeAskUserHost(
  request: Parameters<AskUserFn>[0],
): Promise<string> {
  if (host === undefined) {
    return "__cancel__";
  }
  return host(request);
}
