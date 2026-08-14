/**
 * Query parser
 *
 * The parser separates:
 *
 * 1. Explicit filters
 *    - types
 *    - abilities
 *    - moves
 *    - species metadata
 *
 * 2. Ranking preferences
 *    - stats such as speed / attack / defense
 *
 * 3. Remaining lexical terms
 *    - useful for name matching and future concept search
 *
 * Example:
 *
 * "fast electric pokemon"
 *
 * {
 *   types: ["electric"],
 *   stat: {
 *     name: "speed",
 *     direction: "desc"
 *   }
 * }
 *
 * Example:
 *
 * "a blue electric pokemon that lives in water"
 *
 * {
 *   types: ["electric"],
 *   species: {
 *     colors: ["blue"],
 *     habitats: ["water"]
 *   }
 * }
 */

import pokemonData from "@/app/data/pokedex.json";
import type { PokemonStats } from "@/app/types/pokemon";
import { normalizeText, tokenize } from "./normalize";

/* =========================================================
   TYPES
   ========================================================= */

export type SearchIntent =
  | "name"
  | "type"
  | "ability"
  | "move"
  | "stat"
  | "species"
  | "general";

export type SpeciesFilters = {
  colors: string[];
  habitats: string[];
  genera: string[];
};

export type SearchQuery = {
  raw: string;
  normalized: string;
  terms: string[];

  /**
   * Kept for backwards compatibility / UI explanation.
   *
   * This should not be treated as the complete description
   * of the query because a query can contain multiple
   * kinds of constraints.
   */
  intent: SearchIntent;

  types: string[];
  abilities: string[];
  moves: string[];

  species: SpeciesFilters;

  stat?: {
    name: keyof PokemonStats;
    direction: "asc" | "desc";
  };
};

/* =========================================================
   DATA-DERIVED VOCABULARY
   ========================================================= */

const pokemon = pokemonData.pokemon;

const knownTypes = new Set(
  pokemon.flatMap((pokemon) =>
    pokemon.types.map(normalizeText)
  )
);

const knownAbilities = new Set(
  pokemon.flatMap((pokemon) =>
    pokemon.abilities.map(normalizeText)
  )
);

const knownMoves = new Set(
  pokemon.flatMap((pokemon) =>
    pokemon.moves.map(normalizeText)
  )
);

const knownColors = new Set(
  pokemon
    .map((pokemon) =>
      normalizeText(pokemon.species.color)
    )
    .filter(Boolean)
);

const knownHabitats = new Set(
  pokemon
    .map((pokemon) =>
      normalizeText(pokemon.species.habitat)
    )
    .filter(Boolean)
);

const knownGenera = new Set(
  pokemon
    .map((pokemon) =>
      normalizeText(pokemon.species.genus)
    )
    .filter(Boolean)
);

/* =========================================================
   STAT VOCABULARY
   ========================================================= */

const statAliases: Record<
  string,
  keyof PokemonStats
> = {
  speed: "speed",
  fast: "speed",
  fastest: "speed",
  quick: "speed",
  quickest: "speed",

  slow: "speed",
  slowest: "speed",

  attack: "attack",
  strong: "attack",
  strength: "attack",
  powerful: "attack",

  defense: "defense",
  defensive: "defense",
  tanky: "defense",

  hp: "hp",
  health: "hp",

  "special attack": "special-attack",
  "special-atk": "special-attack",

  "special defense": "special-defense",
  "special-def": "special-defense",
};

const descendingStatTerms = new Set([
  "fast",
  "fastest",
  "quick",
  "quickest",
  "strong",
  "powerful",
  "high",
  "highest",
  "best",
]);

const ascendingStatTerms = new Set([
  "slow",
  "slowest",
  "weak",
  "poor",
  "low",
  "lowest",
]);

/* =========================================================
   HELPERS
   ========================================================= */

/**
 * Find all known moves contained in the normalized query.
 *
 * We return multiple moves instead of stopping at the first
 * match.
 *
 * Example:
 *
 * "sleep powder and toxic"
 *
 * -> ["sleep powder", "toxic"]
 */

// no sleep powder and toxic
// function findKnownMoves(
//   normalizedQuery: string
// ): string[] {
//   return Array.from(knownMoves)
//     .filter((move) =>
//       normalizedQuery.includes(move)
//     )
//     .sort(
//       (a, b) => b.length - a.length
//     );
// }
function findKnownMoves(
  normalizedQuery: string
): string[] {
  return Array.from(knownMoves)
    .filter((move) => {
      return (
        move === normalizedQuery ||
        move.includes(normalizedQuery) ||
        normalizedQuery.includes(move)
      );
    })
    .sort((a, b) => {
      // Exact matches first
      if (a === normalizedQuery) return -1;
      if (b === normalizedQuery) return 1;

      // Then prefer shorter matches
      return a.length - b.length;
    });
}

/**
 * Find all known abilities contained in the query.
 */
function findKnownAbilities(
  normalizedQuery: string
): string[] {
  return Array.from(knownAbilities)
    .filter((ability) =>
      normalizedQuery.includes(ability)
    )
    .sort(
      (a, b) => b.length - a.length
    );
}

/**
 * Find stat preference.
 *
 * "fast pokemon"
 * -> speed / desc
 *
 * "slow pokemon"
 * -> speed / asc
 *
 * "strong pokemon"
 * -> attack / desc
 */
