import { collectEntries } from "./store";
import { jaccard, tokenSet } from "./text";
import type { MemoryEntry } from "./types";

export type SkillScope = {
  module?: string | null;
  target?: string | null;
  files?: string[];
};

const AUTHORITATIVE_TYPES = new Set(["decision", "constraint", "known-mistake"]);

// Accepted decisions/constraints/known-mistakes that apply to a skill's scope.
// Used by skill-verify-skill to surface memory the skill must not contradict.
export async function relevantAcceptedMemory(
  cwd: string,
  scope: SkillScope,
  limit = 10,
): Promise<MemoryEntry[]> {
  const entries = await collectEntries(cwd);
  const accepted = entries.filter(
    (entry) => entry.status === "accepted" && AUTHORITATIVE_TYPES.has(entry.type),
  );

  const module = scope.module?.toLowerCase() ?? null;
  const files = new Set(scope.files ?? []);
  const targetTokens = tokenSet(scope.target ?? "");

  return accepted
    .filter((entry) => {
      if (
        module &&
        (entry.scopes.module?.toLowerCase() === module ||
          entry.tags.map((t) => t.toLowerCase()).includes(module))
      ) {
        return true;
      }
      if (entry.scopes.files.some((file) => files.has(file))) {
        return true;
      }
      if (
        targetTokens.size > 0 &&
        jaccard(
          targetTokens,
          tokenSet(`${entry.title} ${entry.summary} ${entry.tags.join(" ")}`),
        ) >= 0.15
      ) {
        return true;
      }
      return false;
    })
    .slice(0, limit);
}
