/**
 *Aime of this file is to return an object like this:
  *
  * Parsed query: {
  raw: 'fast electric pokemon',
  normalized: 'fast electric pokemon',
  terms: [ 'fast', 'electric' ],
  intent: 'type',
  types: [ 'electric' ],
  abilities: [],
  moves: [],
  species: { colors: [], habitats: [], genera: [] },
  stat: { name: 'speed', direction: 'desc' }
}
  for the query "fast electric pokemon".
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

export type QueryParsed = {
  raw: string;
  normalized: string;
  terms: string[];

  intent: SearchIntent[];

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

function findMoves(
  normalizedQuery: string
): string[] {
  if(normalizedQuery.length < 3) {
    return [];
  }
  return Array.from(knownMoves)
    .filter((move) => {
      return (
        move === normalizedQuery ||
        normalizedQuery.includes(move) ||
        move.startsWith(normalizedQuery)
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


// For : fast electric pokemon with levitate and chlorophyll
// known ability : ["levitate", "chlorophyll"]
function findAbilities(
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

// Known stats: { name: 'speed', direction: 'desc' }
function findStats(
  terms: string[]
): QueryParsed["stat"] | undefined {
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
 * The dataset genus contains values such as:
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

      return terms.some((term) =>
        genusTerms.includes(term)
      );
    });
}

/* =========================================================
   TYPE DETECTION
   ========================================================= */

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
  stat: QueryParsed["stat"],
  normalizedQuery: string
): SearchIntent[] {

  const allIntents: SearchIntent[] = [];
  if (types.length > 0) {
    allIntents.push("type");
  }

  if (abilities.length > 0) {
    allIntents.push("ability");
  }

  if (moves.length > 0) {
    allIntents.push("move");
  }

  if (
    species.colors.length > 0 ||
    species.habitats.length > 0 ||
    species.genera.length > 0
  ) {
    allIntents.push("species");
  }

  if (stat) {
    allIntents.push("stat");
  }

  if (normalizedQuery.length > 3 && allIntents.length === 0) {
    allIntents.push("general");
  }

  return allIntents;
}

/* =========================================================
   PUBLIC PARSER
   ========================================================= */

export function parseQuery(
  query: string
): QueryParsed {
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
    findAbilities(normalized);

  const moves =
    findMoves(normalized);

  const stat = findStats(terms);

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