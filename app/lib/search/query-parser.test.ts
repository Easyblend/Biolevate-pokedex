import { describe, expect, it } from "vitest";
import { parseQuery } from "./query-parser";

describe("parseQuery", () => {
  it("identifies a type and stat preference", () => {
    const result = parseQuery(
      "fast electric pokemon"
    );

    expect(result.types).toEqual([
      "electric",
    ]);

    expect(result.stat).toEqual({
      name: "speed",
      direction: "desc",
    });
  });

  it("identifies a partial move name", () => {
    const result = parseQuery("sleep");

    expect(result.moves).toContain(
      "sleep powder"
    );
  });

  it("interprets water as a habitat when used with lives in", () => {
    const result = parseQuery(
      "Yellow electric pokemon that lives in water"
    );

    expect(result.types).toEqual([
      "electric",
    ]);

    expect(result.species.colors).toContain(
      "yellow"
    );

    expect(result.species.habitats).toContain(
      "water"
    );

    expect(result.types).not.toContain(
      "water"
    );
  });
});