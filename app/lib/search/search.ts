// This becomes the interface to our entire search engine.
import pokemonData from "@/app/data/pokedex.json";
import type { Pokemon } from "@/app/types/pokemon";
import { normalizeText } from "./normalize";
import { parseQuery } from "./query-parser";
import {
  scorePokemon,
  type ScoredResult,
} from "./scoring";

const MAX_RESULTS = 20;

function matchesHardFilters(
  pokemon: Pokemon,
  query: ReturnType<typeof parseQuery>
): boolean {
  // Type is a hard filter.
  if (query.types.length > 0) {
    const hasMatchingType = query.types.every((type) =>
      pokemon.types
        .map(normalizeText)
        .includes(type)
    );

    if (!hasMatchingType) {
      return false;
    }
  }

  // Ability is a hard filter.
  if (query.abilities.length > 0) {
    const hasMatchingAbility = query.abilities.some(
      (ability) =>
        pokemon.abilities
          .map(normalizeText)
          .includes(ability)
    );

    if (!hasMatchingAbility) {
      return false;
    }
  }

  // Move is a hard filter.
  if (query.moves.length > 0) {
    const hasMatchingMove = query.moves.some((move) =>
      pokemon.moves
        .map(normalizeText)
        .includes(move)
    );

    if (!hasMatchingMove) {
      return false;
    }
  }

  return true;
}

function retrieveCandidates(
  query: ReturnType<typeof parseQuery>
): Pokemon[] {
  return pokemonData.pokemon.filter((pokemon) =>
    matchesHardFilters(pokemon, query)
  );
}

export function search(queryText: string): ScoredResult[] {
  const query = parseQuery(queryText);

  if (!query.normalized) {
    return [];
  }

  const candidates = retrieveCandidates(query);

  const scoredResults = candidates
    .map((pokemon) => scorePokemon(pokemon, query))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, MAX_RESULTS);
}