"use client";

import { FormEvent } from "react";

type SearchBarProps = {
  onSearch: (query: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
};

export default function SearchBar({ onSearch, query, onQueryChange }: SearchBarProps) {

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) return;

    onSearch(trimmedQuery);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search Pokémon, moves, abilities..."
          className="flex-1 bg-transparent px-4 py-3 text-zinc-900 outline-none placeholder:text-zinc-400"
        />

        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-6 py-3 font-medium text-white transition hover:bg-zinc-700"
        >
          Search
        </button>
      </div>
    </form>
  );
}