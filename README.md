Absolutely. I’d use this as the **entire `README.md`**, replacing the current Next.js boilerplate. I’ve kept it honest to what you’ve actually implemented rather than overstating the semantic-search capabilities.

````markdown
# Pokédex Search Engine

A full-stack search experience for exploring Pokémon data from the provided Biolevate Pokédex snapshot.

The application allows users to search Pokémon using names, types, moves, abilities, species metadata, and stat preferences. Queries are normalized and parsed into structured signals, used to retrieve eligible candidates, and ranked where a ranking preference exists.

The goal is not simply to expose raw Pokédex data, but to help users find relevant information even when they do not know the exact name or vocabulary.

---

## Product Goal

The Pokédex contains several related kinds of information:

- Pokémon
- Types
- Moves
- Abilities
- Stats
- Species metadata
- Relationships between Pokémon and moves/abilities

A useful search experience therefore needs to understand more than exact name lookups.

The current product focuses on **deterministic, explainable search over the structured information in the dataset**.

Examples of supported searches include:

```text
bulba
````

Finds Pokémon whose names match or contain the search term.

```text
electric pokemon
```

Finds Electric-type Pokémon.

```text
overgrow
```

Finds Pokémon associated with the Overgrow ability.

```text
sleep powder
```

Finds Pokémon that can learn Sleep Powder.

```text
fast electric pokemon
```

Finds Electric Pokémon and ranks them according to Speed.

```text
turtle pokemon
```

Uses species metadata such as the Pokémon's genus to find relevant results.

---

# Why Deterministic Search?

I chose a deterministic retrieval and ranking approach rather than an LLM or vector database.

The provided dataset is:

* relatively small;
* highly structured;
* locally available;
* rich in explicit relationships between Pokémon, moves, abilities, types, stats, and species metadata.

For this dataset, deterministic retrieval provides several advantages:

* reproducible results;
* predictable behaviour;
* local execution;
* straightforward automated testing;
* explainable relevance;
* no external API dependency;
* no paid services;
* easy debugging.

It also allows the UI to explain why a result matched.

For example:

```text
fast electric pokemon

Electric type
Speed: 130
```

The result is therefore not just a black-box relevance score.

A semantic search system using embeddings or an LLM could be useful for broader natural-language queries, but I considered that a future enhancement rather than necessary infrastructure for the core structured search experience.

---

# Architecture

The application uses the Next.js App Router with a server-side search API.

```text
                    USER
                      │
                      ▼
                Search UI
                      │
                      ▼
              GET /api/search
                      │
                      ▼
                  search()
                      │
                      ▼
                parseQuery()
                      │
                      ▼
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
    Query signals           Search intent
    and constraints
          │                       │
          └───────────┬───────────┘
                      ▼
            Candidate retrieval
                      │
                      ▼
                 Hard filters
                      │
                      ▼
                  Candidates
                      │
                      ▼
                    Rank
                      │
                      ▼
              Search results
             + match reasons
                      │
                      ▼
                    UI
```

The main search pipeline is deliberately separated into:

```text
Normalize
    ↓
Parse
    ↓
Retrieve
    ↓
Rank
    ↓
Return results
```

The API route is intentionally thin and delegates the actual search logic to the search module.

---

# Project Structure

```text
app/
├── api/
│   └── search/
│       └── route.ts
│
├── components/
│   ├── SearchBar.tsx
│   ├── SearchResults.tsx
│   ├── SearchResultCard.tsx
│   └── ...
│
├── data/
│   └── pokedex.json
│
├── lib/
│   └── search/
│       ├── normalize.ts
│       ├── query-parser.ts
│       ├── search.ts
│       └── scoring.ts
│
├── types/
│   └── pokemon.ts
│
├── page.tsx
├── layout.tsx
└── globals.css
```

### `normalize.ts`

Responsible for cleaning and tokenizing user input.

For example:

```text
" Fast   Electric-Pokemon "
            ↓
"fast electric pokemon"
```

Normalization is deterministic and shared by the search pipeline.

### `query-parser.ts`

Converts normalized user input into structured search information.

For example:

```text
fast electric pokemon
```

is interpreted approximately as:

```text
type:
electric

stat:
speed

