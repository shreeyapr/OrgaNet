import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/events/[id]/resources
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const resources = await prisma.resource.findMany({
      where: {
        eventId: id,
      },
      include: {
        allocations: {
          include: {
            function: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Failed to fetch resources:", error);

    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/resources
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Resource name is required" },
        { status: 400 }
      );
    }

    if (!body.type) {
      return NextResponse.json(
        { error: "Resource type is required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        eventId: id,
        name: body.name,
        type: body.type,
        quantity: body.quantity
          ? Number(body.quantity)
          : 1,
        status: body.status || "AVAILABLE",
        location: body.location || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(resource, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create resource:", error);

    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}