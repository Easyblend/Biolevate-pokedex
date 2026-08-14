"use client";

import { useState } from "react";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import type { ScoredResult } from "./lib/search/scoring";

export default function Home() {
  const [input, setInput] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState<ScoredResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(searchQuery: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? "Something went wrong.");
        setResults([]);
        return;
      }

      setSearchedQuery(data.query);
      setResults(data.results);
    } catch {
      setError("Unable to connect to the search service.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-20">
        <header className="mb-10 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-500">
            Pokédex Search
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
            Find what you’re looking for.
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-zinc-500">
            Search Pokémon, moves, abilities, types, and more, even if you
            don't remember exactly what you're looking for.
          </p>
        </header>

        <SearchBar
          query={input}
          onQueryChange={setInput}
          onSearch={handleSearch}
        />

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["bulba", "fast electric pokemon", "sleep"].map((example) => (
            <button
              key={example}
              onClick={() => {
                setInput(example);
                handleSearch(example);
              }}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="mt-12">
          {loading && (
            <div className="py-16 text-center text-sm text-zinc-400">
              Searching...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && searchedQuery && (
            <SearchResults
              results={results}
              query={searchedQuery}
            />
          )}

          {!loading && !error && !searchedQuery && (
            <div className="py-16 text-center text-sm text-zinc-400">
              Start searching to explore the Pokédex.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}