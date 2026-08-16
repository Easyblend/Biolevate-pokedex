import type { Pokemon } from "@/app/types/pokemon";
import type { QueryParsed } from "./query-parser";
import { normalizeText } from "./normalize";

export type ScoredResult = {
  pokemon: Pokemon;
  score: number;
  matchReasons: string[];
};

function formatName(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatName(
  stat: keyof Pokemon["stats"]
): string {
  return stat
    .replace("special-", "Special ")
    .replace("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * ---------------------------------------------------------
 * NAME
 * ---------------------------------------------------------
 *
 * Exact name > prefix > substring
 */
function scoreNameMatch(
  pokemon: Pokemon,
  parsedQuery: QueryParsed
): {
  score: number;
  reasons: string[];
} {
  const name = normalizeText(pokemon.name);

  if (!parsedQuery.normalized || parsedQuery.normalized.length < 3) {
    return {
      score: 0,
      reasons: [],
    };
  }

  if (name === parsedQuery.normalized) {
    return {
      score: 100,
      reasons: ["Exact name match"],
    };
  }

  if (name.startsWith(parsedQuery.normalized)) {
    return {
      score: 80,
      reasons: ["Name starts with your search"],
    };
  }

  if (name.includes(parsedQuery.normalized)) {
    return {
      score: 60,
      reasons: ["Name contains your search"],
    };
  }

  /**
   * Also support partial name terms.
   *
   * Example:
   * "pokemon bulba"
   *
   * The full query doesn't equal "bulbasaur",
   * but "bulba" is still relevant to the name.
   */
  const matchedTerms = parsedQuery.terms.filter(
    (term) =>
      term.length >= 3 &&
      name.includes(term)
  );

  if (matchedTerms.length > 0) {
    return {
      score: Math.min(
        matchedTerms.length * 25,
        50
      ),
      reasons: [
        `Name contains ${matchedTerms
          .map(formatName)
          .join(", ")}`,
      ],
    };
  }

  return {
    score: 0,
    reasons: [],
  };
}

/**
 * ---------------------------------------------------------
 * TYPE
 * ---------------------------------------------------------
 */
function scoreTypeMatch(
  pokemon: Pokemon,
  query: QueryParsed
): {
  score: number;
  reasons: string[];
} {
  if (query.types.length === 0) {
    return {
      score: 0,
      reasons: [],
    };
  }

  const pokemonTypes =
    pokemon.types.map(normalizeText);

  const matchedTypes = query.types.filter(
    (type) => pokemonTypes.includes(type)
  );

  if (matchedTypes.length === 0) {
    return {
      score: 0,
      reasons: [],
    };
  }

  return {
    score: matchedTypes.length * 40,
    reasons: matchedTypes.map(
      (type) => `${formatName(type)} type`
    ),
  };
}

/**
 * ---------------------------------------------------------
 * ABILITY
 * ---------------------------------------------------------
 */
function scoreAbilityMatch(
  pokemon: Pokemon,
  query: QueryParsed
): {
  score: number;
  reasons: string[];
} {
  if (query.abilities.length === 0) {
    return {
      score: 0,
      reasons: [],
    };
  }

  const pokemonAbilities =
    pokemon.abilities.map(normalizeText);

  const matchedAbilities =
    query.abilities.filter((ability) =>
      pokemonAbilities.includes(ability)
    );

  return {
    score: matchedAbilities.length * 35,
    reasons: matchedAbilities.map(
      (ability) =>
        `Has ${formatName(ability)} ability`
    ),
  };
}

/**
 * ---------------------------------------------------------
 * MOVE
 * ---------------------------------------------------------
 */
function scoreMoveMatch(
  pokemon: Pokemon,
  query: QueryParsed
): {
  score: number;
  reasons: string[];
} {
  if (query.moves.length === 0) {
    return {
      score: 0,
      reasons: [],
    };
  }

  const pokemonMoves =
    pokemon.moves.map(normalizeText);

  const matchedMoves = query.moves.filter(
    (move) => pokemonMoves.includes(move)
  );

  if (matchedMoves.length === 0) {
    return {
      score: 0,
      reasons: [],
    };
  }

  return {
    score: matchedMoves.length * 35,
    reasons: matchedMoves.map(
      (move) =>
        `Can learn ${formatName(move)}`
    ),
  };
}

/**
 * ---------------------------------------------------------
 * SPECIES METADATA
 * ---------------------------------------------------------
 *
 * This is where the richer dataset becomes useful.
 *
 * We deliberately search:
 *
 * - genus
 * - color
 * - shape
 * - habitat
 *
 * These are much more reliable than blindly searching
 * every word in the natural-language description.
 *
 * Example:
 *
 * "pokemon that looks like a turtle"
 *
 * terms:
 * ["turtle"]
 *
 * Wartortle:
 *
 * genus = "Turtle Pokémon"
 *
 * => strong match
 */
function scoreSpeciesMetadata(
  pokemon: Pokemon,
  query: QueryParsed
): {
  score: number;
  reasons: string[];
} {
  const {
    genus,
    color,
    shape,
    habitat,
  } = pokemon.species;

  const fields = [
    {
      value: genus,
      label: "genus",
      weight: 35,
    },
    {
      value: color,
      label: "color",
      weight: 15,
    },
    {
      value: shape,
      label: "shape",
      weight: 15,
    },
    {
      value: habitat,
      label: "habitat",
      weight: 15,
    },
  ];

  let score = 0;
  const reasons: string[] = [];

  for (const field of fields) {
    field.value = field.value || "";
    const normalizedValue =
      normalizeText(field.value);

    const matchedTerms = query.terms.filter(
      (term) =>
        term.length >= 3 &&
        normalizedValue.includes(term)
    );

    if (matchedTerms.length === 0) {
      continue;
    }

    /**
     * Don't let multiple matches in one metadata field
     * explode the score.
     */
    score += field.weight;

    reasons.push(
      `${formatName(field.label)} matches ${matchedTerms
        .map(formatName)
        .join(", ")}`
    );
  }

  return {
    score,
    reasons,
  };
}

/**
 * ---------------------------------------------------------
 * STAT
 * ---------------------------------------------------------
 *
 * Stats are ranking preferences.
 *
 * Example:
 *
 * "fast electric pokemon"
 *
 * electric -> hard filter
 * fast     -> speed DESC
 */
function scoreStatMatch(
  pokemon: Pokemon,
  query: QueryParsed
): {
  score: number;
  reasons: string[];
} {
  if (!query.stat) {
    return {
      score: 0,
      reasons: [],
    };
  }

  const value =
    pokemon.stats[query.stat.name];

  /**
   * We normalize the stat value into a small
   * contribution to the overall score.
   *
   * Higher values:
   *     more score when direction = desc
   *
   * Lower values:
   *     more score when direction = asc
   */
  const MAX_STAT = 150;

  const normalized =
    Math.min(value / MAX_STAT, 1);

  const preferenceScore =
    query.stat.direction === "desc"
      ? normalized * 120
      : (1 - normalized) * 30;

  return {
    score: Math.round(preferenceScore),
    reasons: [
      `${formatStatName(query.stat.name)}: ${value}`,
    ],
  };
}

/**
 * ---------------------------------------------------------
 * MAIN SCORER
 * ---------------------------------------------------------
 */
export function scorePokemon(
  pokemon: Pokemon,
  query: QueryParsed
): ScoredResult {
  let score = 0;
  const matchReasons: string[] = [];

  /**
   * Name
   */
  const nameMatch =
    scoreNameMatch(pokemon, query);

  score += nameMatch.score;
  matchReasons.push(...nameMatch.reasons);

  /**
   * Type
   */
  const typeMatch =
    scoreTypeMatch(pokemon, query);

  score += typeMatch.score;
  matchReasons.push(...typeMatch.reasons);

  /**
   * Ability
   */
  const abilityMatch =
    scoreAbilityMatch(pokemon, query);

  score += abilityMatch.score;
  matchReasons.push(...abilityMatch.reasons);

  /**
   * Move
   */
  const moveMatch =
    scoreMoveMatch(pokemon, query);

  score += moveMatch.score;
  matchReasons.push(...moveMatch.reasons);

  /**
   * Species metadata
   *
   * genus / color / shape / habitat
   */
  const speciesMatch =
    scoreSpeciesMetadata(pokemon, query);

  score += speciesMatch.score;
  matchReasons.push(
    ...speciesMatch.reasons
  );

  /**
   * Stats
   */
  const statMatch =
    scoreStatMatch(pokemon, query);

  score += statMatch.score;
  matchReasons.push(
    ...statMatch.reasons
  );

  return {
    pokemon,
    score,
    matchReasons,
  };
}