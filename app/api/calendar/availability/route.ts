import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { startTime, endTime, space } = body;

    if (!startTime || !endTime || !space) {
      return NextResponse.json(
        {
          error: "Start time, end time and space are required",
        },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date or time" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Find functions occupying the same space
    // during the requested time.
    const conflicts = await prisma.function.findMany({
      where: {
        space: space.trim(),
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

    return NextResponse.json({
      available: conflicts.length === 0,
      conflicts: conflicts.map((item) => ({
        functionId: item.id,
        functionName: item.name,
        eventId: item.event.id,
        eventName: item.event.name,
        startTime: item.startTime,
        endTime: item.endTime,
        space: item.space,
      })),
    });
  } catch (error) {
    console.error("Availability check failed:", error);

    return NextResponse.json(
      {
        error: "Failed to check availability",
      },
      { status: 500 }
    );
  }
}