import { expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validateAgainstSchemaObject } from "../contracts/validator";
import { flowStateSchema } from "./schema";

const FLOWS_DIR = ".metaproject/flows";
const DOCPACK_SCHEMA = "docs/requirements/keryx-metaproject-native/schemas/flow-state.schema.json";

function onDiskFlowFiles(): string[] {
  if (!existsSync(FLOWS_DIR)) {
    return [];
  }
  return readdirSync(FLOWS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(FLOWS_DIR, entry.name, "flow.json"))
    .filter((path) => existsSync(path));
}

test("flowStateSchema validates EVERY on-disk flow.json (v1 and v2), zero failures", () => {
  const schema = flowStateSchema();
  const files = onDiskFlowFiles();
  expect(files.length).toBeGreaterThan(0);

  const failures: string[] = [];
  for (const file of files) {
    const data: unknown = JSON.parse(readFileSync(file, "utf8"));
    const result = validateAgainstSchemaObject(schema, data);
    if (!result.valid) {
      failures.push(`${file}: ${result.errors.map((e) => `${e.path} ${e.message}`).join("; ")}`);
    }
  }
  expect(failures).toEqual([]);
});

test("flowStateSchema covers both schemaVersion 1 and 2 among the on-disk flows", () => {
  const versions = new Set<number>();
  for (const file of onDiskFlowFiles()) {
    const data = JSON.parse(readFileSync(file, "utf8")) as { schemaVersion?: number };
    if (typeof data.schemaVersion === "number") {
      versions.add(data.schemaVersion);
    }
  }
  expect(versions.has(1)).toBe(true);
  expect(versions.has(2)).toBe(true);
});

test("flowStateSchema rejects a flow.json missing a required field", () => {
  const schema = flowStateSchema();
  const missingId = {
    schemaVersion: 2,
    slug: "x",
    title: "t",
    status: "ready",
    createdAt: "n",
    updatedAt: "n",
    tasks: [],
  };
  expect(validateAgainstSchemaObject(schema, missingId).valid).toBe(false);
});

test("flowStateSchema rejects a task missing a v1 core field", () => {
  const schema = flowStateSchema();
  const badTask = {
    schemaVersion: 2,
    id: "099",
    slug: "x",
    title: "t",
    status: "ready",
    createdAt: "n",
    updatedAt: "n",
    tasks: [{ id: "T1", title: "t", status: "todo" }], // missing kind
  };
  expect(validateAgainstSchemaObject(schema, badTask).valid).toBe(false);
});

test("runtime flowStateSchema() is consistent with the committed docpack schema", () => {
  const docpack = JSON.parse(readFileSync(DOCPACK_SCHEMA, "utf8")) as Record<string, unknown>;
  expect(flowStateSchema()).toEqual(docpack);
});
