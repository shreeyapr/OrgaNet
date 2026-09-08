"use client";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";

type EventFunction = {
  id: string;
  eventId: string;
  name: string;
  startTime: string;
  endTime: string;
  space: string;
  guestCount: number | null;
  status: string;
  notes: string | null;
};

type Space = {
  id: string;
  name: string;
  capacity: number | null;
  status: string;
  venueId: string;
};

type Venue = {
  id: string;
  name: string;
  address?: string | null;
  status: string;
  spaces: Space[];
};

type EventData = {
  id: string;
  name: string;
  venue?: string | null;
  venueId?: string | null;
  spaceId?: string | null;
  guestCount?: number | null;
  startDate?: string;
  endDate?: string;
};

type FormState = {
  name: string;
  startTime: string;
  endTime: string;
  venueId: string;
  spaceId: string;
  guestCount: string;
  status: string;
  notes: string;
};

type AvailabilityState = {
  checked: boolean;
  available: boolean;
  message: string;
};

export default function FunctionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [eventId, setEventId] = useState("");

  const [event, setEvent] = useState<EventData | null>(null);
  const [functions, setFunctions] = useState<EventFunction[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  const [loading, setLoading] = useState(true);
  const [venuesLoading, setVenuesLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingAvailability, setCheckingAvailability] =
    useState(false);

  const [availability, setAvailability] =
    useState<AvailabilityState | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    startTime: "",
    endTime: "",
    venueId: "",
    spaceId: "",
    guestCount: "",
    status: "CONFIRMED",
    notes: "",
  });

  useEffect(() => {
    params.then(({ id }) => setEventId(id));
  }, [params]);

  useEffect(() => {
    if (!eventId) return;

    loadEvent();
    loadFunctions();
    loadVenues();
  }, [eventId]);

  async function loadEvent() {
    try {
      const response = await fetch(`/api/events/${eventId}`);

      if (!response.ok) return;

      const data = await response.json();

      setEvent(data);
    } catch (error) {
      console.error("Failed to load event:", error);
    }
  }

  async function loadFunctions() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/events/${eventId}/functions`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load functions");
      }

      const data = await response.json();

      setFunctions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load functions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVenues() {
    try {
      setVenuesLoading(true);

      const response = await fetch("/api/venues", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load venues");
      }

      const data = await response.json();

      const venueList = Array.isArray(data)
        ? data
        : Array.isArray(data.venues)
        ? data.venues
        : [];

      setVenues(venueList);

      /*
       * If this event already has a venue/space,
       * pre-select them in the Add Function form.
       */
      if (event) {
        const matchedVenue =
          venueList.find(
            (venue: Venue) => venue.id === event.venueId
          ) ??
          venueList.find(
            (venue: Venue) => venue.name === event.venue
          );

        if (matchedVenue) {
          const matchedSpace =
            matchedVenue.spaces?.find(
              (space) => space.id === event.spaceId
            ) ??
            matchedVenue.spaces?.find(
              (space) => space.name === event.space
            );

          setForm((current) => ({
            ...current,
            venueId: matchedVenue.id,
            spaceId:
              matchedSpace?.id ?? current.spaceId,
            guestCount:
              current.guestCount ||
              String(event.guestCount ?? ""),
          }));
        }
      }
    } catch (error) {
      console.error("Failed to load venues:", error);
    } finally {
      setVenuesLoading(false);
    }
  }

  /*
   * Re-run venue matching once event + venues are both available.
   */
  useEffect(() => {
    if (!event || venues.length === 0) return;

    const matchedVenue =
      venues.find(
        (venue) => venue.id === event.venueId
      ) ??
      venues.find(
        (venue) => venue.name === event.venue
      );

    if (!matchedVenue) return;

    const matchedSpace =
      matchedVenue.spaces?.find(
        (space) => space.id === event.spaceId
      ) ??
      matchedVenue.spaces?.find(
        (space) => space.name === event.space
      );

    setForm((current) => ({
      ...current,
      venueId: current.venueId || matchedVenue.id,
      spaceId: current.spaceId || matchedSpace?.id || "",
      guestCount:
        current.guestCount ||
        String(event.guestCount ?? ""),
    }));
  }, [event, venues]);

  const selectedVenue = useMemo(() => {
    return venues.find((venue) => venue.id === form.venueId);
  }, [venues, form.venueId]);

  const selectedSpace = useMemo(() => {
    return selectedVenue?.spaces?.find(
      (space) => space.id === form.spaceId
    );
  }, [selectedVenue, form.spaceId]);

  const totalGuests = functions.reduce(
    (sum, item) => sum + (item.guestCount ?? 0),
    0
  );

  const confirmedCount = functions.filter(
    (item) => item.status === "CONFIRMED"
  ).length;

  function openModal() {
    setAvailability(null);

    const defaultStart = getDefaultStartTime();
    const defaultEnd = getDefaultEndTime();

    setForm((current) => ({
      ...current,
      name: "",
      startTime: defaultStart,
      endTime: defaultEnd,
      venueId:
        current.venueId ||
        event?.venueId ||
        "",
      spaceId:
        current.spaceId ||
        event?.spaceId ||
        "",
      guestCount:
        current.guestCount ||
        String(event?.guestCount ?? ""),
      status: "CONFIRMED",
      notes: "",
    }));

    setShowModal(true);
  }

  function closeModal() {
    if (saving || checkingAvailability) return;

    setShowModal(false);
    setAvailability(null);
  }

  function getDefaultStartTime() {
    if (event?.startDate) {
      return toDateTimeLocal(event.startDate);
    }

    const date = new Date();
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() + 1);

    return toDateTimeLocal(date.toISOString());
  }

  function getDefaultEndTime() {
    if (event?.endDate) {
      return toDateTimeLocal(event.endDate);
    }

    const date = new Date();
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() + 2);

    return toDateTimeLocal(date.toISOString());
  }

  function toDateTimeLocal(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset();
    const local = new Date(
      date.getTime() - offset * 60 * 1000
    );

    return local.toISOString().slice(0, 16);
  }

  function updateForm(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setAvailability(null);
  }

  function handleVenueChange(venueId: string) {
    setForm((current) => ({
      ...current,
      venueId,
      spaceId: "",
    }));

    setAvailability(null);
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Please enter a function name.";
    }

    if (!form.startTime || !form.endTime) {
      return "Please select both start and end times.";
    }

    if (!form.venueId) {
      return "Please select a venue.";
    }

    if (!form.spaceId) {
      return "Please select a space.";
    }

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return "Please enter valid date and time values.";
    }

    if (end <= start) {
      return "End time must be after start time.";
    }

    const now = new Date();

    if (start < now) {
      return "You cannot create a function in the past.";
    }

    const guests = Number(form.guestCount);

    if (!Number.isFinite(guests) || guests <= 0) {
      return "Please enter a valid guest count.";
    }

    if (
      selectedSpace?.capacity != null &&
      guests > selectedSpace.capacity
    ) {
      return `Guest count exceeds the ${selectedSpace.capacity}-person capacity of this space.`;
    }

    if (selectedSpace?.status !== "AVAILABLE") {
      return "This space is currently unavailable.";
    }

    return null;
  }

  async function checkAvailability() {
    const validationError = validateForm();

    if (validationError) {
      alert(validationError);
      return false;
    }

    try {
      setCheckingAvailability(true);
      setAvailability(null);

      const response = await fetch(
        "/api/calendar/availability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startTime: new Date(
              form.startTime
            ).toISOString(),
            endTime: new Date(
              form.endTime
            ).toISOString(),
            space: selectedSpace?.name,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAvailability({
          checked: true,
          available: false,
          message:
            data?.error ||
            "Unable to check availability.",
        });

        return false;
      }

      const available =
        data.available === true ||
        data.isAvailable === true;

      setAvailability({
        checked: true,
        available,
        message: available
          ? "Space is available for this time."
          : data?.message ||
            "This space is already booked for this time.",
      });

      return available;
    } catch (error) {
      console.error(
        "Availability check failed:",
        error
      );

      setAvailability({
        checked: true,
        available: false,
        message:
          "Could not check availability. Please try again.",
      });

      return false;
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function createFunction() {
    const validationError = validateForm();

    if (validationError) {
      alert(validationError);
      return;
    }

    /*
     * Always check availability immediately before creation.
     * This prevents creating a function when another function
     * has already occupied the space.
     */
    const available = await checkAvailability();

    if (!available) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/events/${eventId}/functions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            startTime: new Date(
              form.startTime
            ).toISOString(),
            endTime: new Date(
              form.endTime
            ).toISOString(),
            space: selectedSpace?.name ?? "",
            guestCount: Number(form.guestCount),
            status: form.status,
            notes: form.notes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            "Failed to create function."
        );
        return;
      }

      setShowModal(false);
      setAvailability(null);

      await loadFunctions();
    } catch (error) {
      console.error(
        "Failed to create function:",
        error
      );

      alert(
        "Something went wrong while creating the function."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTimeRange(
    start: string,
    end: string
  ) {
    return `${formatTime(start)} – ${formatTime(end)}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/events/${eventId}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Event</span>
                  <span>/</span>
                  <span>Functions</span>
                </div>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  {event?.name || "Event Functions"}
                </h1>
              </div>
            </div>

            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Function
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            icon={CalendarDays}
            label="Total Functions"
            value={functions.length}
          />

          <SummaryCard
            icon={CheckCircle2}
            label="Confirmed"
            value={confirmedCount}
          />

          <SummaryCard
            icon={Users}
            label="Planned Guests"
            value={totalGuests.toLocaleString()}
          />
        </div>

        {/* Schedule */}
        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Event Schedule
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Functions define the operational schedule
                  of this event.
                </p>
              </div>

              <button
                onClick={() => {
                  alert(
                    "AI schedule analysis will be connected to the VenueOps AI engine next."
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Sparkles className="h-4 w-4" />
                Analyze Schedule
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading functions...
              </div>
            </div>
          ) : functions.length === 0 ? (
            <EmptyState onAdd={openModal} />
          ) : (
            <div className="divide-y divide-slate-100">
              {functions.map((item) => (
                <FunctionRow
                  key={item.id}
                  item={item}
                  formatTimeRange={formatTimeRange}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add Function Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Add Function
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a scheduled function to the event.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
              <div className="grid gap-5">
                <Field label="Function Name" required>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      updateForm(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="e.g. Opening Ceremony"
                    className="input"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Start Date & Time"
                    required
                  >
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) =>
                        updateForm(
                          "startTime",
                          e.target.value
                        )
                      }
                      className="input"
                    />
                  </Field>

                  <Field
                    label="End Date & Time"
                    required
                  >
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(e) =>
                        updateForm(
                          "endTime",
                          e.target.value
                        )
                      }
                      className="input"
                    />
                  </Field>
                </div>

                {/* Venue */}
                <Field label="Venue" required>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <select
                      value={form.venueId}
                      onChange={(e) =>
                        handleVenueChange(
                          e.target.value
                        )
                      }
                      disabled={venuesLoading}
                      className="input pl-10"
                    >
                      <option value="">
                        {venuesLoading
                          ? "Loading venues..."
                          : "Select venue"}
                      </option>

                      {venues.map((venue) => (
                        <option
                          key={venue.id}
                          value={venue.id}
                        >
                          {venue.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>

                {/* Space */}
                <Field label="Space" required>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <select
                      value={form.spaceId}
                      onChange={(e) =>
                        updateForm(
                          "spaceId",
                          e.target.value
                        )
                      }
                      disabled={
                        !form.venueId ||
                        !selectedVenue
                      }
                      className="input pl-10"
                    >
                      <option value="">
                        {!form.venueId
                          ? "Select a venue first"
                          : "Select space"}
                      </option>

                      {selectedVenue?.spaces?.map(
                        (space) => (
                          <option
                            key={space.id}
                            value={space.id}
                          >
                            {space.name}
                            {space.capacity != null
                              ? ` · Capacity ${space.capacity}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {selectedSpace && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />

                      <span>
                        {selectedVenue?.name}
                      </span>

                      {selectedSpace.capacity !=
                        null && (
                        <>
                          <span>•</span>
                          <span>
                            Capacity{" "}
                            {selectedSpace.capacity.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </Field>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Expected Guests"
                    required
                  >
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="number"
                        min="1"
                        value={form.guestCount}
                        onChange={(e) =>
                          updateForm(
                            "guestCount",
                            e.target.value
                          )
                        }
                        placeholder="1200"
                        className="input pl-10"
                      />
                    </div>
                  </Field>

                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(e) =>
                        updateForm(
                          "status",
                          e.target.value
                        )
                      }
                      className="input"
                    >
                      <option value="CONFIRMED">
                        Confirmed
                      </option>
                      <option value="PLANNING">
                        Planning
                      </option>
                      <option value="HOLD">
                        Hold
                      </option>
                      <option value="CANCELLED">
                        Cancelled
                      </option>
                    </select>
                  </Field>
                </div>

                <Field label="Notes">
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      updateForm(
                        "notes",
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Add operational notes, setup instructions, VIP information, etc."
                    className="input resize-none"
                  />
                </Field>

                {/* Availability */}
                {availability && (
                  <div
                    className={`rounded-xl border p-4 ${
                      availability.available
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {availability.available ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                      )}

                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            availability.available
                              ? "text-emerald-800"
                              : "text-red-800"
                          }`}
                        >
                          {availability.available
                            ? "Space Available"
                            : "Space Unavailable"}
                        </p>

                        <p
                          className={`mt-1 text-sm ${
                            availability.available
                              ? "text-emerald-700"
                              : "text-red-700"
                          }`}
                        >
                          {availability.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                onClick={checkAvailability}
                disabled={
                  checkingAvailability ||
                  saving
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkingAvailability ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Check Availability
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  disabled={
                    saving ||
                    checkingAvailability
                  }
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={createFunction}
                  disabled={
                    saving ||
                    checkingAvailability
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Function
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
          transition: all 150ms ease;
        }

        .input:focus {
          border-color: rgb(100 116 139);
          box-shadow: 0 0 0 3px rgb(148 163 184 / 0.15);
        }

        .input:disabled {
          cursor: not-allowed;
          background: rgb(248 250 252);
          color: rgb(148 163 184);
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </div>
    </div>
  );
}

function FunctionRow({
  item,
  formatTimeRange,
  formatDate,
}: {
  item: EventFunction;
  formatTimeRange: (
    start: string,
    end: string
  ) => string;
  formatDate: (value: string) => string;
}) {
  return (
    <div className="px-6 py-5 transition hover:bg-slate-50">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <CalendarDays className="h-5 w-5 text-slate-600" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-slate-900">
                  {item.name}
                </h3>

                <StatusBadge status={item.status} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(item.startTime)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatTimeRange(
                    item.startTime,
                    item.endTime
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.space || "No space"}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {(
                    item.guestCount ?? 0
                  ).toLocaleString()}{" "}
                  guests
                </span>
              </div>

              {item.notes && (
                <p className="mt-3 max-w-3xl text-sm text-slate-500">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/events/${item.eventId}/functions/${item.id}`}
          className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 md:inline-flex"
        >
          View
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toUpperCase();

  const styles =
    normalized === "CONFIRMED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : normalized === "CANCELLED"
      ? "bg-red-50 text-red-700 border-red-200"
      : normalized === "HOLD"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        <CalendarDays className="h-6 w-6 text-slate-500" />
      </div>

      <h3 className="mt-4 text-base font-semibold">
        No functions yet
      </h3>

      <p className="mt-2 max-w-md text-sm text-slate-500">
        Build the event schedule by adding the
        functions that make up the event.
      </p>

      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        Add First Function
      </button>
    </div>
  );
}