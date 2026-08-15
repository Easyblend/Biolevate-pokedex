import { describe, expect, it } from "vitest";
import { search } from "./search";

describe("search", () => {
  it("finds Pokémon by partial name", () => {
    const results = search("pika");

    expect(
      results.some(
        (result) => result.pokemon.name === "pikachu"
      )
    ).toBe(true);
  });

  it("finds Pokémon that can learn Sleep Powder", () => {
    const results = search("sleep powder");

    expect(results.length).toBeGreaterThan(0);

    expect(
      results.some(
        (result) => result.pokemon.name === "bulbasaur"
      )
    ).toBe(true);
  });
});