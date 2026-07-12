// RED tests for TM-02 (flow 004, W2).
//
// Pins the deterministic schemaVersion 1 -> 2 migration contract specified in
// `docs/decisions/keryx-harness/TM-01-task-manager-evolution.md` (frozen spec,
// see especially §4.2 migration rules, §4.3 write strategy, §5 backward-compat
// matrix). TM-03 implements `readFlow`/`check` to make this suite GREEN.
//
// These tests exercise ONLY the existing public surface (`readFlow` from
// `./store`, `service.list/check` from `./service`) so they run today and
// fail on assertions rather than on import errors. Fixtures are inline and
// self-contained (no wall-clock, no network); task shapes mirror the real
// default tasks (T1-T4) and an added task (T5, styled after flow
// `002-2026-07-10-gdgraph-java-python-import-resolution`'s T5) found in
// `.metaproject/flows/001..003`.
import { afterAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createFlowService } from "./service";
import { flowsRoot, readFlow } from "./store";
import type { FlowServiceDeps } from "./types";

let ROOT = "";

async function fresh(): Promise<void> {
  if (ROOT) {
    await rm(ROOT, { recursive: true, force: true });
  }
  ROOT = await mkdtemp(path.join(tmpdir(), "gd-flow-migration-"));
  await mkdir(path.join(ROOT, ".metaproject"), { recursive: true });
}

afterAll(async () => {
  if (ROOT) {
    await rm(ROOT, { recursive: true, force: true });
  }
});

function makeDeps(over: Partial<FlowServiceDeps> = {}): FlowServiceDeps {
  return {
    tracker: null,
    healthGate: async () => ({ status: "pass", reasons: [] }),
    now: () => new Date("2026-07-12T00:00:00Z"),
    ...over,
  };
}

const CREATED_AT = "2026-07-01T00:00:00.000Z";

// biome-ignore lint: fixture builder deliberately untyped (raw on-disk v1 JSON shape)
function baseRawFlow(tasks: unknown[], history?: unknown[]) {
  return {
    schemaVersion: 1,
    id: "001",
    slug: "migration-fixture",
    title: "Migration fixture flow",
    status: "in-progress",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    source: { type: "description", ref: null },
    acChecksum: null,
    acConfirmed: {},
    pr: { url: null },
    tasks,
    history: history ?? [{ at: CREATED_AT, event: "created" }],
  };
}

async function writeRawFlow(dir: string, raw: unknown): Promise<void> {
  const flowDir = path.join(flowsRoot(ROOT), dir);
  await mkdir(flowDir, { recursive: true });
  await writeFile(path.join(flowDir, "flow.json"), `${JSON.stringify(raw, null, 2)}\n`, "utf8");
}

// `service.check` flags missing scaffold files independently of schema/migration
// concerns; write the scaffold so those unrelated issues don't pollute assertions.
async function writeScaffold(dir: string): Promise<void> {
  const flowDir = path.join(flowsRoot(ROOT), dir);
  for (const file of [
    "description.md",
    "context.md",
    "plan.md",
    "tasks.md",
    "acceptance-criteria.md",
    "journal.md",
  ]) {
    await writeFile(path.join(flowDir, file), `# ${file}\n`, "utf8");
  }
}

const FIXTURE_DIR = "001-2026-07-01-migration-fixture";

// --- (a) Deterministic v1 -> v2 FlowTask migration (TM-01 §4.2, §5.1) -------

