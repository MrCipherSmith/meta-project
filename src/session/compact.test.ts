import { expect, test } from "bun:test";
import { compactMessages, indexOfKeepFrom } from "./compact";
import type { NormalizedMessage } from "../harness/provider/types";

function u(content: string): NormalizedMessage {
  return { role: "user", content, provenance: "project" };
}
function a(content: string): NormalizedMessage {
  return { role: "assistant", content, provenance: "model" };
}
function t(content: string): NormalizedMessage {
  return { role: "tool", content, provenance: "tool" };
}

test("indexOfKeepFrom finds the Nth last user turn", () => {
  const h = [u("1"), a("a1"), u("2"), a("a2"), u("3"), a("a3")];
  expect(indexOfKeepFrom(h, 2)).toBe(2); // starts at user "2"
  expect(indexOfKeepFrom(h, 10)).toBe(0);
  expect(indexOfKeepFrom(h, 0)).toBe(h.length);
});

test("compactMessages is noop when history is short", () => {
  const h = [u("only"), a("one")];
  const r = compactMessages(h, { keepLastUserTurns: 3 });
  expect(r.noop).toBe(true);
  expect(r.removed).toBe(0);
  expect(r.context).toEqual(h);
});

test("compactMessages keeps last user turns and summarizes the rest", () => {
  const h = [
    u("first task"),
    a("ok1"),
    t("tool out"),
    u("second task"),
    a("ok2"),
    u("third task"),
    a("ok3"),
    u("fourth"),
    a("ok4"),
  ];
  const r = compactMessages(h, { keepLastUserTurns: 2, focus: "auth" });
  expect(r.noop).toBe(false);
  expect(r.removed).toBeGreaterThan(0);
  expect(r.context[0]?.role).toBe("user");
  expect(r.context[0]?.content).toContain("Compacted earlier context");
  expect(r.context[0]?.content).toContain("Focus: auth");
  expect(r.context[0]?.content).toContain("first task");
  // last two user turns retained
  expect(r.context.some((m) => m.content === "third task")).toBe(true);
  expect(r.context.some((m) => m.content === "fourth")).toBe(true);
  expect(r.context.some((m) => m.content === "first task" && m !== r.context[0])).toBe(false);
});
