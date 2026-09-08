import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const {
      action,
      eventId,
      data,
    } = body;

    if (!action || !eventId) {
      return NextResponse.json(
        {
          error:
            "Action and eventId are required",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // CREATE TASK
    // --------------------------------

    if (action === "CREATE_TASK") {
      if (!data?.name) {
        return NextResponse.json(
          {
            error:
              "Task name is required",
          },
          { status: 400 }
        );
      }

      const event =
        await prisma.event.findUnique({
          where: {
            id: eventId,
          },
        });

      if (!event) {
        return NextResponse.json(
          {
            error: "Event not found",
          },
          { status: 404 }
        );
      }

      const task =
        await prisma.task.create({
          data: {
            eventId,

            name: data.name,

            description:
              data.description || null,

            status:
              data.status || "TODO",

            priority:
              data.priority || "MEDIUM",

            assignedTo:
              data.assignedTo || null,

            dueDate:
              data.dueDate
                ? new Date(data.dueDate)
                : null,
          },
        });

      return NextResponse.json({
        success: true,
        action: "CREATE_TASK",
        task,
      });
    }

    // --------------------------------
    // UNKNOWN ACTION
    // --------------------------------

    return NextResponse.json(
      {
        error:
          "Unsupported AI action",
      },
      { status: 400 }
    );

  } catch (error) {
    console.error(
      "AI action error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to perform AI action",
      },
      { status: 500 }
    );
  }
}