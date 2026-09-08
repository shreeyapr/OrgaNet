import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        functions: {
          include: {
            allocations: {
              include: {
                resource: true,
              },
            },
          },
          orderBy: {
            startTime: "asc",
          },
        },

        tasks: {
          orderBy: {
            dueDate: "asc",
          },
        },

        resources: {
          include: {
            allocations: {
              include: {
                function: true,
              },
            },
          },
        },
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

    // -----------------------------
    // Task summary
    // -----------------------------

    const completedTasks =
      event.tasks.filter(
        (task) => task.status === "COMPLETED"
      ).length;

    const inProgressTasks =
      event.tasks.filter(
        (task) => task.status === "IN_PROGRESS"
      ).length;

    const pendingTasks =
      event.tasks.filter(
        (task) => task.status === "TODO"
      ).length;

    // -----------------------------
    // Resource summary
    // -----------------------------

    const resourceSummary =
      event.resources.map((resource) => {
        const allocated =
          resource.allocations.reduce(
            (total, allocation) =>
              total + allocation.quantity,
            0
          );

        const required =
          resource.allocations.reduce(
            (total, allocation) =>
              total +
              allocation.requiredQuantity,
            0
          );

        return {
          name: resource.name,
          type: resource.type,
          totalQuantity: resource.quantity,
          allocatedQuantity: allocated,
          requiredQuantity: required,
          availableQuantity:
            resource.quantity - allocated,
          status: resource.status,
          location: resource.location,
        };
      });

    // -----------------------------
    // Function summary
    // -----------------------------

    const functionSummary =
      event.functions.map((eventFunction) => ({
        id: eventFunction.id,
        name: eventFunction.name,
        startTime: eventFunction.startTime,
        endTime: eventFunction.endTime,
        space: eventFunction.space,
        guestCount: eventFunction.guestCount,
        status: eventFunction.status,

        resources:
          eventFunction.allocations.map(
            (allocation) => ({
              resource:
                allocation.resource.name,
              required:
                allocation.requiredQuantity,
              allocated:
                allocation.quantity,
              notes: allocation.notes,
            })
          ),
      }));

    // -----------------------------
    // AI context
    // -----------------------------

    const context = {
      event: {
        id: event.id,
        code: event.eventCode,
        name: event.name,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
        guestCount: event.guestCount,
        description: event.description,
      },

      functions: functionSummary,

      tasks: {
        total: event.tasks.length,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,

        items: event.tasks.map((task) => ({
          name: task.name,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assignedTo,
          dueDate: task.dueDate,
        })),
      },

      resources: {
        totalTypes: event.resources.length,

        items: resourceSummary,
      },
    };

    return NextResponse.json(context);
  } catch (error) {
    console.error(
      "Failed to build AI context:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to build AI context",
      },
      {
        status: 500,
      }
    );
  }
}