test("migrates a v1 'todo' task to its exact v2 form (TM-01 §5.1 row 1)", async () => {
  await fresh();
  const v1Task = { id: "T4", title: "Self-review and prepare draft PR", kind: "review", status: "todo" };
  await writeRawFlow(FIXTURE_DIR, baseRawFlow([v1Task]));

  // biome-ignore lint: v2 fields not yet on FlowTask type; TM-03 adds them
  const flow = (await readFlow(ROOT, FIXTURE_DIR)) as any;

  expect(flow.schemaVersion).toBe(2); // normalized in-memory on read, per §4.3
  const migrated = flow.tasks[0];
  expect(migrated).toEqual({
    id: "T4",
    title: "Self-review and prepare draft PR",
    kind: "review",
    status: "todo",
    dependsOn: [],
    attempts: { count: 0, log: [] },
    acRefs: [],
    evidenceRefs: [],
    budget: {},
    // disposition intentionally absent: only meaningful once status is "done" (§2, §6.3).
  });
  expect("disposition" in migrated).toBe(false);
  expect("runLink" in migrated).toBe(false);
});

test("migrates a v1 'in-progress' task, inferring one 'started' attempt from flow.createdAt when no task-specific history exists (TM-01 §4.2)", async () => {
  await fresh();
  const v1Task = { id: "T2", title: "Implement per plan", kind: "implement", status: "in-progress" };
  await writeRawFlow(FIXTURE_DIR, baseRawFlow([v1Task]));

  const flow = (await readFlow(ROOT, FIXTURE_DIR)) as any;
  const migrated = flow.tasks[0];

  expect(migrated).toEqual({
    id: "T2",
    title: "Implement per plan",
    kind: "implement",
    status: "in-progress",
    dependsOn: [],
    attempts: { count: 1, log: [{ at: CREATED_AT, outcome: "started" }] },
    acRefs: [],
    evidenceRefs: [],
    budget: {},
  });
  expect("disposition" in migrated).toBe(false);
});

test("migrates a v1 'done' task with no task-specific history to disposition 'completed' using flow.createdAt (TM-01 §4.2/§5.1 row 3)", async () => {
  await fresh();
  const v1Task = { id: "T3", title: "Add/adjust tests and make them pass", kind: "test", status: "done" };
  await writeRawFlow(FIXTURE_DIR, baseRawFlow([v1Task]));

  const flow = (await readFlow(ROOT, FIXTURE_DIR)) as any;
  const migrated = flow.tasks[0];

  expect(migrated).toEqual({
    id: "T3",
    title: "Add/adjust tests and make them pass",
    kind: "test",
    status: "done",
    dependsOn: [],
    attempts: { count: 1, log: [{ at: CREATED_AT, outcome: "completed" }] },
    disposition: "completed",
    acRefs: [],
    evidenceRefs: [],
    budget: {},
  });
});

test("migrates a v1 'done' task added after flow creation, inferring the attempt timestamp from the EARLIEST matching flow.history[] event (TM-01 §4.2 special case)", async () => {
  await fresh();
  // Styled after the real T5 in .metaproject/flows/002-2026-07-10-gdgraph-java-python-import-resolution.
  const v1Task = {
    id: "T5",
    title: "Gradle source-root resolver (Groovy + Kotlin DSL)",
    kind: "implement",
    status: "done",
  };
  const taskAddedAt = "2026-07-01T01:00:00.000Z";
  const taskDoneAt = "2026-07-01T02:00:00.000Z";
  await writeRawFlow(
    FIXTURE_DIR,
    baseRawFlow(
      [v1Task],
      [
        { at: CREATED_AT, event: "created" },
        { at: taskAddedAt, event: "task-added", detail: "T5: Gradle source-root resolver (Groovy + Kotlin DSL)" },
        { at: taskDoneAt, event: "task-done", detail: "T5: Gradle source-root resolver (Groovy + Kotlin DSL)" },
      ],
    ),
  );

  const flow = (await readFlow(ROOT, FIXTURE_DIR)) as any;
  const migrated = flow.tasks[0];

  // Earliest matching event is "task-added" (01:00), not "task-done" (02:00)
  // and not flow.createdAt (00:00) -- §4.2's "earliest such event" rule.
  expect(migrated.attempts).toEqual({ count: 1, log: [{ at: taskAddedAt, outcome: "completed" }] });
  expect(migrated.disposition).toBe("completed");
});

