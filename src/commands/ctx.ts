import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "../lib/fs";

type CtxArtifact = {
  id: string;
  command: string;
  exitCode: number;
  rawPath: string;
  summaryPath: string;
  bytesIn: number;
  bytesOut: number;
  truncated: boolean;
};

export async function ctxCommand(args: string[]): Promise<void> {
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "status") {
    await printCtxStatus();
    return;
  }

  if (command === "diff") {
    await runAndSummarize("diff", ["git", "diff", ...args.slice(1)]);
    return;
  }

  if (command === "rg") {
    await runAndSummarize("rg", ["rg", ...args.slice(1)]);
    return;
  }

  if (command === "read") {
    await readAndSummarize(args.slice(1));
    return;
  }

  if (command === "run") {
    const separatorIndex = args.indexOf("--");
    const runArgs = separatorIndex >= 0 ? args.slice(separatorIndex + 1) : args.slice(1);
    if (runArgs.length === 0) {
      console.error("Usage: gd-metapro ctx run -- <command...>");
      process.exitCode = 1;
      return;
    }
    await runAndSummarize("run", runArgs);
    return;
  }

  if (command === "show") {
    await showArtifact(args.slice(1));
    return;
  }

  console.error(`Unknown ctx command: ${command}`);
  printHelp();
  process.exitCode = 1;
}

async function printCtxStatus(): Promise<void> {
  const root = path.join(process.cwd(), ".metaproject");
  const manifestPath = path.join(root, "metaproject.json");
  const gdctxRoot = path.join(root, "data", "gdctx");

  console.log("# gdctx status");
  console.log("");
  console.log(`metaproject: ${(await pathExists(root)) ? "present" : "missing"}`);
  console.log(`manifest: ${(await pathExists(manifestPath)) ? "present" : "missing"}`);
  console.log(`module data: ${(await pathExists(gdctxRoot)) ? gdctxRoot : "missing"}`);

  if (await pathExists(manifestPath)) {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      modules?: Record<string, { enabled?: boolean }>;
    };
    console.log(`gdctx enabled: ${manifest.modules?.gdctx?.enabled === true ? "yes" : "no"}`);
  }
}

async function readAndSummarize(args: string[]): Promise<void> {
  const file = args[0];
  if (!file) {
    console.error("Usage: gd-metapro ctx read <file> [--mode outline|compact|full]");
    process.exitCode = 1;
    return;
  }

  const mode = valueAfter(args, "--mode") ?? "compact";
  const absolutePath = path.resolve(process.cwd(), file);
  const content = await readFile(absolutePath, "utf8");
  const lines = content.split("\n");
  const summary =
    mode === "full"
      ? content
      : mode === "outline"
        ? summarizeOutline(file, lines)
        : summarizeCompact(file, lines);

  const artifact = await writeArtifact({
    kind: "read",
    command: `read ${file} --mode ${mode}`,
    raw: content,
    summary,
    exitCode: 0,
  });

  printArtifactSummary(artifact, summary);
}

