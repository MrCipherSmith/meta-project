import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "../lib/fs";
import { MEMORY_TYPES } from "./types";
import { collectEntries, memoryRoot } from "./store";
import { findConflicts, findDuplicates, type Candidate } from "./dedup";
import type {
  Confidence,
  MemoryConfig,
  MemoryIngestResult,
} from "./types";

const SOURCE_TYPE: Record<string, string> = {
  health: "known-mistake",
  review: "lesson",
  job: "lesson",
  "skill-verifier": "lesson",
};

const SOURCE_CONFIDENCE: Record<string, Confidence> = {
  health: "medium",
  review: "medium",
  job: "low",
  "skill-verifier": "medium",
};

export async function ingestMemory(
  cwd: string,
  source: string,
  filePath: string,
  config: MemoryConfig,
  now: Date,
): Promise<MemoryIngestResult> {
  const absolute = path.resolve(cwd, filePath);
  if (!(await pathExists(absolute))) {
    throw new Error(`Ingest source not found: ${filePath}`);
  }

  const content = await readFile(absolute, "utf8");
  const candidates = extractCandidates(content);
  const type = SOURCE_TYPE[source] ?? "lesson";
  const confidence = SOURCE_CONFIDENCE[source] ?? "low";
  const folder = MEMORY_TYPES.find((t) => t.type === type)?.folder ?? "lessons";

  const existing = await collectEntries(cwd);
  const created: string[] = [];
  const conflicts: MemoryIngestResult["conflicts"] = [];
  const createdCandidates: Candidate[] = [];
  let skippedDuplicates = 0;

  const dir = path.join(memoryRoot(cwd), folder);

  for (const text of candidates) {
    const title = toTitle(text);
    const candidate: Candidate = {
      title,
      summary: text,
      type,
      tags: [source],
      scopes: { module: null, entity: null, files: [] },
    };

    const dupes = [
      ...findDuplicates(candidate, existing, config),
      ...(createdCandidates.some(
        (c) => c.title.toLowerCase() === title.toLowerCase(),
      )
        ? [{ path: "(this run)", title, titleSimilarity: 1, summaryJaccard: 1 }]
        : []),
    ];
    if (dupes.length > 0) {
      skippedDuplicates += 1;
      continue;
    }

    conflicts.push(...findConflicts(candidate, existing));

    const slug = uniqueSlug(dir, title);
    const filename = `${slug}.md`;
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, filename),
      buildEntryMarkdown({
        title,
        type,
        status: config.ingest.defaultStatus,
        confidence,
        summary: text,
        source,
        link: path.relative(cwd, absolute),
        date: dateString(now),
      }),
      "utf8",
    );
    created.push(`${folder}/${filename}`);
    createdCandidates.push(candidate);
  }

  return { created, skippedDuplicates, conflicts };
}

function extractCandidates(content: string): string[] {
  const fromJson = extractJson(content);
  const pool = fromJson.length > 0 ? fromJson : extractMarkdown(content);
  return dedupeStrings(pool)
    .filter((text) => text.length >= 12 && text.length <= 260)
    .slice(0, 20);
}

function extractJson(content: string): string[] {
  try {
    const parsed = JSON.parse(content) as unknown;
    return collectStrings(parsed);
  } catch {
    return [];
  }
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = [
      record.message,
      record.summary,
      record.suggestedAction,
      record.recommendation,
      record.lesson,
      record.title,
    ].flatMap(collectStrings);
    const nested = Object.entries(record)
      .filter(
        ([key]) =>
          !["message", "summary", "suggestedAction", "recommendation", "lesson", "title"].includes(
            key,
          ),
      )
      .flatMap(([, nestedValue]) => collectStrings(nestedValue));
    return [...preferred, ...nested];
  }
  return [];
}

function extractMarkdown(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*#>\s]+/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("```"));
}

function buildEntryMarkdown(input: {
  title: string;
  type: string;
  status: string;
  confidence: string;
  summary: string;
  source: string;
  link: string;
  date: string;
}): string {
  return `# ${input.title}

Version: 0.1.0
Type: ${input.type}
Status: ${input.status}
Confidence: ${input.confidence}

## Summary

${input.summary}

## Details

Ingested from ${input.source}. Review and expand.

## Provenance

- Source: ${input.source}
- Link: ${input.link}
- Created: ${input.date}
- Updated: ${input.date}

## Related Scopes

- Module:
- Entity:
- Files:
- Skills:

## Tags

- ${input.source}

## Changelog

- 0.1.0 - Ingested draft.
`;
}

function toTitle(text: string): string {
  const words = text.split(/\s+/).slice(0, 9).join(" ");
  return words.length > 0 ? words.replace(/[.:;,]+$/, "") : "Untitled";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function uniqueSlug(dir: string, title: string): string {
  const base = slugify(title) || "entry";
  let slug = base;
  let counter = 2;
  while (existsSync(path.join(dir, `${slug}.md`))) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

function dedupeStrings(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()))].filter(Boolean);
}

function dateString(now: Date): string {
  return now.toISOString().slice(0, 10);
}
