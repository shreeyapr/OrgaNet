"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Plus,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Task = {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  dueDate: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function TasksPage({ params }: PageProps) {
  const [eventId, setEventId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    priority: "MEDIUM",
    assignedTo: "",
    dueDate: "",
  });

  useEffect(() => {
    params.then(({ id }) => {
      setEventId(id);
      loadTasks(id);
    });
  }, [params]);

  async function loadTasks(id: string) {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/events/${id}/tasks`
      );

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();

      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function createTask() {
    if (!form.name.trim()) {
      alert("Please enter a task name.");
      return;
    }

    try {
      const response = await fetch(
        `/api/events/${eventId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            priority: form.priority,
            assignedTo: form.assignedTo,
            dueDate: form.dueDate || null,
            status: "TODO",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      setShowModal(false);

      setForm({
        name: "",
        description: "",
        priority: "MEDIUM",
        assignedTo: "",
        dueDate: "",
      });

      await loadTasks(eventId);
    } catch (error) {
      console.error(error);
      alert("Could not create task.");
    }
  }

  const completed = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const inProgress = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const highPriority = tasks.filter(
    (task) => task.priority === "HIGH"
  ).length;

  return (
    <main className="mx-auto max-w-[1400px] p-5 sm:p-6 lg:p-8">

      {/* Back */}
      <Link
        href={`/events/${eventId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Event
      </Link>

      {/* Header */}
      <section className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Tasks
            </h1>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {tasks.length}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Track and manage operational tasks for this event.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={17} />
          Add Task
        </button>

      </section>

      {/* Summary */}
      <section className="mt-7 grid gap-4 sm:grid-cols-4">

        <SummaryCard
          label="Total Tasks"
          value={tasks.length}
          icon={ListTodo}
        />

        <SummaryCard
          label="Completed"
          value={completed}
          icon={CheckCircle2}
        />

        <SummaryCard
          label="In Progress"
          value={inProgress}
          icon={Clock3}
        />

        <SummaryCard
          label="High Priority"
          value={highPriority}
          icon={AlertTriangle}
        />

      </section>

      {/* Content */}
      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">

        {/* Task list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-base font-bold text-slate-900">
              Operational Tasks
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Tasks that need to be completed for this event.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              onAdd={() => setShowModal(true)}
            />
          ) : (
            <div className="divide-y divide-slate-100">

              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                />
              ))}

            </div>
          )}

        </div>

        {/* AI panel */}
        <aside>

          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Sparkles size={17} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  AI Task Insight
                </h2>

                <p className="mt-1 text-xs text-violet-500">
                  VenueOps intelligence
                </p>
              </div>

            </div>

            <div className="mt-5 rounded-xl border border-violet-100 bg-white p-4">

              {tasks.length === 0 ? (
                <p className="text-sm leading-5 text-slate-500">
                  Add operational tasks and AI will
                  eventually identify priorities,
                  overdue work and readiness risks.
                </p>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  You currently have{" "}
                  <strong>{tasks.length}</strong> task
                  {tasks.length !== 1 ? "s" : ""}.
                  {" "}
                  {highPriority > 0 && (
                    <>
                      <strong>{highPriority}</strong>{" "}
                      {highPriority === 1
                        ? "is"
                        : "are"}{" "}
                      high priority.
                    </>
                  )}
                </p>
              )}

            </div>

            <button
              disabled={tasks.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles size={14} />
              Analyze Tasks
            </button>

          </div>

        </aside>

      </section>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-100 p-5">

              <h2 className="text-lg font-bold text-slate-900">
                Add Task
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Create an operational task for this event.
              </p>

            </div>

            <div className="space-y-4 p-5">

              <Field
                label="Task Name"
                value={form.name}
                onChange={(value) =>
                  setForm({
                    ...form,
                    name: value,
                  })
                }
                placeholder="e.g. Test AV equipment"
              />

              <Field
                label="Description"
                value={form.description}
                onChange={(value) =>
                  setForm({
                    ...form,
                    description: value,
                  })
                }
                placeholder="Describe what needs to be done..."
              />

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>
                  </select>
                </div>

                <Field
                  label="Assigned To"
                  value={form.assignedTo}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      assignedTo: value,
                    })
                  }
                  placeholder="Operations Team"
                />

              </div>

              <Field
                label="Due Date"
                type="datetime-local"
                value={form.dueDate}
                onChange={(value) =>
                  setForm({
                    ...form,
                    dueDate: value,
                  })
                }
              />

            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">

              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={createTask}
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create Task
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

/* -------------------------------- */
/* Task Row */
/* -------------------------------- */

function TaskRow({
  task,
}: {
  task: Task;
}) {
  const [status, setStatus] = useState(task.status);

  const completed = status === "COMPLETED";

  async function updateStatus() {
    let nextStatus = "IN_PROGRESS";

    if (status === "IN_PROGRESS") {
      nextStatus = "COMPLETED";
    }

    if (status === "COMPLETED") {
      nextStatus = "TODO";
    }

    try {
      const response = await fetch(
        `/api/events/${task.eventId}/tasks`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId: task.id,
            status: nextStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      setStatus(nextStatus);
    } catch (error) {
      console.error(error);
      alert("Could not update task status.");
    }
  }

  return (
    <div className="p-5 transition hover:bg-slate-50/60 sm:p-6">

      <div className="flex items-start gap-4">

        <button
          onClick={updateStatus}
          title={`Change status: ${formatStatus(status)}`}
          className="mt-1 shrink-0 text-slate-300 transition hover:text-emerald-500"
        >
          {completed ? (
            <CheckCircle2
              size={20}
              className="text-emerald-500"
            />
          ) : status === "IN_PROGRESS" ? (
            <Clock3
              size={20}
              className="text-blue-500"
            />
          ) : (
            <Circle size={20} />
          )}
        </button>

        <div className="min-w-0 flex-1">

          <div className="flex flex-col justify-between gap-3 sm:flex-row">

            <div>
              <h3
                className={`text-sm font-bold ${
                  completed
                    ? "text-slate-400 line-through"
                    : "text-slate-900"
                }`}
              >
                {task.name}
              </h3>

              {task.description && (
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {task.description}
                </p>
              )}
            </div>

            <PriorityBadge
              priority={task.priority}
            />

          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">

            {task.assignedTo && (
              <span className="flex items-center gap-1.5">
                <User size={13} />
                {task.assignedTo}
              </span>
            )}

            {task.dueDate && (
              <span className="flex items-center gap-1.5">
                <Clock3 size={13} />
                Due {formatDate(task.dueDate)}
              </span>
            )}

            <span className="flex items-center gap-1.5">
              <ListTodo size={13} />
              {formatStatus(status)}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icon size={18} />
        </div>

      </div>

    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const styles: Record<string, string> = {
    HIGH: "bg-rose-50 text-rose-600",
    MEDIUM: "bg-amber-50 text-amber-600",
    LOW: "bg-emerald-50 text-emerald-600",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[priority] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {priority}
    </span>
  );
}

function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="p-12 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <ListTodo size={22} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        No tasks yet
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">
        Add operational tasks to start tracking event
        preparation.
      </p>

      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
      >
        <Plus size={14} />
        Add Task
      </button>

    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-300 focus:border-slate-400"
      />
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
  };

  return labels[status] ?? status;
}