import { expect, test } from "bun:test";
import { formatFleetSidebar, shortWorkerLabel, WorkerFleet } from "./worker-fleet";

test("shortWorkerLabel strips path and .md", () => {
  expect(shortWorkerLabel("components/src-wiki.md")).toBe("src-wiki");
  expect(shortWorkerLabel("src-foo")).toBe("src-foo");
});

test("formatFleetSidebar idle and ordered glyphs", () => {
  expect(formatFleetSidebar([])).toBe("(idle)");
  const text = formatFleetSidebar([
    { id: "a", label: "page-a", status: "done" },
    { id: "b", label: "page-b", status: "running", detail: "model" },
    { id: "c", label: "page-c", status: "failed", detail: "validate" },
    { id: "d", label: "page-d", status: "queued" },
  ]);
  expect(text).toContain("1 run");
  expect(text).toContain("1 ok");
  expect(text).toContain("1 fail");
  // running before done
  const runIdx = text.indexOf("◐");
  const doneIdx = text.indexOf("●");
  expect(runIdx).toBeGreaterThanOrEqual(0);
  expect(doneIdx).toBeGreaterThan(runIdx);
});

test("WorkerFleet upsert and subscribe", () => {
  const fleet = new WorkerFleet();
  let n = 0;
  const unsub = fleet.subscribe(() => {
    n += 1;
  });
  fleet.upsert({ id: "w1", label: "one", status: "queued" });
  fleet.upsert({ id: "w1", label: "one", status: "running", detail: "model" });
  expect(fleet.list()).toHaveLength(1);
  expect(fleet.list()[0]?.status).toBe("running");
  expect(n).toBe(2);
  fleet.clear();
  expect(fleet.list()).toHaveLength(0);
  unsub();
});