// --- (b) FlowState migration + no-rewrite-on-read (TM-01 §4.3) --------------

test("normalizes schemaVersion 1 to 2 in-memory but does NOT rewrite flow.json on read (TM-01 §4.1/§4.3)", async () => {
  await fresh();
  const raw = baseRawFlow([
    { id: "T1", title: "Collect remaining context", kind: "context", status: "done" },
  ]);
  await writeRawFlow(FIXTURE_DIR, raw);
  const before = await readFile(path.join(flowsRoot(ROOT), FIXTURE_DIR, "flow.json"), "utf8");

  const flow = (await readFlow(ROOT, FIXTURE_DIR)) as any;
  expect(flow.schemaVersion).toBe(2); // in-memory normalization

  const after = await readFile(path.join(flowsRoot(ROOT), FIXTURE_DIR, "flow.json"), "utf8");
  expect(after).toBe(before); // zero-disruption: no file write happens on a plain read
  expect(JSON.parse(after).schemaVersion).toBe(1); // still v1 on disk until next mutation
});

// --- (d) Backward compatibility: existing flows + check() version gate -----

test("existing v1 flows (shaped like flows 001-003) still load; list/check counts are unchanged", async () => {
  await fresh();
  const service = createFlowService(makeDeps());
  const dir = "001-2026-07-01-legacy-flow";
  const tasks = [
    { id: "T1", title: "Collect remaining context", kind: "context", status: "done" },
    { id: "T2", title: "Implement per plan", kind: "implement", status: "done" },
    { id: "T3", title: "Add/adjust tests and make them pass", kind: "test", status: "done" },
    { id: "T4", title: "Self-review and prepare draft PR", kind: "review", status: "done" },
  ];
  await writeRawFlow(dir, {
    ...baseRawFlow(tasks),
    status: "done",
    pr: { url: "https://github.com/acme/app/pull/1" },
  });
  await writeScaffold(dir);

  const summaries = await service.list({ cwd: ROOT });
  expect(summaries).toHaveLength(1);
  expect(summaries[0]?.tasksDone).toBe(4);
  expect(summaries[0]?.tasksTotal).toBe(4);

  const check = await service.check({ cwd: ROOT });
  expect(check.ok).toBe(true);
  expect(check.issues).toEqual([]);
});

test("`check` accepts a schemaVersion 2 flow without flagging 'unknown schemaVersion' (TM-01 §4.3/§5.4 - currently rejects != 1)", async () => {
  await fresh();
  const service = createFlowService(makeDeps());
  const dir = "001-2026-07-01-already-migrated-flow";
  const tasks = [
    {
      id: "T1",
      title: "Collect remaining context",
      kind: "context",
      status: "done",
      dependsOn: [],
      attempts: { count: 1, log: [{ at: CREATED_AT, outcome: "completed" }] },
      disposition: "completed",
      acRefs: [],
      evidenceRefs: [],
      budget: {},
    },
  ];
  await writeRawFlow(dir, {
    ...baseRawFlow(tasks),
    schemaVersion: 2,
    status: "done",
    pr: { url: "https://github.com/acme/app/pull/2" },
  });
  await writeScaffold(dir);

  const check = await service.check({ cwd: ROOT });
  expect(check.issues.some((issue) => issue.kind === "schema")).toBe(false);
});

// --- (c-ish for migration) Negative migration case (TM-01 §4/§8) -----------

test("rejects an unsupported/future schemaVersion deterministically (negative migration case)", async () => {
  await fresh();
  const raw = {
    ...baseRawFlow([{ id: "T1", title: "Collect remaining context", kind: "context", status: "todo" }]),
    schemaVersion: 3,
  };
  await writeRawFlow(FIXTURE_DIR, raw);

  await expect(readFlow(ROOT, FIXTURE_DIR)).rejects.toThrow(/schemaVersion/i);
});
