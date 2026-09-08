import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        spaces: {
          where: {
            status: "AVAILABLE",
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error("Failed to load venues:", error);

    return NextResponse.json(
      {
        error: "Failed to load venues",
      },
      { status: 500 }
    );
  }
}