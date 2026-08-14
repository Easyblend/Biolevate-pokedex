"use client";

import { useState } from "react";
import type { ScoredResult } from "../lib/search/scoring";
import SearchResultCard from "./SearchResultCard";
import PokemonDetailModal from "./PokemonDetailModal";

type SearchResultsProps = {
  results: ScoredResult[];
  query: string;
};

export default function SearchResults({
  results,
  query,
}: SearchResultsProps) {
  const [selectedResult, setSelectedResult] =
    useState<ScoredResult | null>(null);

  if (results.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-zinc-900">
          No results found
        </p>

        <p className="mt-2 text-sm text-zinc-500">
          Try a Pokémon name, type, move, ability, or
          a more general description.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            {results.length}{" "}
            {results.length === 1
              ? "result"
              : "results"}{" "}
            for
            “{query}”
          </p>

        </div>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <SearchResultCard
            key={result.pokemon.id}
            result={result}
            onSelect={() =>
              setSelectedResult(result)
            }
          />
        ))}
      </div>

      {selectedResult && (
        <PokemonDetailModal
          pokemon={selectedResult.pokemon}
          onClose={() =>
            setSelectedResult(null)
          }
        />
      )}
    </>
  );
}