direction:
descending
```

The parser distinguishes explicit constraints from ranking preferences.

### `search.ts`

Owns the search pipeline.

It:

1. Parses the query.
2. Retrieves candidate Pokémon.
3. Applies explicit hard filters.
4. Passes candidates to the ranking layer.
5. Sorts and limits the final results.

### `scoring.ts`

Contains ranking logic.

Ranking is deliberately separate from filtering.

For example:

```text
fast electric pokemon

electric → hard filter
fast     → ranking preference
```

The Electric filter determines which Pokémon are eligible.

Speed determines how qualifying Pokémon are ordered.

### `/api/search`

The backend API validates the request and delegates the search to the search engine.

The frontend does not access the dataset directly.

---

# Data

The application uses the provided `pokedex.json` snapshot as its baseline dataset.

The dataset contains:

```text
metadata
pokemon[]
moves[]
abilities[]
```

Each Pokémon contains structured information including:

```text
id
name
types[]
stats{}
abilities[]
moves[]
species{}
images{}
```

The species information is particularly useful because it provides additional searchable attributes such as:

```text
generation
description
genus
color
shape
habitat
is_legendary
is_mythical
evolution_chain_id
```

The application keeps the provided snapshot locally so that the search engine is reproducible without requiring external services.

---

# Search Design

## 1. Query Normalization

Before interpreting a query, the input is normalized.

For example:

```text
" Fast   Electric-Pokemon "
```

becomes:

```text
"fast electric pokemon"
```

This means equivalent searches can be handled consistently regardless of capitalization, spacing, or hyphenation.

For example:

```text
sleep-powder
```

and:

```text
sleep powder
```

can be normalized to the same representation.

---

# 2. Query Parsing

The parser identifies structured information in the user's query.

The current search model can identify signals such as:

* Pokémon types;
* abilities;
* moves;
* species metadata;
* stat preferences;
* partial names.

For example:

```text
fast electric pokemon
```

can be interpreted as:

```text
type = electric
stat = speed
direction = descending
```

The important distinction is that not every term is treated as a hard constraint.

For example:

```text
fast electric pokemon
```

means:

```text
electric → must match
fast     → preferred ranking
```

rather than requiring a Pokémon to somehow have a property literally called `fast`.

---

# 3. Candidate Retrieval

The retrieval stage answers:

> Which Pokémon are eligible to appear in the result set?

Explicit structured constraints are applied here.

For example:

```text
electric pokemon
```

results in an Electric-type filter.

Similarly:

```text
sleep powder
```

can identify the Sleep Powder move and retrieve Pokémon that contain that move in their move list.

Species metadata can also be used for structured searches such as:

```text
blue pokemon
```

or:

```text
turtle pokemon
```

where the dataset provides corresponding color, habitat, or genus information.

---

# 4. Ranking

After candidates are retrieved, ranking determines their order.

This is intentionally separate from filtering.

For example:

```text
fast electric pokemon
```

is processed conceptually as:

```text
                 Query
                   │
                   ▼
             Electric filter
                   │
                   ▼
          Electric Pokémon
                   │
                   ▼
          Rank by Speed DESC
                   │
                   ▼
             Final results
```

This allows the system to distinguish between:

> "This Pokémon must satisfy the user's requirement."

and:

> "This Pokémon is a better match than another candidate."

---

# Why Not Search Every Description Word?

The dataset contains natural-language Pokémon descriptions.

A naive approach would tokenize the description and search every query term against it.

This initially appears attractive because it would allow queries such as:

```text
a pokemon that can swim
```

However, this produces poor results when generic natural-language words are treated as evidence.

For example:

```text
a pokemon that can swim
```

contains common terms such as:

```text
a
that
can
```

A naive description search can therefore return Pokémon whose descriptions contain these words even when the Pokémon has nothing to do with swimming.

This creates misleading relevance.

For this reason, generic description keyword matching is deliberately not treated as a strong retrieval signal in the current implementation.

Instead, the search prioritizes structured fields such as:

* name;
* type;
* ability;
* move;
* genus;
* color;
* habitat;
* stats.

A future semantic retrieval layer could make broader natural-language queries more useful without relying on raw substring matching.

---

# Search Examples

| Query                   | Interpretation                  | Demonstrates                |
| ----------------------- | ------------------------------- | --------------------------- |
| `bulba`                 | Partial Pokémon name            | Name recovery               |
| `electric pokemon`      | Electric type constraint        | Structured filtering        |
| `overgrow`              | Ability lookup                  | Ability retrieval           |
| `sleep powder`          | Move lookup                     | Move → Pokémon relationship |
| `fast electric pokemon` | Electric filter + Speed ranking | Filtering vs ranking        |
| `turtle pokemon`        | Species genus search            | Species metadata            |
| `blue pokemon`          | Species color search            | Species metadata            |

The exact result set is based on the provided dataset snapshot.

---

# API

## Search Endpoint

```http
GET /api/search?q=<query>
```

Example:

```http
GET /api/search?q=fast%20electric%20pokemon
```

The endpoint:

1. Validates the query.
2. Normalizes and parses it.
3. Executes the search pipeline.
4. Returns ranked results.

---

## Invalid Query

An empty or whitespace-only query returns a controlled `400` response.

Example:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Search query is required."
  }
}
```

