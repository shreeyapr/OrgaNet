import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

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
  // 4. Convert score → priority
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      eventName,
      guestCount,
      startTime,
      endTime,
      space,
      venueId,
      spaceId,
    } = body;

    // --------------------------------------------------
    // 1. Validate required fields
    // --------------------------------------------------

    if (
      !eventName ||
      !guestCount ||
      !startTime ||
      !endTime ||
      !space ||
      !venueId ||
      !spaceId
    ) {
      return NextResponse.json(
        {
          error:
            "Event name, guest count, date/time, venue and space are required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Validate guest count
    // --------------------------------------------------

    const guests = Number(guestCount);

    if (!Number.isFinite(guests) || guests <= 0) {
      return NextResponse.json(
        {
          error:
            "Guest count must be a valid positive number.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Validate dates
    // --------------------------------------------------

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Invalid start or end time.",
        },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        {
          error: "End time must be after start time.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Prevent bookings on previous dates
    // --------------------------------------------------

    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (start < todayStart) {
      return NextResponse.json(
        {
          error:
            "Bookings cannot be created for previous dates.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Prevent bookings for past times today
    // --------------------------------------------------

    if (start < now) {
      return NextResponse.json(
        {
          error:
            "The selected start time has already passed. Please choose a future time.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Verify venue and space
    // --------------------------------------------------

    const selectedSpace =
      await prisma.space.findUnique({
        where: {
          id: spaceId,
        },
        include: {
          venue: true,
        },
      });

    if (!selectedSpace) {
      return NextResponse.json(
        {
          error: "Selected space was not found.",
        },
        { status: 404 }
      );
    }

    // Make sure the selected space belongs
    // to the selected venue.

    if (selectedSpace.venueId !== venueId) {
      return NextResponse.json(
        {
          error:
            "The selected space does not belong to the selected venue.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 7. Check space status
    // --------------------------------------------------

    if (selectedSpace.status !== "AVAILABLE") {
      return NextResponse.json(
        {
          error:
            "The selected space is currently unavailable.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 8. Server-side capacity validation
    // --------------------------------------------------

    if (
      selectedSpace.capacity !== null &&
      guests > selectedSpace.capacity
    ) {
      return NextResponse.json(
        {
          error: `Guest count exceeds the capacity of ${selectedSpace.name}. Maximum capacity is ${selectedSpace.capacity} guests.`,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 9. Check overlapping FUNCTIONS in the same SPACE
    // --------------------------------------------------
    //
    // IMPORTANT:
    //
    // We deliberately DO NOT check venue + date here.
    //
    // Multiple bookings can exist in the same venue
    // on the same day.
    //
    // Only the SAME SPACE with overlapping time
    // creates a conflict.
    //
    // Example:
    //
    // Venue: Jio World Convention Centre
    //
    // Main Hall       10:00 - 12:00  ✅
    // Meeting Room A  10:00 - 12:00  ✅
    // Hall B          11:00 - 13:00  ✅
    //
    // Main Hall       11:00 - 13:00  ❌
    //

    const conflicts =
      await prisma.function.findMany({
        where: {
          space: selectedSpace.name,

          startTime: {
            lt: end,
          },

          endTime: {
            gt: start,
          },
        },

        include: {
          event: true,
        },

        orderBy: {
          startTime: "asc",
        },
      });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error:
            "The selected space is already booked during this time.",

          conflicts: conflicts.map(
            (conflict) => ({
              functionId: conflict.id,

              functionName:
                conflict.name,

              eventId:
                conflict.eventId,

              eventName:
                conflict.event.name,

              startTime:
                conflict.startTime,

              endTime:
                conflict.endTime,

              space:
                conflict.space,
            })
          ),
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 10. Calculate automatic priority
    // --------------------------------------------------

    const priorityData =
      calculatePriority(
        guests,
        start,
        "CONFIRMED"
      );

    // --------------------------------------------------
    // 11. Generate event code
    // --------------------------------------------------

    const eventCode = `EVT-${Date.now()
      .toString()
      .slice(-8)}`;

    // --------------------------------------------------
    // 12. Create Event + Function
    // --------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          const event =
            await tx.event.create({
              data: {
                eventCode,

                name: eventName.trim(),

                status: "CONFIRMED",

                startDate: start,

                endDate: end,

                venue:
                  selectedSpace.venue.name,

                venueId: venueId,

                spaceId: spaceId,

                guestCount: guests,

                description:
                  `Booked in ${selectedSpace.name}.`,

                // Automatic operational priority
                priority:
                  priorityData.priority,

                priorityScore:
                  priorityData.priorityScore,

                priorityReason:
                  priorityData.priorityReason,
              },
            });

          const createdFunction =
            await tx.function.create({
              data: {
                eventId: event.id,

                name: eventName.trim(),

                startTime: start,

                endTime: end,

                space:
                  selectedSpace.name,

                guestCount: guests,

                status: "CONFIRMED",

                notes:
                  `Venue: ${selectedSpace.venue.name}\n` +
                  `Space: ${selectedSpace.name}`,
              },
            });

          return {
            event,
            function: createdFunction,
          };
        }
      );

    // --------------------------------------------------
    // 13. Return successful booking
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Booking created successfully.",

        event: result.event,

        function: result.function,

        priority: {
          level:
            priorityData.priority,

          score:
            priorityData.priorityScore,

          reason:
            priorityData.priorityReason,
        },

        venue: {
          id:
            selectedSpace.venue.id,

          name:
            selectedSpace.venue.name,
        },

        space: {
          id:
            selectedSpace.id,

          name:
            selectedSpace.name,

          capacity:
            selectedSpace.capacity,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Calendar booking failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create booking.",
      },
      { status: 500 }
    );
  }
}