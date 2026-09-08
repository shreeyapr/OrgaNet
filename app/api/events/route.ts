import { NextResponse } from "next/server";

import { prisma } from "../../lib/prisma";

function calculatePriority(
  guests: number,
  start: Date,
  status: string
) {
  let score = 0;
  const reasons: string[] = [];

  // --------------------------------------------------
  // 1. Event status
  // --------------------------------------------------

  if (status === "CONFIRMED") {
    score += 30;
    reasons.push("confirmed booking");
  } else if (status === "PLANNING") {
    score += 15;
  } else if (status === "HOLD") {
    score += 5;
  }

  // --------------------------------------------------
  // 2. Guest count
  // --------------------------------------------------

  if (guests >= 1000) {
    score += 40;
    reasons.push("large guest count");
  } else if (guests >= 500) {
    score += 30;
    reasons.push("high guest count");
  } else if (guests >= 200) {
    score += 20;
    reasons.push("medium guest count");
  } else if (guests >= 100) {
    score += 10;
  } else {
    score += 5;
  }

  // --------------------------------------------------
  // 3. Event proximity
  // --------------------------------------------------

  const now = new Date();

  const hoursUntilStart =
    (start.getTime() - now.getTime()) /
    (1000 * 60 * 60);

  if (hoursUntilStart <= 24) {
    score += 30;
    reasons.push("event starts within 24 hours");
  } else if (hoursUntilStart <= 72) {
    score += 20;
    reasons.push("event starts within 3 days");
  } else if (hoursUntilStart <= 168) {
    score += 10;
    reasons.push("event starts within 7 days");
  }

  // --------------------------------------------------
  // 4. Convert score to priority
  // --------------------------------------------------

  let priority = "P4";

  if (score >= 80) {
    priority = "P1";
  } else if (score >= 60) {
    priority = "P2";
  } else if (score >= 40) {
    priority = "P3";
  }

  return {
    priority,
    priorityScore: score,
    priorityReason:
      reasons.length > 0
        ? reasons.join(", ")
        : "standard operational priority",
  };
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error(
      "Failed to fetch events:",
      error
    );

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

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Invalid start or end date",
        },
        {
          status: 400,
        }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        {
          error:
            "End date must be after start date",
        },
        {
          status: 400,
        }
      );
    }

    const status = body.status ?? "PLANNING";

    const guests =
      body.guestCount !== undefined &&
      body.guestCount !== null
        ? Number(body.guestCount)
        : 0;

    if (!Number.isFinite(guests) || guests < 0) {
      return NextResponse.json(
        {
          error:
            "Guest count must be a valid number.",
        },
        {
          status: 400,
        }
      );
    }

    const priorityData = calculatePriority(
      guests,
      startDate,
      status
    );

    const event = await prisma.event.create({
      data: {
        eventCode: body.eventCode,
        name: body.name,

        status,

        startDate,

        endDate,

        venue: body.venue || null,

        guestCount:
          body.guestCount !== undefined
            ? guests
            : null,

        description:
          body.description || null,

        // Automatic priority
        priority: priorityData.priority,

        priorityScore:
          priorityData.priorityScore,

        priorityReason:
          priorityData.priorityReason,

        venueId: body.venueId || null,

        spaceId: body.spaceId || null,
      },
    });

    return NextResponse.json(event, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "Failed to create event:",
      error
    );

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