# Pokédex Search Engine

A full-stack search experience over the provided Biolevate Pokédex snapshot
(Pokémon #1–151, Red/Blue/Yellow data). Users type a free-text query and get
relevant Pokémon back, along with a short reason explaining *why* each result
matched.

The goal is not to dump raw data, but to help users find Pokémon even when they
only remember part of a name, a type, a move, an ability, or a rough
characteristic.

## 🚀 Try it live

**[👉 Open the live Pokedex](https://biolevate-pokedex.netlify.app)**

No setup. No cloning. Just click and search. 😄

---

## Setup, run, and test

Requirements: Node.js 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Run the app (http://localhost:3000)
npm run dev

# 3. Run the tests
npm test
```

No environment variables or external services are required. The dataset ships in
the repository at `app/data/pokedex.json`, so the app is fully reproducible
offline.

---

## Architecture and data flow

Next.js (App Router) with a server-side search API. The browser never touches the
dataset directly — all retrieval happens on the server.

```
User → SearchBar (page.tsx)
     → GET /api/search?q=…            (app/api/search/route.ts)
        → search(query)              (app/lib/search/search.ts)
           → normalize → parse → retrieve (hard filters) → rank
        → results + matchReasons
     → SearchResults / SearchResultCard / PokemonDetailModal
```

Pipeline stages ([app/lib/search/](app/lib/search/)):

| Stage | File | Responsibility |
| --- | --- | --- |
| Normalize | `normalize.ts` | Lowercase, strip accents/punctuation, drop stop words |
| Parse | `query-parser.ts` | Turn text into structured signals (types, abilities, moves, species, stat preference) using a vocabulary derived from the dataset |
| Retrieve | `search.ts` | Apply **hard filters** (type / ability / move) to get eligible candidates |
| Rank | `scoring.ts` | Score candidates and attach human-readable `matchReasons` |

The API route is thin: it validates input, calls `search()`, and shapes the
response. All search logic lives in the library so it can be unit-tested without
the HTTP layer.

**API contract**

- Request: `GET /api/search?q=<string>`
- Success: `200` → `{ query, results: [{ pokemon, score, matchReasons }], total }`
- Empty/whitespace query: `400` → `{ error: { code: "INVALID_QUERY", message } }`
- Unexpected failure: `500` → `{ error: { code: "SEARCH_FAILED", message } }`
  (no stack traces or internals exposed)

---

## What the product supports

The search focuses on one need done well: **structured retrieval over the
Pokédex when the user doesn't know the exact term.** Supported signals:

- **Partial name** — `bulba` finds Bulbasaur.
- **Type** — `electric pokemon` filters to Electric types.
- **Ability** — `overgrow` finds Pokémon with that ability.
- **Move** — `sleep powder` finds Pokémon that can learn it.
- **Species metadata** — genus/color/habitat, e.g. `turtle` matches on genus.
- **Stat preference** — words like `fast` / `strong` rank results by the relevant
  stat rather than filtering them out.

The key design decision is separating **hard filters** from **ranking
preferences**. In `fast electric pokemon`, `electric` decides *who is eligible*
and `fast` decides *what order they appear in* — so a valid result is never
dropped just because it isn't the single fastest.

---

## Design decisions and trade-offs

**Deterministic search instead of an LLM / vector database.** The dataset is
small (151 Pokémon), highly structured, and rich in explicit relationships
(types, moves, abilities, stats, species). For this shape of data a deterministic
parser + scorer gives reproducible results, predictable behaviour, trivial local
execution, no paid dependencies, and — importantly — **explainable relevance**.
Every result carries a `matchReasons` array (e.g. `"Electric type"`, `"Speed:
130"`), so the ranking is never a black box. A semantic/embedding approach would
generalise better to open-ended natural language, but I judged it unnecessary
complexity for the core structured needs and treated it as future work.

**Vocabulary derived from the data.** Known types, abilities, moves, colours,
habitats, and genera are built from `pokedex.json` at load time rather than
hard-coded, so the parser stays in sync with the dataset.

**Context-aware parsing.** Species metadata is detected before type detection so
that a phrase like `lives in water` is read as a *habitat*, not the *Water* type.

**Filter vs. rank separation** (described above) is the main relevance decision
and is directly asserted by a test.

**Trade-offs I accepted:** the parser is rule-based, so it handles the supported
patterns well but does not understand arbitrary sentences; natural-language
habitat matching uses phrase heuristics that favour precision over recall.

---

## Representative queries

| Query | Returns | Demonstrates |
| --- | --- | --- |
| `bulba` | Bulbasaur (name prefix) | Partial-name recovery |
| `fast electric pokemon` | Electric types ordered by Speed | Hard filter + stat ranking working together |
| `sleep powder` | Bulbasaur, Oddish, … | Retrieval by a move a Pokémon can learn |
| `overgrow` | Bulbasaur, Ivysaur, … | Retrieval by ability |
| `turtle` | Squirtle line (genus "Turtle Pokémon") | Species-metadata search without exact vocabulary |

---

## How correctness and relevance were validated

Automated tests ([Vitest](https://vitest.dev)) cover the behaviour that matters:

- **Successful backend retrieval** — `GET /api/search?q=pikachu` returns 200 with
  Pikachu in results ([route.test.ts](app/api/search/route.test.ts)).
- **Invalid input** — empty query returns `400 INVALID_QUERY`.
- **A claimed search behaviour** — `fast electric pokemon` parses to an Electric
  type filter plus a descending Speed preference, making the filter-vs-rank
  definition of relevance observable ([query-parser.test.ts](app/lib/search/query-parser.test.ts)).
- **Move/ability/name retrieval** — `sleep powder`, `overgrow`, and partial-name
  searches return the expected Pokémon ([search.test.ts](app/lib/search/search.test.ts)).

Run all of them with `npm test`.

---

## Known limitations and next steps

- **Rule-based parsing** handles the supported query shapes but not free-form
  sentences; a semantic/embedding layer would broaden coverage.
- **No cross-entity results** — results are Pokémon only; moves/abilities aren't
  returned as first-class results.
- **Habitat/genus heuristics** favour precision, so some loosely phrased queries
  return nothing rather than a guess.
- Next: add a no-result "did you mean" suggestion, expand stat comparison in the
  UI, and evaluate a hybrid deterministic + semantic ranker.

---

## Data

- Source: provided `pokedex.json` snapshot (PokéAPI, Pokémon #1–151, Red/Blue/Yellow).
- Stored locally at `app/data/pokedex.json`; no transformation at runtime.
- No secrets or generated dependency directories are committed.

---

## Time spent

Approximately 10 hours.

---

## AI-tool disclosure

- **Tool:** GitHub Copilot (chat + inline completions).
- **Used for:** scaffolding boilerplate, drafting the search pipeline and tests,
  and drafting this README.
- **Review:** all generated code was read, run against the test suite, and
  adjusted by hand; I kept the deterministic architecture and rejected suggestions
  that added unnecessary dependencies or over-generalised the parser.
