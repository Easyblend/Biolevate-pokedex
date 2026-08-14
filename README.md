This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

SWE brainstorming process
- Inpect shape of pokedex data 
```node -e "const p=require('./app/data/pokedex.json'); console.log(Object.keys(p));"```
[ 'metadata', 'pokemon', 'moves', 'abilities' ]
Now we know
pokedex.json
├── metadata
└── pokemon[]

pokemon
├── id
├── name
├── types[]
├── stats{}
├── abilities[]
├── moves[]
├── species{}
└── images{}

- Exaple search at current level 
User
  ↓
"put opponent to sleep"
  ↓
Search moves
  ↓
sleep-powder
  ↓
Find Pokémon that have sleep-powder
  ↓
Bulbasaur
Venusaur
Butterfree
...

- folder structure current
app/
├── api/
│   └── search/
│       └── route.ts
│
├── components/
│   ├── SearchBar.tsx
│   ├── SearchResults.tsx
│   └── SearchResultCard.tsx
│
├── data/
│   └── pokedex.json
│
├── types/
│   └── pokemon.ts
│
├── page.tsx
├── layout.tsx
└── globals.css


                    page.tsx
                       │
                       │ query
                       ▼
                 SearchBar
                       │
                       ▼
               handleSearch()
                       │
                       ▼
                /api/search
                       │
                       ▼
                pokedex.json
                       │
                       ▼
                 Pokemon[]
                       │
                       ▼
              SearchResults
                       │
                       ▼
           SearchResultCard
                       │
                       ▼
             Actual Pokémon UI

- Do not build an LLM-powered search engine. Build an explainable, deterministic retrieval-and-ranking engine tailored to this structured dataset.
- I chose a deterministic retrieval and ranking approach rather than an LLM or vector database. The provided dataset is small, highly structured, and contains explicit relationships between Pokémon, moves, abilities, types and stats. Deterministic retrieval makes results reproducible, locally runnable, explainable, and easy to validate with automated tests. It also allows the interface to explain why a result matched. Semantic/vector search would be a potential future enhancement for broader natural-language queries.

-"I started with a very simple name-based retrieval to validate the
end-to-end architecture.

Then I separated retrieval from ranking because I didn't want the API
route to contain search logic.

The query analyzer identifies structured constraints such as types,
moves, abilities and stat preferences.

The retrieval layer generates candidates, and the scoring layer ranks
them.

I also return match reasons because relevance without an explanation
would make the ranking difficult to validate.

For example, for 'fast electric Pokemon', Electric is a hard filter
while speed is a ranking signal.

I deliberately chose deterministic search instead of an LLM because
the dataset is structured and small, and deterministic results make
the system reproducible and testable."

"bulba"
        → name search

"electric pokemon"
        → type = electric

"overgrow"
        → ability = overgrow

"sleep powder"
        → move = sleep-powder

"fast electric pokemon"
        → type = electric + speed DESC

"put opponent to sleep"
        → sleep intent



                    USER QUERY
                        │
                        ▼
                 Query Normalizer
                        │
                        ▼
                  Query Analyzer
                        │
             ┌──────────┼───────────┐
             ▼          ▼           ▼
          Entity      Filters     Intent
          signals     / terms     signals
             │          │           │
             └──────────┼───────────┘
                        ▼
                 Candidate Retrieval
                        │
                        ▼
                 Relevance Scoring
                        │
                        ▼
                    Ranking
                        │
                        ▼
                 Search Results
                  + match reasons


normalize.ts
      ↓
Clean the user's text

query-parser.ts
      ↓
Understand what the user is asking

search.ts
      ↓
Retrieve candidate Pokémon

scoring.ts
      ↓
Rank candidates + explain why

GET /api/search
       │
       ▼
     search()
       │
       ├── parseQuery()
       │
       ├── retrieveCandidates()
       │
       └── scorePokemon()