import type { CallEdge, GraphData, SymbolNode } from "./types";

// Symbol-level query over the (optional) tree-sitter layer: "where is X defined /
// who calls X / what does X call". Pure over the in-memory graph; the CLI layer
// handles the "symbol layer not active" case when `graph.symbols` is absent.

export interface SymbolRef {
  // Display label: "name (path:line)" for a resolved symbol, else the raw token.
  label: string;
  resolved: boolean;
}

export interface SymbolQueryResult {
  query: string;
  definitions: SymbolNode[];
  callers: SymbolRef[];
  callees: SymbolRef[];
}

// Resolve a name to matching symbols: exact name, then case-insensitive, then
// substring — stopping at the first tier that yields hits so precise names win.
export function resolveSymbols(symbols: SymbolNode[], name: string, limit = 25): SymbolNode[] {
  const q = name.trim();
  if (!q) return [];
  const lower = q.toLowerCase();

  const exact = symbols.filter((s) => s.name === q);
  if (exact.length > 0) return exact.slice(0, limit);

  const ci = symbols.filter((s) => s.name.toLowerCase() === lower);
  if (ci.length > 0) return ci.slice(0, limit);

  return symbols.filter((s) => s.name.toLowerCase().includes(lower)).slice(0, limit);
}

function labelFor(token: string, byId: Map<string, SymbolNode>): SymbolRef {
  const symbol = byId.get(token);
  if (symbol) {
    return { label: `${symbol.name} (${symbol.path}:${symbol.startLine})`, resolved: true };
  }
  return { label: token, resolved: false };
}

function dedupeRefs(refs: SymbolRef[]): SymbolRef[] {
  const seen = new Set<string>();
  const out: SymbolRef[] = [];
  for (const ref of refs) {
    if (seen.has(ref.label)) continue;
    seen.add(ref.label);
    out.push(ref);
  }
  return out;
}

export function querySymbol(graph: GraphData, name: string): SymbolQueryResult {
  const symbols = graph.symbols ?? [];
  const calls = graph.calls ?? [];
  const definitions = resolveSymbols(symbols, name);
  const ids = new Set(definitions.map((s) => s.id));
  const byId = new Map(symbols.map((s) => [s.id, s]));

  const callEdges = calls.filter((c: CallEdge) => c.kind === "calls" || c.kind === "unresolved-call");
  const callers = dedupeRefs(
    callEdges.filter((c) => ids.has(c.to)).map((c) => labelFor(c.from, byId)),
  ).sort((a, b) => a.label.localeCompare(b.label));
  const callees = dedupeRefs(
    callEdges.filter((c) => ids.has(c.from)).map((c) => labelFor(c.to, byId)),
  ).sort((a, b) => a.label.localeCompare(b.label));

  return { query: name, definitions, callers, callees };
}
