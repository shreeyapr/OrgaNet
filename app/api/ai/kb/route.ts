import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

type KBDocument = {
  title: string;
  content: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreDocument(
  query: string,
  content: string
) {
  const queryWords = normalize(query)
    .split(" ")
    .filter((word) => word.length > 2);

  const normalizedContent =
    normalize(content);

  let score = 0;

  for (const word of queryWords) {
    if (normalizedContent.includes(word)) {
      score++;
    }
  }

  return score;
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const query = body.query;

    if (!query) {
      return NextResponse.json(
        {
          error: "Query is required",
        },
        {
          status: 400,
        }
      );
    }

    const kbDirectory = path.join(
      process.cwd(),
      "knowledge",
      "momentus"
    );

    const files =
      await fs.readdir(kbDirectory);

    const documents: KBDocument[] = [];

    for (const file of files) {
      if (!file.endsWith(".md")) {
        continue;
      }

      const filePath =
        path.join(
          kbDirectory,
          file
        );

      const content =
        await fs.readFile(
          filePath,
          "utf8"
        );

      documents.push({
        title: file,
        content,
      });
    }

    const results =
      documents
        .map((document) => ({
          ...document,
          score: scoreDocument(
            query,
            document.content
          ),
        }))
        .filter(
          (document) =>
            document.score > 0
        )
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .slice(0, 3);

    return NextResponse.json({
      query,

      results: results.map(
        (result) => ({
          title: result.title,
          score: result.score,
          content:
            result.content,
        })
      ),
    });
  } catch (error) {
    console.error(
      "KB search error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to search knowledge base",
      },
      {
        status: 500,
      }
    );
  }
}