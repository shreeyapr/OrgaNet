"use client";

import {
    CalendarDays,
    ChevronDown,
    ChevronRight,
    Clock3,
    MapPin,
    Plus,
    Search,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);

        const response = await fetch("/api/events");

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();

        setEvents(data);
      } catch (error) {
        console.error(error);
        setError("Unable to load events.");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        event.eventCode
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        event.venue
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        event.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [events, search, statusFilter]);

  return (
    <main className="mx-auto max-w-[1600px] p-5 sm:p-6 lg:p-8">

      {/* Page heading */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Events
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage all your venue events in one place.
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          <Plus size={17} />
          New Event
        </button>
      </section>

      {/* Summary cards */}
      <section className="mt-7 grid gap-4 sm:grid-cols-3">

        <SummaryCard
          label="Total Events"
          value={events.length.toString()}
          icon={CalendarDays}
        />

        <SummaryCard
          label="Confirmed"
          value={
            events.filter(
              (event) => event.status === "CONFIRMED"
            ).length.toString()
          }
          icon={CalendarDays}
        />

        <SummaryCard
          label="Planning"
          value={
            events.filter(
              (event) => event.status === "PLANNING"
            ).length.toString()
          }
          icon={Clock3}
        />

      </section>

      {/* Filters */}
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/30">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          {/* Search */}
          <div className="relative w-full lg:max-w-md">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search events..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-medium text-slate-600 outline-none focus:border-slate-400"
            >
              <option value="ALL">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PLANNING">Planning</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

        </div>
      </section>

      {/* Events */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">

        {/* Table heading */}
        <div className="hidden grid-cols-[minmax(240px,2fr)_1.2fr_1.2fr_1fr_40px] gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 lg:grid">
          <div>Event</div>
          <div>Date</div>
          <div>Venue</div>
          <div>Status</div>
          <div />
        </div>

        {loading && (
          <div className="p-10 text-center">
            <div className="text-sm font-medium text-slate-500">
              Loading events...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="p-10 text-center">
            <div className="text-sm font-medium text-rose-600">
              {error}
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          filteredEvents.length === 0 && (
            <div className="p-12 text-center">
              <CalendarDays
                size={28}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-3 text-sm font-semibold text-slate-800">
                No events found
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Try changing your search or status filter.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
            />
          ))}
      </section>

      {/* Result count */}
      {!loading && !error && (
        <div className="mt-3 text-xs text-slate-400">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      )}

    </main>
  );
}

function EventRow({
  event,
}: {
  event: Event;
}) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group grid gap-4 border-b border-slate-100 px-5 py-4 transition last:border-b-0 hover:bg-slate-50 lg:grid-cols-[minmax(240px,2fr)_1.2fr_1.2fr_1fr_40px] lg:items-center"
    >

      {/* Event */}
      <div>
        <div className="flex items-start gap-3">

          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <CalendarDays size={17} />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">
              {event.name}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              {event.eventCode}
            </div>
          </div>

        </div>
      </div>

      {/* Date */}
      <div>
        <div className="text-sm font-medium text-slate-700">
          {formatDate(event.startDate)}
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          <Clock3 size={12} />
          {formatTime(event.startDate)}
        </div>
      </div>

      {/* Venue */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <MapPin
          size={14}
          className="shrink-0 text-slate-400"
        />

        <span className="truncate">
          {event.venue ?? "Not assigned"}
        </span>
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={event.status} />
      </div>

      {/* Arrow */}
      <div className="hidden lg:flex justify-end">
        <ChevronRight
          size={17}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
        />
      </div>

      {/* Mobile information */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400 lg:hidden">

        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {event.venue ?? "Not assigned"}
        </span>

        <span className="flex items-center gap-1">
          <Users size={12} />
          {event.guestCount ?? 0} guests
        </span>

      </div>

    </Link>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-center justify-between">

        <div>
          <div className="text-xs font-medium text-slate-400">
            {label}
          </div>

          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icon size={18} />
        </div>

      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    CONFIRMED:
      "bg-emerald-50 text-emerald-600",
    PLANNING:
      "bg-amber-50 text-amber-600",
    CANCELLED:
      "bg-rose-50 text-rose-600",
  };

  const labels: Record<string, string> = {
    CONFIRMED: "Confirmed",
    PLANNING: "Planning",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[status] ??
        "bg-slate-100 text-slate-500"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

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