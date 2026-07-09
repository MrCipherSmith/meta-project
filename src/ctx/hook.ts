// gdctx routing guard — a Claude Code PreToolUse(Bash) hook that keeps agents on
// the token-aware `keryx ctx` layer instead of dumping raw command output into
// context. It is deliberately NARROW (routing-only): it blocks only the handful
// of commands where `keryx ctx` adds structural value (rg/grep, cat/head/tail,
// git diff/log/show) and lets everything else through — generic output trimming
// is left to a general proxy (e.g. rtk) if the user runs one.
//
// Enforcement model: DENY + feedback. On a blocked command the hook exits 2, so
// Claude Code stops the tool call and feeds the stderr guidance back to the
// agent, which then re-issues the routed `keryx ctx` form. An explicit escape
// marker (`# keryx:raw <reason>`) always allows the raw command through so a
// genuine need is one keystroke away and self-documents in the transcript.
//
// Fail-open by construction: malformed hook payloads, non-Bash tools, and any
// parse error allow the command (exit 0). The guard never blocks work it cannot
// confidently classify.

export const CTX_HOOK_SENTINEL = "ctx-agent-hooks";
export const CTX_HOOK_COMMAND = "keryx ctx hook claude";

export interface HookClassification {
  block: boolean;
  // The raw command family that matched (e.g. "rg", "cat", "git log").
  matched?: string;
  // The `keryx ctx` form the agent should use instead.
  suggestion?: string;
  // Present (possibly empty) when an escape marker allowed a raw command.
  escapeReason?: string;
}

// `# keryx:raw <reason>` anywhere in the command opts out of the guard.
const ESCAPE_MARKER = /#\s*keryx:raw\b[ \t]*([^\n]*)/i;

// Leading wrappers we skip past to find the real command in a segment.
const LEADING_SKIP = new Set(["sudo", "command", "time", "nice", "env", "builtin"]);

// Prefixes that mean the command is already routed / another tool's concern.
const ALREADY_ROUTED = new Set(["keryx", "rtk"]);

interface Route {
  readonly names: RegExp;
  readonly label: string;
  readonly suggestion: string;
}

const ROUTES: readonly Route[] = [
  {
    names: /^(rg|grep|egrep|fgrep|ripgrep)$/,
    label: "rg/grep",
    suggestion: 'keryx ctx rg "<pattern>" [path]',
  },
  {
    names: /^(cat|head|tail)$/,
    label: "cat/head/tail",
    suggestion: "keryx ctx read <file> --mode compact",
  },
];

// `git <sub>` sub-commands whose output is long enough to route through ctx.
const GIT_ROUTABLE = /^(diff|log|show)$/;

// Split a command line into independently-executed segments. We only need a
// shallow split on shell connectors — enough to catch `cd x && rg y` and
// `cat f | rg y` without a full shell parser.
function segments(command: string): string[] {
  return command
    .split(/\|\||&&|;|\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// The meaningful leading token of a segment: skip env assignments (`FOO=bar`)
// and benign wrappers (`sudo`, `env`, …).
function leadingTokens(segment: string): string[] {
  const tokens = segment.split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i] ?? "";
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token) || LEADING_SKIP.has(token)) {
      i += 1;
      continue;
    }
    break;
  }
  return tokens.slice(i);
}

// Pure classifier — the heart of the guard. Returns the first blocking match, or
// a non-blocking result. Exported for tests.
export function classifyCommand(command: string): HookClassification {
  const trimmed = command.trim();
  if (!trimmed) {
    return { block: false };
  }

  const escape = ESCAPE_MARKER.exec(command);
  if (escape) {
    return { block: false, escapeReason: (escape[1] ?? "").trim() };
  }

  for (const segment of segments(command)) {
    const tokens = leadingTokens(segment);
    const first = tokens[0];
    if (!first || ALREADY_ROUTED.has(first)) {
      continue;
    }

    for (const route of ROUTES) {
      if (route.names.test(first)) {
        return { block: true, matched: first, suggestion: route.suggestion };
      }
    }

    if (first === "git" && tokens[1] && GIT_ROUTABLE.test(tokens[1])) {
      const suggestion =
        tokens[1] === "diff"
          ? "keryx ctx diff [--staged|--stat]"
          : `keryx ctx run -- git ${tokens[1]} …`;
      return { block: true, matched: `git ${tokens[1]}`, suggestion };
    }
  }

  return { block: false };
}

// The stderr guidance shown to the agent when a command is blocked (exit 2).
export function buildBlockMessage(command: string, result: HookClassification): string {
  return [
    `[keryx ctx] Raw \`${result.matched}\` bypasses the gdctx routing layer (raw output floods context).`,
    `Use instead:  ${result.suggestion}`,
    `The routed form is compressed and recorded in the routing audit (ctx_used).`,
    `If raw output is genuinely required, append an escape marker with a reason:`,
    `  ${command.trim()}   # keryx:raw <why raw is needed>`,
  ].join("\n");
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

// Extract the Bash command from a Claude Code PreToolUse payload. Returns null
// (⇒ allow) for any non-Bash tool or unparseable input — fail-open.
export function extractBashCommand(payload: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  if (record.tool_name !== "Bash") {
    return null;
  }
  const input = record.tool_input;
  if (typeof input !== "object" || input === null) {
    return null;
  }
  const command = (input as Record<string, unknown>).command;
  return typeof command === "string" ? command : null;
}

// CLI entry for `keryx ctx hook <runtime>`. Reads the PreToolUse payload from
// stdin, classifies the command, and blocks (exit 2) or allows (exit 0). Only
// the Claude Code runtime is wired today; other ids are accepted and no-op.
export async function runCtxHook(runtime: string | undefined): Promise<void> {
  if (runtime && runtime !== "claude") {
    // Unknown runtime: do not interfere with tool execution.
    return;
  }

  const payload = await readStdin();
  const command = extractBashCommand(payload);
  if (command === null) {
    return; // fail-open: not a Bash call or unparseable payload.
  }

  const result = classifyCommand(command);
  if (result.block) {
    process.stderr.write(`${buildBlockMessage(command, result)}\n`);
    process.exitCode = 2;
    return;
  }

  if (result.escapeReason !== undefined) {
    // Allow, but surface the raw escape so it lands in the transcript / audit.
    const reason = result.escapeReason || "(no reason given)";
    process.stderr.write(`[keryx ctx] raw command allowed via escape marker — reason: ${reason}\n`);
  }
}
