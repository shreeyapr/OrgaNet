import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "llama3.2:3b";

function detectSource(
  message: string
): "venueops" | "kb" | "both" {
  const text = message.toLowerCase();

  const venueOpsKeywords = [
    "my event",
    "this event",
    "our event",
    "event",
    "function",
    "functions",
    "task",
    "tasks",
    "resource",
    "resources",
    "allocation",
    "allocated",
    "readiness",
    "ready",
    "risk",
    "risks",
    "problem",
    "problems",
    "issue",
    "issues",
    "guest",
    "guests",
    "venue",
    "space",
    "schedule",
    "scheduled",
    "assigned",
    "pending",
    "todo",
    "overdue",
  ];

  const kbKeywords = [
    "momentus",
    "momentus elite",
    "how does",
    "how do",
    "what is",
    "what are",
    "how to",
    "documentation",
    "training",
    "feature",
    "features",
    "module",
    "workflow",
    "procedure",
  ];

  const hasVenueOps = venueOpsKeywords.some(
    (keyword) => text.includes(keyword)
  );

  const hasKB = kbKeywords.some(
    (keyword) => text.includes(keyword)
  );

  if (hasVenueOps && hasKB) {
    return "both";
  }

  if (hasKB) {
    return "kb";
  }

  return "venueops";
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const message = body.message;
    const eventId = body.eventId;

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required",
        },
        { status: 400 }
      );
    }

    const requestedSource =
      detectSource(message);

    // --------------------------------
    // 1. Get VenueOps event context
    // --------------------------------

    let venueContext = "";

    if (
      eventId &&
      (requestedSource === "venueops" ||
        requestedSource === "both")
    ) {
      try {
        const contextResponse =
          await fetch(
            `http://127.0.0.1:3000/api/events/${eventId}/ai/context`,
            {
              cache: "no-store",
            }
          );

        if (contextResponse.ok) {
          const context =
            await contextResponse.json();

          venueContext = JSON.stringify(
            context,
            null,
            2
          );
        }
      } catch (error) {
        console.error(
          "VenueOps context failed:",
          error
        );
      }
    }

    // --------------------------------
    // 2. Get event risks
    // --------------------------------

    let riskContext = "";

    if (
      eventId &&
      (requestedSource === "venueops" ||
        requestedSource === "both")
    ) {
      try {
        const riskResponse =
          await fetch(
            `http://127.0.0.1:3000/api/events/${eventId}/risks`,
            {
              cache: "no-store",
            }
          );

        if (riskResponse.ok) {
          const riskData =
            await riskResponse.json();

          riskContext = JSON.stringify(
            riskData,
            null,
            2
          );
        }
      } catch (error) {
        console.error(
          "Risk detection failed:",
          error
        );
      }
    }

    // --------------------------------
    // 3. Search Momentus KB
    // --------------------------------

    let kbContext = "";

    if (
      requestedSource === "kb" ||
      requestedSource === "both"
    ) {
      try {
        const kbResponse =
          await fetch(
            "http://127.0.0.1:3000/api/ai/kb",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                query: message,
              }),
              cache: "no-store",
            }
          );

        if (kbResponse.ok) {
          const kbData =
            await kbResponse.json();

          if (
            kbData.results &&
            kbData.results.length > 0
          ) {
            kbContext =
              kbData.results
                .map(
                  (result: {
                    title: string;
                    content: string;
                  }) =>
                    `SOURCE: ${result.title}\n${result.content}`
                )
                .join(
                  "\n\n----------------\n\n"
                );
          }
        }
      } catch (error) {
        console.error(
          "KB search failed:",
          error
        );
      }
    }

    // --------------------------------
    // 4. AI instructions
    // --------------------------------

    const systemPrompt = `
You are VenueOps AI.

You are an intelligent assistant for venue
and event operations.

You have access to three information sources:

SOURCE A — VENUEOPS EVENT DATA

This contains information about the user's
actual event, including:

- Event
- Functions
- Tasks
- Resources
- Allocations

SOURCE B — EVENT RISK ANALYSIS

This contains operational risks detected
from the user's actual event data.

Risks may include:

- Incomplete event information
- Event not confirmed
- Missing functions
- Pending tasks
- High-priority pending tasks
- Resource shortages
- Functions without resource allocations

SOURCE C — MOMENTUS ELITE KNOWLEDGE BASE

This contains documentation and training
information about Momentus Elite.

IMPORTANT RULES:

1. Use VenueOps data when the user asks about
   their actual event.

2. Use Risk Analysis when the user asks about
   risks, problems, issues, readiness concerns,
   or what needs attention.

3. Use Momentus documentation when the user
   asks how Momentus Elite works.

4. If the question is about multiple sources,
   clearly distinguish the sources.

5. Never invent information.

6. If the provided sources don't contain
   the answer, say that you don't have enough
   information.

7. Do not claim to have performed an action
   unless the application actually performed it.

8. Be concise, professional and useful.

9. When discussing numbers, use the exact
   numbers from the provided data.

10. If you identify an operational problem,
    explain the problem and suggest a practical
    next step.

11. The selected information source for this
    question is:

    ${requestedSource}

12. Use only the information sources relevant
    to the selected source.

VENUEOPS EVENT DATA:

${venueContext || "No event selected."}

EVENT RISK ANALYSIS:

${riskContext || "No risk information available."}

MOMENTUS ELITE KNOWLEDGE BASE:

${kbContext || "No relevant KB information found."}
`;

    // --------------------------------
    // 5. Ask Ollama
    // --------------------------------

    const ollamaResponse =
      await fetch(OLLAMA_URL, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
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
        }),
      });

    if (!ollamaResponse.ok) {
      const errorText =
        await ollamaResponse.text();

      console.error(
        "Ollama error:",
        errorText
      );

      return NextResponse.json(
        {
          error:
            "Could not connect to the local AI model.",
        },
        { status: 500 }
      );
    }

    const result =
      await ollamaResponse.json();

    return NextResponse.json({
      message:
        result.message?.content ??
        "I couldn't generate a response.",

      source: requestedSource,
    });
  } catch (error) {
    console.error(
      "AI chat error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing the AI request.",
      },
      { status: 500 }
    );
  }
}