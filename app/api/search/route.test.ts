import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/search", () => {
  it("returns Pokémon for a valid search", async () => {
    const request = new Request(
      "http://localhost:3000/api/search?q=pikachu"
    );

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.query).toBe("pikachu");
    expect(Array.isArray(data.results)).toBe(true);

    expect(
      data.results.some(
        (result: any) =>
          result.pokemon.name === "pikachu"
      )
    ).toBe(true);
  });

  it("returns 400 for an empty query", async () => {
    const request = new Request(
      "http://localhost:3000/api/search"
    );

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("INVALID_QUERY");
  });
});