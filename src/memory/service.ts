import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "../lib/fs";
import { loadMemoryConfig } from "./config";
import { checkMemory } from "./check";
import { findDuplicates, type Candidate } from "./dedup";
import { ingestMemory } from "./ingest";
import { renderSearchMarkdown, searchEntries } from "./search";
import { collectEntries, memoryRoot } from "./store";
import { renderMemoryEntry } from "./templates";
import { MEMORY_TYPES } from "./types";
import type {
  MemoryCreateInput,
  MemoryCreateResult,
  MemoryIndexInput,
  MemoryIndexResult,
  MemoryIngestInput,
  MemoryIngestResult,
  MemorySearchInput,
  MemorySearchResult,
  MemoryService,
} from "./types";

function dataRoot(cwd: string): string {
  return path.join(cwd, ".metaproject", "data", "memory");
}

export function createMemoryService(): MemoryService {
  return {
    async create(input: MemoryCreateInput): Promise<MemoryCreateResult> {
      const typeConfig = MEMORY_TYPES.find((t) => t.type === input.type);
      if (!typeConfig) {
        throw new Error(
          `Unsupported memory type: ${input.type}. Supported: ${MEMORY_TYPES.map((t) => t.type).join(", ")}`,
        );
      }

      const title = input.title ?? slugToTitle(input.slug ?? "untitled");
      const slug = input.slug ?? slugify(title);
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
        throw new Error(`Invalid slug: ${slug}. Use lowercase letters, digits, and hyphens.`);
      }

      const dir = path.join(memoryRoot(input.cwd), typeConfig.folder);
      const filePath = path.join(dir, `${slug}.md`);
      const relativePath = path.relative(input.cwd, filePath);
      if ((await pathExists(filePath)) && !input.force) {
        throw new Error(`Entry already exists: ${relativePath}. Use --force to overwrite.`);
      }

      const existing = await collectEntries(input.cwd);
      const candidate: Candidate = {
        title,
        summary: "",
        type: input.type,
        tags: [],
        scopes: { module: null, entity: null, files: [] },
      };
      const config = await loadMemoryConfig(input.cwd);
      const duplicates = findDuplicates(candidate, existing, config);

      await mkdir(dir, { recursive: true });
      await writeFile(
        filePath,
        renderMemoryEntry({
          title,
          type: input.type,
          date: new Date().toISOString().slice(0, 10),
          confidence: config.confidence.default,
        }),
        "utf8",
      );

      return { path: relativePath, type: input.type, duplicates };
    },

    async index(input: MemoryIndexInput): Promise<MemoryIndexResult> {
      const entries = await collectEntries(input.cwd);
      const generatedAt = new Date().toISOString();
      const indexDir = path.join(dataRoot(input.cwd), "index");
      await mkdir(indexDir, { recursive: true });
      const indexPath = path.join(indexDir, "index.json");
      await writeFile(
        indexPath,
        `${JSON.stringify(
          {
            generatedAt,
            entryCount: entries.length,
            entries: entries.map((e) => ({
              path: e.relativePath,
              type: e.type,
              status: e.status,
              confidence: e.confidence,
              title: e.title,
              updated: e.updated,
              tags: e.tags,
              scopes: e.scopes,
            })),
          },
          null,
          2,
        )}\n`,
        "utf8",
      );
      return { path: path.relative(input.cwd, indexPath), entryCount: entries.length, generatedAt };
    },

    async search(input: MemorySearchInput): Promise<MemorySearchResult> {
      const config = await loadMemoryConfig(input.cwd);
      const entries = await collectEntries(input.cwd);
      const results = searchEntries(entries, input.query, input.filters ?? {}, config, new Date());

      const artifacts = path.join(dataRoot(input.cwd), "artifacts");
      await mkdir(artifacts, { recursive: true });
      const markdownPath = path.join(artifacts, "latest.md");
      const jsonPath = path.join(artifacts, "latest.json");
      const generatedAt = new Date().toISOString();

      await writeFile(markdownPath, renderSearchMarkdown(input.query, results), "utf8");
      await writeFile(
        jsonPath,
        `${JSON.stringify(
          { schemaVersion: config.schemaVersion, query: input.query, generatedAt, results },
          null,
          2,
        )}\n`,
        "utf8",
      );

      return {
        schemaVersion: config.schemaVersion,
        query: input.query,
        results,
        markdownPath: path.relative(input.cwd, markdownPath),
        jsonPath: path.relative(input.cwd, jsonPath),
      };
    },

    async ingest(input: MemoryIngestInput): Promise<MemoryIngestResult> {
      const config = await loadMemoryConfig(input.cwd);
      return ingestMemory(input.cwd, input.source, input.path, config, new Date());
    },

    async check(input) {
      const config = await loadMemoryConfig(input.cwd);
      return checkMemory(input.cwd, config);
    },
  };
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
