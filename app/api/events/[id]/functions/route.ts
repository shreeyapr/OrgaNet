import { NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const functions = await prisma.function.findMany({
      where: {
        eventId: id,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(functions);
  } catch (error) {
    console.error("Failed to fetch functions:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch functions",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const event = await prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      return NextResponse.json(
        {
          error: "Event not found",
        },
        {
          status: 404,
        }
      );
    }

    const eventFunction = await prisma.function.create({
      data: {
        eventId: id,
        name: body.name,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        space: body.space || null,
        guestCount:
          body.guestCount !== undefined
            ? Number(body.guestCount)
            : null,
        status: body.status ?? "PLANNING",
        notes: body.notes || null,
      },
    });

    return NextResponse.json(eventFunction, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create function:", error);

    return NextResponse.json(
      {
        error: "Failed to create function",
      },
      {
        status: 500,
      }
    );
  }
}