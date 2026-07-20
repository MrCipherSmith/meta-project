// Shared CLI helper for read-only model narrations (flow 087, item 3).
//
// Used by the model-backed "explain/suggest/plan" commands (health explain
// --narrate, test suggest, flow plan, memory reflect --narrate). Reads the
// standard --provider/--model/--json flags, runs ONE fail-closed provider turn
// via `runModelTurn`, and prints the result (or a clear fail-closed message).
// Never writes project state — narration only.

import { optionValue } from "./args";
import {
  hasCredential,
  keyedProviderCandidates,
  runModelTurn,
} from "../harness/provider/single-turn";
import { providerByName } from "../commands/providers";
import { envWithSavedApiKeys } from "./shell-config";

export interface NarrateOptions {
  system: string;
  user: string;
  args: string[];
  requestId: string;
  maxOutputTokens?: number;
}

/** Human hint listing how to supply a provider key when auto-resolve fails. */
export function formatMissingCredentialHint(provider: string): string {
  const env = envWithSavedApiKeys(process.env);
  const available = keyedProviderCandidates().filter((p) => hasCredential(p, env));
  const envKey =
    provider === "anthropic"
      ? "ANTHROPIC_API_KEY"
      : providerByName(provider)?.envKey ?? `${provider.toUpperCase()}_API_KEY`;
  const lines = [
    `No credential for provider "${provider}" (set ${envKey}, or pass --provider <name>).`,
  ];
  if (available.length > 0) {
    lines.push(`Keys available for: ${available.join(", ")} — e.g. --provider ${available[0]}`);
  } else {
    lines.push(
      "No API keys found in the environment or ~/.local/share/keryx/auth.json. " +
        "Enter a key in `keryx shell` (/connect) or export e.g. DEEPSEEK_API_KEY / ZAI_API_KEY.",
    );
  }
  return lines.join("\n");
}

export async function narrate(opts: NarrateOptions): Promise<void> {
  const provider = optionValue(opts.args, "--provider");
  const model = optionValue(opts.args, "--model");
  const asJson = opts.args.includes("--json");

  // When --provider is omitted, runModelTurn auto-picks shell-saved provider
  // or the first keyed provider with a credential (not hard-wired to anthropic).
  const turn = await runModelTurn({
    ...(provider ? { provider } : {}),
    ...(model ? { model } : {}),
    system: opts.system,
    user: opts.user,
    requestId: opts.requestId,
    ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}),
  });

  if (!turn.credentialAvailable) {
    const message = formatMissingCredentialHint(turn.provider);
    emit(asJson, { provider: turn.provider, model: turn.model, credentialAvailable: false, error: message }, message, true);
    return;
  }

  if (turn.error) {
    const message = `${turn.error.kind}: ${turn.error.message}`;
    emit(asJson, { provider: turn.provider, model: turn.model, error: message }, message, true);
    return;
  }

  const text = turn.text.trim();
  if (asJson) {
    console.log(JSON.stringify({ provider: turn.provider, model: turn.model, text }, null, 2));
  } else {
    console.log(text);
  }
}

function emit(asJson: boolean, payload: unknown, message: string, isError: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (isError) {
    console.error(message);
  } else {
    console.log(message);
  }
  if (isError) {
    process.exitCode = 1;
  }
}
