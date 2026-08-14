/**
 * Public entry point for the search engine.
 *
 * Pipeline:
 *
 * Query
 *   ↓
 * Parse
 *   ↓
 * Retrieve candidates using explicit constraints
 *   ↓
 * Score candidates using softer relevance signals
 *   ↓
 * Rank
 *   ↓
 * Return top results
 */

import pokemonData from "@/app/data/pokedex.json";

import type { Pokemon } from "@/app/types/pokemon";

import { normalizeText } from "./normalize";
import { parseQuery } from "./query-parser";

import {
  scorePokemon,
  type ScoredResult,
} from "./scoring";

const MAX_RESULTS = 20;

/**
 * ---------------------------------------------------------
 * SPECIES FILTERS
 * ---------------------------------------------------------
 */

function matchesSpeciesFilters(
  pokemon: Pokemon,
  query: ReturnType<typeof parseQuery>
): boolean {
  /**
   * COLOR
   *
   * Example:
   *
   * "blue pokemon"
   *
   * If the query explicitly specifies one or more colors,
   * the Pokémon must satisfy them.
   */
  if (query.species.colors.length > 0) {
    const pokemonColor = normalizeText(
      pokemon.species.color
    );

    const matchesColor =
      query.species.colors.every(
        (color) => pokemonColor === color
      );

    if (!matchesColor) {
      return false;
    }
  }

  /**
   * HABITAT
   *
   * Example:
   *
   * "pokemon that lives in water"
   *
   * The Pokémon must have the requested habitat.
   */
  if (query.species.habitats.length > 0) {
    if (!pokemon.species.habitat) {
      return false;
    }
    const pokemonHabitat = normalizeText(
      pokemon.species.habitat
    );

    const matchesHabitat =
      query.species.habitats.every(
        (habitat) =>
          pokemonHabitat === habitat
      );

    if (!matchesHabitat) {
      return false;
    }
  }

  /**
   * GENUS
   *
   * Example:
   *
   * "pokemon that looks like a turtle"
   *
   * Genus:
   * "Turtle Pokémon"
   *
   * We treat genus as an explicit descriptive constraint.
   */
  if (query.species.genera.length > 0) {
    const pokemonGenus = normalizeText(
      pokemon.species.genus
    );

    const matchesGenus =
      query.species.genera.some(
        (genus) =>
          pokemonGenus === genus ||
          pokemonGenus.includes(genus) ||
          genus.includes(pokemonGenus)
      );

    if (!matchesGenus) {
      return false;
    }
  }

  return true;
}

/**
 * ---------------------------------------------------------
 * TYPE FILTER
 * ---------------------------------------------------------
 */

function matchesTypeFilter(
  pokemon: Pokemon,
  query: ReturnType<typeof parseQuery>
): boolean {
  if (query.types.length === 0) {
    return true;
  }

  const pokemonTypes =
    pokemon.types.map(normalizeText);

  /**
   * Multiple explicit types mean the Pokémon must
   * satisfy all requested types.
   *
   * Example:
   *
   * "water poison pokemon"
   *
   * requires:
   *
   * Water AND Poison
   */
  return query.types.every((type) =>
    pokemonTypes.includes(type)
  );
}

/**
 * ---------------------------------------------------------
 * ABILITY FILTER
 * ---------------------------------------------------------
 */

function matchesAbilityFilter(
  pokemon: Pokemon,
  query: ReturnType<typeof parseQuery>
): boolean {
  if (query.abilities.length === 0) {
    return true;
  }

  const pokemonAbilities =
    pokemon.abilities.map(normalizeText);

  /**
   * Multiple explicit abilities are treated as
   * simultaneous constraints.
   *
   * Example:
   *
   * "pokemon with ability A and ability B"
   */
  return query.abilities.every(
    (ability) =>
      pokemonAbilities.includes(ability)
  );
}

/**
 * ---------------------------------------------------------
 * MOVE FILTER
 * ---------------------------------------------------------
 */

function matchesMoveFilter(
  pokemon: Pokemon,
  query: ReturnType<typeof parseQuery>
): boolean {
  if (query.moves.length === 0) {
    return true;
  }

  const pokemonMoves =
    pokemon.moves.map(normalizeText);

  /**
   * Multiple explicit moves mean the Pokémon must
   * have all of them.
   *
   * Example:
   *
   * "pokemon with tackle and toxic"
   */
  return query.moves.every((move) =>
    pokemonMoves.includes(move)
  );
}

/**
 * ---------------------------------------------------------
 * HARD FILTER PIPELINE
 * ---------------------------------------------------------
 */

function matchesHardFilters(
  pokemon: Pokemon,
  query: ReturnType<typeof parseQuery>
): boolean {
  /**
   * Type
   */
  if (!matchesTypeFilter(pokemon, query)) {
    return false;
  }

  /**
   * Ability
   */
  if (!matchesAbilityFilter(pokemon, query)) {
    return false;
  }

  /**
   * Move
   */
  if (!matchesMoveFilter(pokemon, query)) {
    return false;
  }

  /**
   * Species metadata:
   *
   * - color
   * - habitat
   * - genus
   */
  if (!matchesSpeciesFilters(pokemon, query)) {
    return false;
  }

  return true;
}

/**
 * ---------------------------------------------------------
 * CANDIDATE RETRIEVAL
 * ---------------------------------------------------------
 *
 * The retrieval stage answers:
 *
 * "Which Pokémon are eligible to compete?"
 *
 * It should NOT decide final ranking.
 */
function retrieveCandidates(
  query: ReturnType<typeof parseQuery>
): Pokemon[] {
  return pokemonData.pokemon.filter(
    (pokemon) =>
      matchesHardFilters(pokemon, query)
  );
}

/**
 * ---------------------------------------------------------
 * PUBLIC SEARCH FUNCTION
 * ---------------------------------------------------------
 */

export function search(
  queryText: string
): ScoredResult[] {
  const query = parseQuery(queryText);

  console.log("Parsed query:", query);
  /**
   * Empty query should never reach scoring.
   */
  if (!query.normalized) {
    return [];
  }

  /**
   * Stage 1:
   *
   * Retrieve only Pokémon satisfying explicit
   * constraints.
   */
  const candidates =
    retrieveCandidates(query);

  /**
   * Stage 2:
   *
   * Score the remaining candidates.
   *
   * Examples:
   *
   * "fast electric pokemon"
   *
   * Electric → hard filter
   * Fast     → Speed ranking
   *
   * Species metadata may also provide additional
   * explanatory/relevance signals.
   */
  const scoredResults = candidates
    .map((pokemon) =>
      scorePokemon(pokemon, query)
    )
    .filter(
      (result) => result.score > 0
    )
    .sort(
      (a, b) => b.score - a.score
    );

  /**
   * Stage 3:
   *
   * Keep the response intentionally small.
   */
  return scoredResults.slice(
    0,
    MAX_RESULTS
  );
}