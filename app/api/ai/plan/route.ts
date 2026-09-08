import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "llama3.2:3b";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const message = body.message;

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are the action planner for VenueOps.

Determine whether the user's message is asking
to CREATE A TASK.

Return ONLY valid JSON.

If the user is asking to create a task, return:

{
  "action": "CREATE_TASK",
  "requiresConfirmation": true,
  "data": {
    "name": "...",
    "description": "...",
    "priority": "LOW|MEDIUM|HIGH",
    "status": "TODO"
  }
}

If the user is NOT asking to create a task, return:

{
  "action": "NONE",
  "requiresConfirmation": false
}

Rules:

- Never invent a task that the user did not request.
- If the user clearly asks to create/add/make a task,
  extract the task name.
- Default priority to MEDIUM unless the user specifies
  another priority.
- Default status to TODO.
- Keep the description concise.
- Return JSON only.

USER MESSAGE:

${message}
`;

    const response = await fetch(
      OLLAMA_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: message,
            },
          ],

          stream: false,

          format: "json",
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Could not connect to local AI.",
        },
        { status: 500 }
      );
    }

    const result = await response.json();

    let plan;

    try {
      plan = JSON.parse(
        result.message?.content || "{}"
      );
    } catch {
      return NextResponse.json(
        {
          action: "NONE",
          requiresConfirmation: false,
        }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error(
      "AI planning error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create AI action plan.",
      },
      { status: 500 }
    );
  }
}