import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

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
            allocations: true,
          },
        },
        tasks: true,
        resources: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const risks: {
      severity: "HIGH" | "MEDIUM" | "LOW";
      type: string;
      title: string;
      description: string;
      recommendation: string;
    }[] = [];

    // 1. Event information
    if (
      !event.name ||
      !event.startDate ||
      !event.endDate ||
      !event.venue ||
      !event.guestCount
    ) {
      risks.push({
        severity: "HIGH",
        type: "EVENT_INFORMATION",
        title: "Incomplete event information",
        description:
          "Some important event information is missing.",
        recommendation:
          "Complete the event details before finalizing operations.",
      });
    }

    // 2. Event confirmation
    if (event.status !== "CONFIRMED") {
      risks.push({
        severity: "HIGH",
        type: "EVENT_STATUS",
        title: "Event is not confirmed",
        description:
          `The event status is currently ${event.status}.`,
        recommendation:
          "Confirm the event before final operational preparation.",
      });
    }

    // 3. Functions
    if (event.functions.length === 0) {
      risks.push({
        severity: "HIGH",
        type: "FUNCTIONS",
        title: "No functions scheduled",
        description:
          "This event does not have any functions configured.",
        recommendation:
          "Add the required functions and schedules for the event.",
      });
    }

    // 4. Tasks
    const pendingTasks = event.tasks.filter(
      (task) => task.status !== "COMPLETED"
    );

    const highPriorityPendingTasks =
      pendingTasks.filter(
        (task) => task.priority === "HIGH"
      );

    if (highPriorityPendingTasks.length > 0) {
      risks.push({
        severity: "HIGH",
        type: "TASKS",
        title: "High-priority tasks are pending",
        description:
          `${highPriorityPendingTasks.length} high-priority task(s) are not completed.`,
        recommendation:
          "Complete the high-priority tasks before the event.",
      });
    } else if (pendingTasks.length > 0) {
      risks.push({
        severity: "MEDIUM",
        type: "TASKS",
        title: "Tasks are still pending",
        description:
          `${pendingTasks.length} task(s) are not completed.`,
        recommendation:
          "Review the remaining tasks and complete them before the event.",
      });
    }

    // 5. Resource shortages
    for (const eventFunction of event.functions) {
      const required =
        eventFunction.allocations.reduce(
          (total, allocation) =>
            total + allocation.requiredQuantity,
          0
        );

      const allocated =
        eventFunction.allocations.reduce(
          (total, allocation) =>
            total + allocation.quantity,
          0
        );

      if (required > 0 && allocated < required) {
        const shortage = required - allocated;

        risks.push({
          severity: "HIGH",
          type: "RESOURCE_SHORTAGE",
          title:
            `Resource shortage for ${eventFunction.name}`,
          description:
            `${shortage} resource unit(s) are still required.`,
          recommendation:
            `Allocate the remaining ${shortage} resource unit(s) before the function.`,
        });
      }
    }

    // 6. Functions without resources
    for (const eventFunction of event.functions) {
      if (eventFunction.allocations.length === 0) {
        risks.push({
          severity: "MEDIUM",
          type: "RESOURCE_ALLOCATION",
          title:
            `${eventFunction.name} has no resources`,
          description:
            "No resources have been allocated to this function.",
          recommendation:
            "Review the function requirements and allocate the necessary resources.",
        });
      }
    }

    const high = risks.filter(
      (risk) => risk.severity === "HIGH"
    ).length;

    const medium = risks.filter(
      (risk) => risk.severity === "MEDIUM"
    ).length;

    const low = risks.filter(
      (risk) => risk.severity === "LOW"
    ).length;

    return NextResponse.json({
      eventId: event.id,
      eventName: event.name,
      riskCount: risks.length,

      summary: {
        high,
        medium,
        low,
      },

      risks,
    });
  } catch (error) {
    console.error(
      "Failed to detect event risks:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to detect event risks",
      },
      { status: 500 }
    );
  }
}