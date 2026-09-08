import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

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
          error: "Guest count must be a valid positive number.",
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

    const selectedSpace = await prisma.space.findUnique({
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

    // Make sure the space actually belongs to the
    // selected venue.

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
    // 9. Check overlapping functions
    // --------------------------------------------------

    const conflicts = await prisma.function.findMany({
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

          conflicts: conflicts.map((conflict) => ({
            functionId: conflict.id,
            functionName: conflict.name,

            eventId: conflict.eventId,
            eventName: conflict.event.name,

            startTime: conflict.startTime,
            endTime: conflict.endTime,

            space: conflict.space,
          })),
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 10. Generate event code
    // --------------------------------------------------

    const eventCode = `EVT-${Date.now()
      .toString()
      .slice(-8)}`;

    // --------------------------------------------------
    // 11. Create Event + Function
    // --------------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          eventCode,

          name: eventName.trim(),

          status: "CONFIRMED",

          startDate: start,
          endDate: end,

          venue: selectedSpace.venue.name,

          venueId: venueId,
          spaceId: spaceId,

          guestCount: guests,

          description:
            `Booked in ${selectedSpace.name}.`,
        },
      });

      const createdFunction = await tx.function.create({
        data: {
          eventId: event.id,

          name: eventName.trim(),

          startTime: start,
          endTime: end,

          space: selectedSpace.name,

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
    });

    // --------------------------------------------------
    // 12. Return successful booking
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message: "Booking created successfully.",

        event: result.event,

        function: result.function,

        venue: {
          id: selectedSpace.venue.id,
          name: selectedSpace.venue.name,
        },

        space: {
          id: selectedSpace.id,
          name: selectedSpace.name,
          capacity: selectedSpace.capacity,
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
        error: "Failed to create booking.",
      },
      { status: 500 }
    );
  }
}