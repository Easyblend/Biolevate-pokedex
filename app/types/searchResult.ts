type SearchResult = {
  entityType: "pokemon" | "move" | "ability";
  id: string;
  name: string;
  score: number;
  matchReasons: string[];
  data: unknown;
};