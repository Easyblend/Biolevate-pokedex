
/*
So:
" Fast   Electric-Pokemon "

becomes:
"fast electric pokemon"

Simple, deterministic, testable.
*/


// small stop words for lexical normalization. These are words that are not useful for searching and can be ignored.
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "can",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "you",
  "like",
  "pokemon",
  "pokémon",
  "that",
  "the",
  "their",
  "this",
  "to",
  "with",
  "all"
]);

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);

  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .filter((term) => !STOP_WORDS.has(term));
}