async function runAndSummarize(kind: string, command: string[]): Promise<void> {
  const proc = Bun.spawn(command, {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  const raw = [stdout, stderr].filter(Boolean).join("\n");
  const summary = summarizeCommandOutput(command.join(" "), raw, exitCode);
  const artifact = await writeArtifact({
    kind,
    command: command.join(" "),
    raw,
    summary,
    exitCode,
  });

  printArtifactSummary(artifact, summary);
  process.exitCode = exitCode;
}

async function showArtifact(args: string[]): Promise<void> {
  const target = args[0] ?? "latest";
  const raw = args.includes("--raw");
  const root = path.join(process.cwd(), ".metaproject", "data", "gdctx");
  const filePath =
    target === "latest"
      ? path.join(root, raw ? "raw" : "artifacts", raw ? "latest.log" : "latest.md")
      : path.join(root, raw ? "raw" : "artifacts", target);

  if (!(await pathExists(filePath))) {
    console.error(`Artifact not found: ${filePath}`);
    process.exitCode = 1;
    return;
  }

  console.log(await readFile(filePath, "utf8"));
}

async function writeArtifact({
  kind,
  command,
  raw,
  summary,
  exitCode,
}: {
  kind: string;
  command: string;
  raw: string;
  summary: string;
  exitCode: number;
}): Promise<CtxArtifact> {
  const root = path.join(process.cwd(), ".metaproject", "data", "gdctx");
  const rawRoot = path.join(root, "raw");
  const artifactsRoot = path.join(root, "artifacts");
  await mkdir(rawRoot, { recursive: true });
  await mkdir(artifactsRoot, { recursive: true });

  const id = `${new Date().toISOString().replace(/[:.]/g, "-")}_${kind}`;
  const rawPath = path.join(rawRoot, `${id}.log`);
  const summaryPath = path.join(artifactsRoot, `${id}.md`);
  const latestRawPath = path.join(rawRoot, "latest.log");
  const latestSummaryPath = path.join(artifactsRoot, "latest.md");

  const artifact: CtxArtifact = {
    id,
    command,
    exitCode,
    rawPath: path.relative(process.cwd(), rawPath),
    summaryPath: path.relative(process.cwd(), summaryPath),
    bytesIn: Buffer.byteLength(raw),
    bytesOut: Buffer.byteLength(summary),
    truncated: Buffer.byteLength(summary) < Buffer.byteLength(raw),
  };
  const summaryWithMeta = `${summary.trimEnd()}

## Metadata

\`\`\`json
${JSON.stringify(artifact, null, 2)}
\`\`\`
`;

  await writeFile(rawPath, raw, "utf8");
  await writeFile(summaryPath, summaryWithMeta, "utf8");
  await writeFile(latestRawPath, raw, "utf8");
  await writeFile(latestSummaryPath, summaryWithMeta, "utf8");

  return artifact;
}

function summarizeCommandOutput(command: string, output: string, exitCode: number): string {
  const lines = output.split("\n").filter((line) => line.trim().length > 0);
  const important = lines.filter((line) =>
    /error|failed|failure|exception|traceback|warning|warn|fatal/i.test(line),
  );
  const selected = [...important.slice(0, 40), ...lines.slice(-40)];
  const deduped = [...new Set(selected)];

  return `# gdctx command summary

Command: \`${command}\`
Exit code: \`${exitCode}\`
Raw lines: \`${lines.length}\`

## Output

\`\`\`text
${deduped.join("\n") || "(no output)"}
\`\`\`
`;
}

function summarizeOutline(file: string, lines: string[]): string {
  const outline = lines
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) =>
      /^\s*(import|export|class|interface|type|function|const|let|var|async function)\b/.test(line),
    )
    .slice(0, 120)
    .map(({ line, number }) => `${number}: ${line}`)
    .join("\n");

  return `# gdctx file outline

File: \`${file}\`
Lines: \`${lines.length}\`

\`\`\`text
${outline || "(no outline entries found)"}
\`\`\`
`;
}

function summarizeCompact(file: string, lines: string[]): string {
  const limit = 220;
  const selected =
    lines.length > limit
      ? [...lines.slice(0, 120), "...", ...lines.slice(-80)]
      : lines;

  return `# gdctx compact file

File: \`${file}\`
Lines: \`${lines.length}\`

\`\`\`text
${selected.join("\n")}
\`\`\`
`;
}

function printArtifactSummary(artifact: CtxArtifact, summary: string): void {
  console.log(summary.trimEnd());
  console.log("");
  console.log(`raw: ${artifact.rawPath}`);
  console.log(`summary: ${artifact.summaryPath}`);
}

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function printHelp(): void {
  console.log(`gd-metapro ctx

Usage:
  gd-metapro ctx status
  gd-metapro ctx diff [--staged|--stat]
  gd-metapro ctx rg "<pattern>"
  gd-metapro ctx read <file> [--mode outline|compact|full]
  gd-metapro ctx run -- <command...>
  gd-metapro ctx show latest [--raw]
`);
}
