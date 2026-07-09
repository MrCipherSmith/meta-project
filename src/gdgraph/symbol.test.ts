import { expect, test } from "bun:test";
import { querySymbol, resolveSymbols } from "./symbol";
import type { GraphData, SymbolNode, CallEdge } from "./types";

function sym(id: string, name: string, path: string, startLine: number): SymbolNode {
  return { id, kind: "function", path, name, container: null, startLine, endLine: startLine + 5, language: "typescript" };
}
function call(from: string, to: string, resolved: boolean): CallEdge {
  return { id: `${from}->${to}`, from, to, kind: resolved ? "calls" : "unresolved-call", resolved };
}

const A = sym("src/a.ts#foo", "foo", "src/a.ts", 10);
const B = sym("src/b.ts#bar", "bar", "src/b.ts", 20);
const C = sym("src/c.ts#Foo", "Foo", "src/c.ts", 5);

const GRAPH: GraphData = {
  nodes: [],
  edges: [],
  symbols: [A, B, C],
  calls: [
    call("src/b.ts#bar", "src/a.ts#foo", true), // bar calls foo
    call("src/a.ts#foo", "src/c.ts#Foo", true), // foo calls Foo
    call("src/a.ts#foo", "someUnknown.method", false), // foo calls unresolved
  ],
};

test("resolveSymbols prefers exact name, then case-insensitive, then substring", () => {
  expect(resolveSymbols(GRAPH.symbols!, "foo").map((s) => s.id)).toEqual(["src/a.ts#foo"]);
  // case-insensitive tier only when no exact: "FOO" -> foo (exact 'foo'? no; ci matches foo AND Foo)
  const ci = resolveSymbols(GRAPH.symbols!, "FOO").map((s) => s.name).sort();
  expect(ci).toEqual(["Foo", "foo"]);
  // substring tier
  expect(resolveSymbols(GRAPH.symbols!, "ba").map((s) => s.name)).toEqual(["bar"]);
});

test("querySymbol returns definition, callers, and callees", () => {
  const r = querySymbol(GRAPH, "foo");
  expect(r.definitions.map((d) => d.id)).toEqual(["src/a.ts#foo"]);
  // bar calls foo -> caller
  expect(r.callers.map((c) => c.label)).toEqual(["bar (src/b.ts:20)"]);
  // foo calls Foo (resolved) + someUnknown.method (unresolved)
  const labels = r.callees.map((c) => c.label);
  expect(labels).toContain("Foo (src/c.ts:5)");
  expect(labels).toContain("someUnknown.method");
  const unresolved = r.callees.find((c) => c.label === "someUnknown.method");
  expect(unresolved?.resolved).toBe(false);
});

test("querySymbol on no match returns empty definitions", () => {
  expect(querySymbol(GRAPH, "nonexistent").definitions).toEqual([]);
});

test("querySymbol tolerates a graph with no symbol layer", () => {
  const r = querySymbol({ nodes: [], edges: [] }, "foo");
  expect(r.definitions).toEqual([]);
  expect(r.callers).toEqual([]);
});