function findStat(
  terms: string[]
): SearchQuery["stat"] | undefined {
  for (const [alias, stat] of Object.entries(
    statAliases
  )) {
    if (!terms.includes(alias)) {
      continue;
    }

    const direction = terms.some((term) =>
      descendingStatTerms.has(term)
    )
      ? "desc"
      : terms.some((term) =>
          ascendingStatTerms.has(term)
        )
      ? "asc"
      : "desc";

    return {
      name: stat,
      direction,
    };
  }

  return undefined;
}

/* =========================================================
   SPECIES METADATA
   ========================================================= */

/**
 * Extract explicit color constraints.
 *
 * "blue electric pokemon"
 *
 * -> ["blue"]
 */
function findColors(
  terms: string[]
): string[] {
  return terms.filter((term) =>
    knownColors.has(term)
  );
}

/**
 * Extract explicit habitat constraints.
 *
 * We intentionally support contextual phrases such as:
 *
 * "lives in water"
 * "found in water"
 * "lives near water"
 *
 * rather than blindly treating every occurrence of
 * "water" as the Water Pokémon type.
 */
function findHabitats(
  normalizedQuery: string,
  terms: string[]
): string[] {
  const habitats: string[] = [];

  for (const habitat of knownHabitats) {
    /**
     * Direct habitat mention.
     *
     * Example:
     *
     * "water habitat"
     */
    if (
      normalizedQuery.includes(
        `${habitat} habitat`
      )
    ) {
      habitats.push(habitat);
      continue;
    }

    /**
     * Natural-language habitat phrases.
     *
     * Example:
     *
     * "lives in water"
     * "found in water"
     * "lives near water"
     * "found near water"
     */
    const habitatPatterns = [
      `lives in ${habitat}`,
      `live in ${habitat}`,
      `found in ${habitat}`,
      `lives near ${habitat}`,
      `live near ${habitat}`,
      `found near ${habitat}`,
      `near ${habitat}`,
      `in ${habitat}`,
    ];

    if (
      habitatPatterns.some((pattern) =>
        normalizedQuery.includes(pattern)
      )
    ) {
      habitats.push(habitat);
    }
  }

  return [...new Set(habitats)];
}

/**
 * Find genus terms.
 *
 * The dataset contains values such as:
 *
 * "Turtle Pokémon"
 * "Mouse Pokémon"
 * "Dragon Pokémon"
 *
 * We search the normalized genus for individual query
 * terms rather than requiring the user to type the entire
 * genus.
 *
 * "pokemon that looks like a turtle"
 *
 * -> genus: "turtle pokemon"
 */
function findGenera(
  terms: string[]
): string[] {
  return Array.from(knownGenera).filter(
    (genus) => {
      const genusTerms = tokenize(genus);

      return null;
    }
  );
}

/* =========================================================
   TYPE DETECTION
   ========================================================= */

/**
 * Determine which known Pokémon types are explicit
 * type constraints.
 *
 * Important:
 *
 * "blue electric pokemon that lives in water"
 *
 * should produce:
 *
 * types = ["electric"]
 *
 * NOT:
 *
 * types = ["electric", "water"]
 *
 * because "water" is being used in a habitat phrase.
 */
function findTypes(
  normalizedQuery: string,
  terms: string[]
): string[] {
  const habitats = findHabitats(
    normalizedQuery,
    terms
  );

  const types = terms.filter((term) =>
    knownTypes.has(term)
  );

  /**
   * Remove a type when the same word is clearly being
   * used as a habitat.
   *
   * Example:
   *
   * "lives in water"
   *
   * water = habitat
   * not Water type
   */
  return types.filter(
    (type) => !habitats.includes(type)
  );
}

/* =========================================================
   INTENT
   ========================================================= */

function detectIntent(
  types: string[],
  abilities: string[],
  moves: string[],
  species: SpeciesFilters,
  stat: SearchQuery["stat"],
  normalizedQuery: string
): SearchIntent {
  if (types.length > 0) {
    return "type";
  }

  if (abilities.length > 0) {
    return "ability";
  }

  if (moves.length > 0) {
    return "move";
  }

  if (
    species.colors.length > 0 ||
    species.habitats.length > 0 ||
    species.genera.length > 0
  ) {
    return "species";
  }

  if (stat) {
    return "stat";
  }

  if (normalizedQuery.length > 0) {
    return "name";
  }

  return "general";
}

/* =========================================================
   PUBLIC PARSER
   ========================================================= */

export function parseQuery(
  query: string
): SearchQuery {
  const normalized =
    normalizeText(query);

  const terms = tokenize(normalized);

  /**
   * Detect metadata first because context matters.
   *
   * Example:
   *
   * "lives in water"
   *
   * must be recognized as habitat before "water"
   * is interpreted as a Pokémon type.
   */
  const species: SpeciesFilters = {
    colors: findColors(terms),

    habitats: findHabitats(
      normalized,
      terms
    ),

    genera: findGenera(terms),
  };

  const types = findTypes(
    normalized,
    terms
  );

  const abilities =
    findKnownAbilities(normalized);

  const moves =
    findKnownMoves(normalized);

  const stat = findStat(terms);

  const intent = detectIntent(
    types,
    abilities,
    moves,
    species,
    stat,
    normalized
  );

  return {
    raw: query,
    normalized,
    terms,

    intent,

    types,
    abilities,
    moves,

    species,

    stat,
  };
}