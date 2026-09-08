"use client";

import {
  Bot,
  Loader2,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  source?: "venueops" | "kb" | "both" | "none";
};

type ActionPlan = {
  action: string;
  requiresConfirmation: boolean;
  data?: {
    name?: string;
    description?: string;
    priority?: string;
    status?: string;
  };
};

export default function AIChat({
  eventId,
}: AIChatProps) {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm VenueOps AI. I can help you understand event readiness, functions, tasks, resources and operational details.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<ActionPlan | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

async function sendMessage() {
  const message = input.trim();

  if (!message || loading) return;

  setInput("");

  setMessages((previous) => [
    ...previous,
    {
      role: "user",
      content: message,
    },
  ]);

  setLoading(true);

  try {
    // --------------------------------
    // First: check whether this is an action
    // --------------------------------

    const planResponse = await fetch(
      "/api/ai/plan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      }
    );

    if (planResponse.ok) {
      const plan =
        await planResponse.json();

      if (
        plan.action !== "NONE" &&
        plan.requiresConfirmation
      ) {
        setPendingAction(plan);

        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content:
              "I can prepare that action for you. Please review the details below and confirm if you want me to create it.",
          },
        ]);

        return;
      }
    }

    // --------------------------------
    // Normal AI question
    // --------------------------------

    const response = await fetch(
      "/api/ai/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          eventId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to contact VenueOps AI."
      );
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content: data.message,
        source: data.source,
      },
    ]);
  } catch (error) {
    console.error(error);

    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content:
          "I'm sorry, I couldn't process that request. Please make sure Ollama is running.",
      },
    ]);
  } finally {
    setLoading(false);
  }
}

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  async function confirmAction() {
  if (!pendingAction || !eventId) return;

  setLoading(true);

  try {
    const response = await fetch(
      "/api/ai/action",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: pendingAction.action,
          eventId,
          data: pendingAction.data,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Action could not be completed."
      );
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content:
          "Done. The task has been created successfully.",
      },
    ]);

    setPendingAction(null);
  } catch (error) {
    console.error(error);

    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content:
          "I couldn't complete that action. Please try again.",
      },
    ]);
  } finally {
    setLoading(false);
  }
}

function cancelAction() {
  setPendingAction(null);

  setMessages((previous) => [
    ...previous,
    {
      role: "assistant",
      content:
        "No problem. I cancelled that action.",
    },
  ]);
}
  return (
    <>
      {/* Floating Button */}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Sparkles size={17} />
          VenueOps AI
        </button>
      )}

      {/* Chat Window */}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[620px] w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

          {/* Header */}

          <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Bot size={18} />
              </div>

              <div>
                <h2 className="text-sm font-bold">
                  VenueOps AI
                </h2>

                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Local AI
                </div>
              </div>

            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X size={17} />
            </button>

          </div>

          {/* Context */}

          {eventId && (
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-[10px] font-medium text-slate-400">
              AI is using the current event as context
            </div>
          )}

          {/* Messages */}

          <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4">

            <div className="space-y-4">

              {messages.map(
                (message, index) => (
                  <div
                    key={index}
                    className={`flex gap-2.5 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    {message.role ===
                      "assistant" && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                        <Sparkles size={14} />
                      </div>
                    )}

                    <div
  className={`max-w-[82%] rounded-2xl px-3.5 py-3 text-sm leading-5 ${
    message.role === "user"
      ? "rounded-br-md bg-slate-950 text-white"
      : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
  }`}
>
  {message.role === "assistant" &&
    message.source &&
    message.source !== "none" && (
      <div className="mb-2">
        {message.source === "venueops" && (
          <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-600">
            📊 VenueOps Data
          </span>
        )}

        {message.source === "kb" && (
          <span className="inline-flex rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-600">
            📚 Momentus Elite KB
          </span>
        )}

        {message.source === "both" && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-600">
              📊 VenueOps Data
            </span>

            <span className="inline-flex rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-600">
              📚 Momentus Elite KB
            </span>
          </div>
        )}
      </div>
    )}

  {message.content}
</div>

                    {message.role ===
                      "user" && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                        <User size={14} />
                      </div>
                    )}

                  </div>
                )
              )}
              {pendingAction &&
  pendingAction.action ===
    "CREATE_TASK" && (
    <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">

      <div className="flex items-start gap-3">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Sparkles size={15} />
        </div>

        <div className="min-w-0 flex-1">

          <p className="text-xs font-bold text-violet-900">
            Create this task?
          </p>

          <div className="mt-3 rounded-xl border border-violet-100 bg-white p-3">

            <p className="text-sm font-bold text-slate-900">
              {pendingAction.data?.name}
            </p>

            {pendingAction.data?.description && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {pendingAction.data.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">

              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-600">
                Priority:{" "}
                {pendingAction.data?.priority}
              </span>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                Status:{" "}
                {pendingAction.data?.status}
              </span>

            </div>

          </div>

          <div className="mt-3 flex gap-2">

            <button
              onClick={confirmAction}
              disabled={loading}
              className="flex-1 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-40"
            >
              Confirm
            </button>

            <button
              onClick={cancelAction}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Cancel
            </button>

          </div>

        </div>

      </div>

    </div>
  )}

              {loading && (
                <div className="flex items-start gap-2.5">

                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <Sparkles size={14} />
                  </div>

                  <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      VenueOps AI is thinking...
                    </div>
                  </div>

                </div>
              )}

              <div ref={messagesEndRef} />

            </div>

          </div>

          {/* Suggestions */}

          {messages.length === 1 &&
            !loading && (
              <div className="border-t border-slate-100 bg-white px-4 py-3">

                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Try asking
                </p>

                <div className="flex flex-wrap gap-2">

                  {[
                    "How ready is this event?",
                    "What tasks are pending?",
                    "What resources are allocated?",
                  ].map((question) => (
                    <button
                      key={question}
                      onClick={() =>
                        setInput(question)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                    >
                      {question}
                    </button>
                  ))}

                </div>

              </div>
            )}

          {/* Input */}

          <div className="border-t border-slate-200 bg-white p-3">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-slate-400">

              <input
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask VenueOps AI..."
                disabled={loading}
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
              />

              <button
                onClick={sendMessage}
                disabled={
                  !input.trim() || loading
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Send size={15} />
              </button>

            </div>

            <p className="mt-2 text-center text-[9px] text-slate-400">
              Powered by local AI • VenueOps
            </p>

          </div>

        </div>
      )}
    </>
  );
}