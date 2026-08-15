import { describe, expect, it } from "vitest";
import { parseQuery } from "./query-parser";


// ✓ type + stat
// ✓ move
// ✓ ability

describe("parseQuery", () => {
  it("identifies a type and stat preference", () => {
    const result = parseQuery("fast electric pokemon");

    expect(result.types).toEqual(["electric"]);

    expect(result.stat).toEqual({
      name: "speed",
      direction: "desc",
    });

    expect(result.abilities).toEqual([]);
    expect(result.moves).toEqual([]);
  });
});

it("identifies a move", () => {
  const result = parseQuery("sleep powder");

  expect(result.moves).toContain("sleep powder");

    expect(result.types).toEqual([]);
    expect(result.stat).toBeUndefined();
    expect(result.abilities).toEqual([]);
});


it("identifies an ability", () => {
  const result = parseQuery("overgrow");

  expect(result.abilities).toContain("overgrow");
});