Unexpected server errors are handled by the API without exposing raw stack traces or secrets.

---

# Frontend

The frontend is intentionally simple and focused on the search experience.

It provides:

* search input;
* example queries;
* loading state;
* error state;
* empty state;
* result cards;
* match explanations;
* Pokémon detail information.

The frontend communicates with the backend through:

```text
SearchBar
    ↓
handleSearch()
    ↓
GET /api/search
    ↓
SearchResults
    ↓
SearchResultCard
```

The search UI does not implement search logic itself.

---

# Result Explanations

Search results can include reasons explaining why a Pokémon matched.

Examples:

```text
Electric type
```

```text
Has Overgrow ability
```

```text
Can learn Sleep Powder
```

```text
Genus matches Turtle
```

```text
Speed: 130
```

This was an intentional product decision.

A search result should not only answer:

> "What did I find?"

It should also help answer:

> "Why did this result appear?"

This makes the relevance model easier to validate and makes unexpected results easier to debug.

---

# Testing

The search engine is designed so that important behaviour can be tested independently of the UI.

The automated tests cover the core behaviours required by the assessment:

* successful backend/search retrieval;
* invalid or empty input;
* no-result behaviour;
* partial name matching;
* structured filtering;
* move and ability matching;
* ranking behaviour.

One particularly important behaviour is the distinction between filtering and ranking.

For example:

```text
fast electric pokemon
```

should only return Electric Pokémon.

Within that candidate set, Speed determines the ranking preference.

This makes the definition of relevance observable rather than relying only on visual inspection.

Run the test suite with:

```bash
npm test
```

---

# Local Development

## Install dependencies

```bash
npm install
```

## Start development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

The development server supports live updates while editing the application.

## Run tests

```bash
npm test
```

## Create a production build

```bash
npm run build
```

## Run the production build

```bash
npm start
```

`npm start` runs the production build and therefore does not provide the same live development behaviour as `npm run dev`.

---

# Trade-offs and Design Decisions

The main trade-off was between search breadth and predictability.

A much broader implementation could attempt to understand arbitrary natural-language queries using:

* an LLM;
* embeddings;
* a vector database;
* a large synonym dictionary;
* external Pokémon APIs.

That could potentially support queries such as:

```text
a pokemon that can swim
```

or:

```text
something useful for a rain team
```

more naturally.

However, this would introduce additional infrastructure, tuning, evaluation complexity, and potentially less predictable behaviour.

For the assessment, I prioritized a smaller search engine whose behaviour can be understood, reproduced, and tested locally.

The architecture also leaves room for a semantic retrieval layer to be introduced later without requiring a complete rewrite of the frontend or API.

---

# Known Limitations

The current implementation is intentionally scoped.

It does not attempt to fully understand arbitrary natural-language questions.

In particular, queries involving concepts that are not explicitly represented as structured dataset fields may not return ideal results.

Examples include:

```text
a pokemon that can swim
```

```text
something useful against fire
```

```text
a pokemon that would work well on a rain team
```

These queries require a semantic understanding of relationships between descriptions, moves, abilities, types, and gameplay concepts.

The current implementation deliberately does not pretend that simple keyword matching provides that understanding.

Other possible improvements include:

* richer synonym handling;
* semantic search over descriptions;
* more sophisticated relationship discovery;
* improved ranking;
* query suggestions;
* result highlighting;
* pagination;
* broader Pokémon generations.

---

# What I Would Do With More Time

## 1. Add semantic retrieval

Introduce a lightweight semantic retrieval layer over descriptions and structured metadata.

This would allow the system to retrieve conceptually related results even when the user's vocabulary does not exactly match the dataset.

