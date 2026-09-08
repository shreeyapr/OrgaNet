"use client";
import AIChat from "@/app/components/AIChat";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ListTodo,
  MapPin,
  MoreHorizontal,
  Package,
  Pencil,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Event = {
  id: string;
  eventCode: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  venue: string | null;
  guestCount: number | null;
  description: string | null;
};

type Readiness = {
  score: number;

  breakdown: {
    information: number;
    confirmation: number;
    functions: number;
    tasks: number;
    resources: number;
  };

  totals: {
    functions: number;
    tasks: number;
    completedTasks: number;
    resources: number;
  };

  resourceDetails: {
    functionId: string;
    functionName: string;
    required: number;
    allocated: number;
    ready: boolean;
  }[];
};

type Risk = {
  severity: "HIGH" | "MEDIUM" | "LOW";
  type: string;
  title: string;
  description: string;
  recommendation: string;
};

type RisksResponse = {
  riskCount: number;
  summary: {
    high: number;
    medium: number;
    low: number;
  };
  risks: Risk[];
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function EventDetailsPage({ params }: PageProps) {
  const [eventId, setEventId] = useState("");
  const [event, setEvent] = useState<Event | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [risks, setRisks] = useState<RisksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setEventId(id);
      loadEvent(id);
    });
  }, [params]);

  async function loadEvent(id: string) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/events");

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const events: Event[] = await response.json();

      const selectedEvent = events.find((item) => item.id === id);

      if (!selectedEvent) {
        throw new Error("Event not found");
      }

      setEvent(selectedEvent);
      const readinessResponse = await fetch(`/api/events/${id}/readiness`);

      if (readinessResponse.ok) {
        const readinessData = await readinessResponse.json();

        setReadiness(readinessData);
      }

      const risksResponse = await fetch(`/api/events/${id}/risks`);

      if (risksResponse.ok) {
        const risksData = await risksResponse.json();
        setRisks(risksData);
      }
    } catch (error) {
      console.error(error);
      setError("Unable to load this event.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">Loading event...</p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="p-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Events
        </Link>

        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-sm font-medium text-rose-600">
            {error || "Event not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] p-5 sm:p-6 lg:p-8">
      {/* Back */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Events
      </Link>

      {/* Event Header */}
      <section className="mt-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                {event.name}
              </h1>

              <StatusBadge status={event.status} />
            </div>

            <p className="mt-2 text-sm text-slate-400">{event.eventCode}</p>

            {/* Event meta */}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <CalendarDays size={16} />
                {formatDate(event.startDate)}
              </span>

              <span className="flex items-center gap-2">
                <Clock3 size={16} />
                {formatTime(event.startDate)} – {formatTime(event.endDate)}
              </span>

              <span className="flex items-center gap-2">
                <MapPin size={16} />
                {event.venue ?? "Venue not assigned"}
              </span>

              <span className="flex items-center gap-2">
                <Users size={16} />
                {event.guestCount?.toLocaleString("en-IN") ?? 0} guests
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <Pencil size={16} />
              Edit Event
            </button>

            <button className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              <MoreHorizontal size={17} />
              More
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-200">
        <Tab label="Overview" icon={Activity} active />

        <Link
          href={`/events/${eventId}/functions`}
          className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
        >
          <CalendarDays size={15} />
          Functions
        </Link>
        <Link
          href={`/events/${eventId}/tasks`}
          className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
        >
          <ListTodo size={15} />
          Tasks
        </Link>

        <Link
          href={`/events/${eventId}/resources`}
          className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
        >
          <Package size={15} />
          Resources
        </Link>

        <Tab label="Financials" icon={Wallet} />

        <Tab label="Documents" icon={FileText} />

        <Tab label="Activity" icon={Activity} />
      </nav>

      {/* Overview */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Main content */}
        <div className="space-y-5">
          {/* Event Overview */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Event Overview
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Key information about this event.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={CalendarDays}
                label="Event Date"
                value={formatDate(event.startDate)}
              />

              <InfoCard
                icon={MapPin}
                label="Venue"
                value={event.venue ?? "Not assigned"}
              />

              <InfoCard
                icon={Users}
                label="Expected Guests"
                value={
                  event.guestCount
                    ? event.guestCount.toLocaleString("en-IN")
                    : "Not specified"
                }
              />

              <InfoCard
                icon={Clock3}
                label="Event Time"
                value={`${formatTime(event.startDate)} – ${formatTime(
                  event.endDate,
                )}`}
              />
            </div>
          </section>

          {/* Description */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Description</h2>

            <p className="mt-1 text-sm text-slate-400">
              Event information and notes.
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-5">
              {event.description ? (
                <p className="text-sm leading-6 text-slate-600">
                  {event.description}
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  No description has been added for this event yet.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <aside className="space-y-5">
          {/* AI Insight */}
          <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Sparkles size={18} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">AI Insight</h2>

                <p className="mt-1 text-xs text-violet-500">
                  VenueOps intelligence
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-violet-100 bg-white p-4">
              {event.status === "CONFIRMED" ? (
                <p className="text-sm leading-6 text-slate-600">
                  This event is confirmed and ready for operational planning.
                  Add functions and tasks to begin tracking event readiness.
                </p>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  This event is currently in{" "}
                  <strong>{event.status.toLowerCase()}</strong> status. Complete
                  the planning details before moving it toward confirmation.
                </p>
              )}
            </div>

            <Link
              href={`/events/${eventId}/functions`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <Sparkles size={14} />
              Plan Event Functions
            </Link>
          </section>

          {/* Readiness */}
          {/* Readiness */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Event Readiness
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Operational preparation
                </p>
              </div>

              <span className="text-sm font-bold text-slate-700">
                {readiness?.score ?? 0}%
              </span>
            </div>

            {/* Progress */}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-500"
                style={{
                  width: `${readiness?.score ?? 0}%`,
                }}
              />
            </div>

            {/* Checklist */}
            <div className="mt-5 space-y-3">
              <ReadinessItem
                label="Event information"
                complete={(readiness?.breakdown?.information ?? 0) === 10}
              />

              <ReadinessItem
                label="Event confirmed"
                complete={(readiness?.breakdown?.confirmation ?? 0) === 20}
              />

              <ReadinessItem
                label={`Functions planned (${readiness?.totals?.functions ?? 0})`}
                complete={(readiness?.totals?.functions ?? 0) > 0}
              />

              <ReadinessItem
                label={`Tasks completed (${readiness?.totals?.completedTasks ?? 0}/${readiness?.totals?.tasks ?? 0})`}
                complete={
                  (readiness?.totals?.tasks ?? 0) > 0 &&
                  (readiness?.totals?.completedTasks ?? 0) ===
                    (readiness?.totals?.tasks ?? 0)
                }
              />

              <ReadinessItem
                label="Resources allocated"
                complete={(readiness?.breakdown?.resources ?? 0) === 20}
              />
            </div>
          </section>
          {/* Risk Overview */}
<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-sm font-bold text-slate-900">
        Risk Overview
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Operational risks detected
      </p>
    </div>

    <span className="text-sm font-bold text-slate-700">
      {risks?.riskCount ?? 0}
    </span>
  </div>

  {/* Risk summary */}
  <div className="mt-4 grid grid-cols-3 gap-2">
    <div className="rounded-xl bg-rose-50 p-3 text-center">
      <div className="text-lg font-bold text-rose-600">
        {risks?.summary?.high ?? 0}
      </div>

      <div className="text-[10px] font-medium text-rose-500">
        High
      </div>
    </div>

    <div className="rounded-xl bg-amber-50 p-3 text-center">
      <div className="text-lg font-bold text-amber-600">
        {risks?.summary?.medium ?? 0}
      </div>

      <div className="text-[10px] font-medium text-amber-500">
        Medium
      </div>
    </div>

    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-lg font-bold text-slate-600">
        {risks?.summary?.low ?? 0}
      </div>

      <div className="text-[10px] font-medium text-slate-500">
        Low
      </div>
    </div>
  </div>

  {/* Risk list */}
  <div className="mt-5 space-y-3">
    {risks?.risks && risks.risks.length > 0 ? (
      risks.risks.map((risk, index) => (
        <div
          key={`${risk.type}-${index}`}
          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800">
                {risk.title}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {risk.description}
              </p>
            </div>

            <RiskBadge severity={risk.severity} />
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="text-[11px] font-semibold text-slate-700">
              Recommended action
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {risk.recommendation}
            </p>
          </div>
        </div>
      ))
    ) : (
      <div className="rounded-xl bg-emerald-50 p-4">
        <p className="text-xs font-semibold text-emerald-700">
          No operational risks detected.
        </p>

        <p className="mt-1 text-xs text-emerald-600">
          The event currently has no identified risks.
        </p>
      </div>
    )}
  </div>
</section>
        </aside>
      </div>
      <AIChat eventId={eventId} />
    </main>
  );
}

/* -------------------------------- */
/* Components */
/* -------------------------------- */

function Tab({
  label,
  icon: Icon,
  active = false,
}: {
  label: string;
  icon: React.ElementType;
  active?: boolean;
}) {
  return (
    <button
      className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-slate-950 text-slate-950"
          : "border-transparent text-slate-400 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-5">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon size={14} />
        {label}
      </div>

      <div className="mt-2 text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function ReadinessItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2
        size={16}
        className={complete ? "text-emerald-500" : "text-slate-200"}
      />

      <span
        className={`text-xs ${complete ? "text-slate-700" : "text-slate-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-600",
    PLANNING: "bg-amber-50 text-amber-600",
    CANCELLED: "bg-rose-50 text-rose-600",
  };

  const labels: Record<string, string> = {
    CONFIRMED: "Confirmed",
    PLANNING: "Planning",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        styles[status] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
function RiskBadge({
  severity,
}: {
  severity: "HIGH" | "MEDIUM" | "LOW";
}) {
  const styles = {
    HIGH: "bg-rose-100 text-rose-600",
    MEDIUM: "bg-amber-100 text-amber-600",
    LOW: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
        styles[severity]
      }`}
    >
      {severity}
    </span>
  );
}


/* -------------------------------- */
/* Date helpers */
/* -------------------------------- */

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}
