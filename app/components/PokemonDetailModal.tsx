"use client";

import { useState } from "react";
import type { Pokemon } from "../types/pokemon";

type PokemonDetailModalProps = {
  pokemon: Pokemon;
  onClose: () => void;
};

function formatName(value: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatName(value: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .replace("special-", "Special ")
    .replace("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PokemonDetailModal({
  pokemon,
  onClose,
}: PokemonDetailModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <article
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Pokémon details"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-xl text-zinc-500 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          ×
        </button>

        {/* Hero */}
        <div className="bg-zinc-100 px-6 pb-8 pt-10">
          <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-8">
            <div className="flex h-48 w-48 items-center justify-center">
              <img
                src={pokemon.images.official_artwork}
                alt={formatName(pokemon.name)}
                className="h-full w-full object-contain drop-shadow-lg"
              />
            </div>

            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-zinc-400">
                #{String(pokemon.id).padStart(3, "0")}
              </p>

              <h2 className="mt-1 text-4xl font-bold tracking-tight text-zinc-950">
                {formatName(pokemon.name)}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                {pokemon.species.genus}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {pokemon.types.map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white"
                  >
                    {formatName(type)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-6">
          {/* Description */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              About
            </h3>

            <p className="mt-3 leading-7 text-zinc-600">
              {pokemon.species.description}
            </p>
          </section>

          {/* Physical / Profile */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Profile
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InfoItem
                label="Height"
                value={`${pokemon.height_decimetres / 10} m`}
              />

              <InfoItem
                label="Weight"
                value={`${pokemon.weight_hectograms / 10} kg`}
              />

              <InfoItem
                label="Color"
                value={formatName(pokemon.species.color)}
              />

              <InfoItem
                label="Habitat"
                value={formatName(pokemon.species.habitat)}
              />
            </div>
          </section>

          {/* Species */}
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Species
              </h3>

              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
                {formatName(pokemon.species.generation)}
              </span>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200">
              {/* Classification */}
              <div className="grid grid-cols-2 divide-x divide-zinc-200 border-b border-zinc-200">
                <SpeciesItem
                  label="Classification"
                  value={pokemon.species.genus}
                />

                <SpeciesItem
                  label="Shape"
                  value={formatName(pokemon.species.shape)}
                />
              </div>

              {/* Generation / Evolution */}
              <div className="grid grid-cols-2 divide-x divide-zinc-200 border-b border-zinc-200">
                <SpeciesItem
                  label="Generation"
                  value={formatName(pokemon.species.generation)}
                />

                <SpeciesItem
                  label="Evolution Chain"
                  value={`#${pokemon.species.evolution_chain_id}`}
                />
              </div>

              {/* Rarity */}
              <div className="bg-zinc-50 p-4">
                <p className="text-xs text-zinc-400">Rarity</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {pokemon.species.is_legendary && (
                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                      ★ Legendary
                    </span>
                  )}

                  {pokemon.species.is_mythical && (
                    <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                      ✦ Mythical
                    </span>
                  )}

                  {!pokemon.species.is_legendary &&
                    !pokemon.species.is_mythical && (
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
                        Standard Pokémon
                      </span>
                    )}
                </div>
              </div>
            </div>
          </section>

          {/* Base Stats */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Base stats
            </h3>

            <div className="mt-4 space-y-3">
              {Object.entries(pokemon.stats).map(([stat, value]) => (
                <div key={stat}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-600">
                      {formatStatName(stat)}
                    </span>

                    <span className="font-semibold text-zinc-900">
                      {value}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-900"
                      style={{
                        width: `${Math.min((value / 150) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Abilities */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Abilities
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {pokemon.abilities.map((ability) => (
                <span
                  key={ability}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
                >
                  {formatName(ability)}
                </span>
              ))}
            </div>
          </section>

          {/* Moves */}
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Moves
              </h3>

              <span className="text-xs text-zinc-400">
                {pokemon.moves.length} available
              </span>
            </div>

            <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {(isExpanded
                ? pokemon.moves
                : pokemon.moves.slice(0, 10)
              ).map((move) => (
                <span
                  key={move}
                  className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-600"
                >
                  {formatName(move)}
                </span>
              ))}

              {pokemon.moves.length > 10 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded((current) => !current)}
                  className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 transition hover:bg-zinc-700"
                >
                  {isExpanded
                    ? "Show less"
                    : `+${pokemon.moves.length - 10} more`}
                </button>
              )}
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-3">
      <p className="text-xs text-zinc-400">{label}</p>

      <p className="mt-1 text-sm font-medium text-zinc-800">
        {value}
      </p>
    </div>
  );
}

function SpeciesItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs text-zinc-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-zinc-800">
        {value}
      </p>
    </div>
  );
}