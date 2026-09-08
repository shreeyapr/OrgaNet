import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      resourceId,
      functionId,
      quantity,
      requiredQuantity,
      notes,
    } = body;

    // Check required fields
    if (!resourceId || !functionId) {
      return NextResponse.json(
        {
          error: "Resource and function are required",
        },
        { status: 400 }
      );
    }

    const requestedQuantity = Number(quantity);

    const requestedRequiredQuantity = Number(
      requiredQuantity ?? quantity
    );

    if (
      !requestedQuantity ||
      requestedQuantity < 1
    ) {
      return NextResponse.json(
        {
          error: "Quantity must be at least 1",
        },
        { status: 400 }
      );
    }

    if (
      !requestedRequiredQuantity ||
      requestedRequiredQuantity < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Required quantity must be at least 1",
        },
        { status: 400 }
      );
    }

    // Check resource
    const resource =
      await prisma.resource.findFirst({
        where: {
          id: resourceId,
          eventId: id,
        },
        include: {
          allocations: true,
        },
      });

    if (!resource) {
      return NextResponse.json(
        {
          error: "Resource not found",
        },
        { status: 404 }
      );
    }

    // Check function
    const eventFunction =
      await prisma.function.findFirst({
        where: {
          id: functionId,
          eventId: id,
        },
      });

    if (!eventFunction) {
      return NextResponse.json(
        {
          error: "Function not found",
        },
        { status: 404 }
      );
    }

    // Find existing allocation
    const existingAllocation =
      resource.allocations.find(
        (allocation) =>
          allocation.functionId === functionId
      );

    // Calculate total allocated quantity
    const alreadyAllocated =
      resource.allocations.reduce(
        (total, allocation) =>
          total + allocation.quantity,
        0
      );

    // --------------------------------
    // EXISTING ALLOCATION
    // --------------------------------

    if (existingAllocation) {
      const additionalAvailable =
        resource.quantity - alreadyAllocated;

      if (
        requestedQuantity >
        additionalAvailable
      ) {
        return NextResponse.json(
          {
            error: `Only ${additionalAvailable} additional units are available`,
          },
          { status: 400 }
        );
      }

      const newQuantity =
        existingAllocation.quantity +
        requestedQuantity;

      const updatedAllocation =
        await prisma.resourceAllocation.update({
          where: {
            id: existingAllocation.id,
          },
          data: {
            quantity: newQuantity,
            requiredQuantity:
              requestedRequiredQuantity,
            notes:
              notes ||
              existingAllocation.notes,
          },
          include: {
            resource: true,
            function: true,
          },
        });

      return NextResponse.json(
        updatedAllocation
      );
    }

    // --------------------------------
    // NEW ALLOCATION
    // --------------------------------

    const available =
      resource.quantity - alreadyAllocated;

    if (requestedQuantity > available) {
      return NextResponse.json(
        {
          error: `Only ${available} units are available`,
        },
        { status: 400 }
      );
    }

    const allocation =
      await prisma.resourceAllocation.create({
        data: {
          resourceId,
          functionId,
          quantity: requestedQuantity,
          requiredQuantity:
            requestedRequiredQuantity,
          notes: notes || null,
        },
        include: {
          resource: true,
          function: true,
        },
      });

    return NextResponse.json(
      allocation,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to allocate resource:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to allocate resource",
      },
      { status: 500 }
    );
  }
}