import { NextResponse } from "next/server";

import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch events",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const event = await prisma.event.create({
      data: {
        eventCode: body.eventCode,
        name: body.name,
        status: body.status ?? "PLANNING",
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        venue: body.venue || null,
        guestCount:
          body.guestCount !== undefined
            ? Number(body.guestCount)
            : null,
        description: body.description || null,
      },
    });

    return NextResponse.json(event, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create event:", error);

    return NextResponse.json(
      {
        error: "Failed to create event",
      },
      {
        status: 500,
      }
    );
  }
}