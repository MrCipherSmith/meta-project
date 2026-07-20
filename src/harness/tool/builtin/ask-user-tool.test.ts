import { expect, test } from "bun:test";
import { createAskUserTool } from "./ask-user-tool";

test("ask_user returns chosen option from host callback", async () => {
  const tool = createAskUserTool(async (req) => {
    expect(req.question).toContain("scope");
    expect(req.options.length).toBe(2);
    return req.options[0]!.id;
  });
  const result = await tool.invoke({
    question: "What is the scope?",
    options: [
      { id: "a", label: "MVP", description: "Smallest ship", recommended: true },
      { id: "b", label: "Full", description: "Everything" },
    ],
  });
  expect(result.isError).toBe(false);
  expect(result.output).toContain('id="a"');
  expect(result.output).toContain("recommended");
});

test("ask_user rejects bad input", async () => {
  const tool = createAskUserTool(async () => "x");
  expect((await tool.invoke({ question: "", options: [] })).isError).toBe(true);
  expect(
    (
      await tool.invoke({
        question: "q",
        options: [{ id: "only", label: "One" }],
      })
    ).isError,
  ).toBe(true);
});

test("ask_user surfaces cancel", async () => {
  const tool = createAskUserTool(async () => "__cancel__");
  const result = await tool.invoke({
    question: "Continue?",
    options: [
      { id: "y", label: "Yes", description: "" },
      { id: "n", label: "No", description: "" },
    ],
  });
  expect(result.isError).toBe(true);
  expect(result.output).toMatch(/cancel/i);
});
