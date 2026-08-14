import type { ScoredResult } from "../lib/search/scoring";

type SearchResultCardProps = {
  result: ScoredResult;
  onSelect: () => void;
};

function formatName(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SearchResultCard({
  result,
  onSelect,
}: SearchResultCardProps) {
  const { pokemon } = result;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full rounded-2xl border border-zinc-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-zinc-50">
          <img
            src={pokemon.images.sprite}
            alt={formatName(pokemon.name)}
            className="h-16 w-16 object-contain transition group-hover:scale-110"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-400">
                #{String(pokemon.id).padStart(3, "0")}
              </p>

              <h3 className="text-lg font-semibold text-zinc-900">
                {formatName(pokemon.name)}
              </h3>
            </div>

            <div className="flex flex-wrap justify-end gap-1">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"
                >
                  {formatName(type)}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
            {pokemon.species.description}
          </p>

          {result.matchReasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.matchReasons.slice(0, 3).map((reason, index) => (
                <span
                  key={`${reason}-${index}`}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-500"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>

        <span className="text-zinc-300 transition group-hover:translate-x-1 group-hover:text-zinc-500">
          →
        </span>
      </div>
    </button>
  );
}