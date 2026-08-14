import { NextRequest, NextResponse } from "next/server";
import { search } from "@/app/lib/search/search";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_QUERY",
            message: "Search query is required.",
          },
        },
        { status: 400 }
      );
    }

    const results = search(query);

    return NextResponse.json({
      query,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);

    return NextResponse.json(
      {
        error: {
          code: "SEARCH_FAILED",
          message: "Something went wrong while searching.",
        },
      },
      { status: 500 }
    );
  }
}