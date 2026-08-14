import { describe, expect, it } from "vitest";
import pokemonData from "@/app/data/pokedex.json"; 
import { search } from "./search";

describe("search", () => {
  it("finds Pokémon that can learn Sleep Powder", () => {
    const results = search("sleep powder");

    expect(results.length).toBeGreaterThan(0);

    expect(
      results.some(
        (result) =>
          result.pokemon.name === "bulbasaur"
      )
    ).toBe(true);
  });
});