For example:

```text
"pokemon that can swim"
```

could retrieve Pokémon whose descriptions express swimming-related concepts even when the exact word `swim` is not present.

---

## 2. Build a search evaluation dataset

I would create a small evaluation set of representative user queries with expected relevant results.

For example:

```text
Query:
pokemon that can swim

Relevant:
Poliwag
Poliwhirl
Poliwrath
Golduck
Lapras
...
```

This would allow ranking changes to be evaluated systematically rather than relying entirely on manual inspection.

---

## 3. Improve result explanations

The current match reasons could be extended into evidence-based explanations.

For example:

```text
Water type
Blue color
Habitat: waters-edge
Description contains swimming-related evidence
```

This would make the relationship between the query and the result even clearer.

---

## 4. Introduce indexes if the dataset grows

The current dataset is small enough that scanning the Pokémon collection for each request is simple and appropriate.

If the dataset became significantly larger, I would introduce precomputed indexes for:

* names;
* types;
* abilities;
* moves;
* colors;
* habitats;
* genera.

This would reduce repeated linear scans and make candidate retrieval more scalable.

---

# AI-Assisted Development

AI-assisted development tools were used during implementation.

They were used for:

* brainstorming search architecture;
* generating initial component scaffolding;
* exploring TypeScript implementations;
* identifying edge cases;
* suggesting test scenarios;
* reviewing and simplifying implementation ideas.

AI-generated code was reviewed, tested, and adapted before being incorporated into the project.

I remained responsible for understanding and validating the resulting implementation.

Validation included:

* manually running representative search queries;
* inspecting parsed queries;
* testing edge cases;
* running automated tests;
* checking frontend behaviour;
* reviewing search results for relevance.

One important example was rejecting naive description keyword matching.

An initial approach searched query words directly against Pokémon descriptions. This produced misleading results because common words such as `a`, `that`, and `can` created false matches.

That approach was rejected in favour of structured retrieval and explicit search signals.

---

# Time Spent

Approximately **10 hours** of focused implementation, debugging, testing, and refinement.

---

# Development Process

The implementation started deliberately small.

The first version validated the complete end-to-end flow:

```text
User
 ↓
SearchBar
 ↓
GET /api/search
 ↓
pokedex.json
 ↓
Results
```

Once that worked, search logic was separated from the API route.

The search pipeline then evolved into:

```text
User query
     ↓
normalize.ts
     ↓
query-parser.ts
     ↓
search.ts
     ↓
scoring.ts
     ↓
ranked results
```

This separation was intentional.

The API route should not need to understand how Pokémon search works. It should only validate the request and expose the search service.

The parser is responsible for understanding the query.

The retrieval layer is responsible for determining which Pokémon satisfy explicit constraints.

The ranking layer is responsible for ordering candidates when a ranking preference exists.

This keeps the system easier to test, reason about, and extend.

---

# Example End-to-End Flow

For:

```text
fast electric pokemon
```

the system conceptually performs:

```text
User Query
    │
    ▼
Normalize
    │
    ▼
"fast electric pokemon"
    │
    ▼
Parse
    │
    ├── type: electric
    │
    └── stat: speed DESC
    │
    ▼
Hard Filter
    │
    ▼
Electric Pokémon
    │
    ▼
Rank
    │
    ▼
Speed preference
    │
    ▼
Top Results
    │
    ▼
Frontend
```

For:

```text
sleep powder
```

the system uses the explicit move relationship:

```text
sleep powder
     ↓
Move identification
     ↓
Pokémon containing Sleep Powder
     ↓
Results
```

For:

```text
turtle pokemon
```

the search can use species metadata:

```text
turtle
  ↓
genus metadata
  ↓
"Turtle Pokémon"
  ↓
Relevant Pokémon
```

---

# Conclusion

The final implementation intentionally prioritizes a focused, explainable search experience over broad but unreliable natural-language interpretation.

The core design is:

```text
Normalize
    ↓
Parse
    ↓
Retrieve
    ↓
Filter
    ↓
Rank
    ↓
Explain
```

This provides a simple foundation that is locally reproducible, testable, and understandable while leaving a clear path toward semantic retrieval if the product needs to support more open-ended queries in the future.

```

One correction before you commit it: **change `Approximately 10 hours` to your actual approximate time**. The assessment explicitly asks for that, and there's no benefit in making the number look artificially precise.
```
