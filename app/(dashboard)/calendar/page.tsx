"use client";

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Event = {
  id: string;
  eventCode: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  venue?: string | null;
  guestCount?: number | null;
};

type AvailabilityResult = {
  available: boolean;
  conflicts: {
    functionId: string;
    functionName: string;
    eventId: string;
    eventName: string;
    startTime: string;
    endTime: string;
    space: string | null;
  }[];
};

type Space = {
  id: string;
  name: string;
  capacity: number | null;
  status: string;
};

type Venue = {
  id: string;
  name: string;
  spaces: Space[];
};

export default function CalendarPage() {
  // --------------------------------
  // Calendar state
  // --------------------------------

const [currentDate, setCurrentDate] = useState(() => {
  const today = new Date();

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );
});

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null);

  const [showBooking, setShowBooking] =
    useState(false);

  // --------------------------------
  // Event data
  // --------------------------------

  const [events, setEvents] =
    useState<Event[]>([]);

  const [loading, setLoading] =
    useState(true);

  // --------------------------------
  // Venue data
  // --------------------------------

  const [venues, setVenues] =
    useState<Venue[]>([]);

  const [selectedVenueId, setSelectedVenueId] =
    useState("");

  const [selectedSpaceId, setSelectedSpaceId] =
    useState("");

  const [selectedCapacity, setSelectedCapacity] =
    useState<number | null>(null);

  // --------------------------------
  // Booking form
  // --------------------------------

  const [eventName, setEventName] =
    useState("");

  const [guestCount, setGuestCount] =
    useState("");

  const [startTime, setStartTime] =
    useState("09:00");

  const [endTime, setEndTime] =
    useState("10:00");

  const [space, setSpace] =
    useState("");

  

  // --------------------------------
  // Availability
  // --------------------------------

  const [availability, setAvailability] =
    useState<AvailabilityResult | null>(null);

  const [checkingAvailability, setCheckingAvailability] =
    useState(false);

  // --------------------------------
  // Booking creation
  // --------------------------------

  const [creatingBooking, setCreatingBooking] =
    useState(false);

  const [bookingCreated, setBookingCreated] =
    useState(false);

  // --------------------------------
  // Calendar calculations
  // --------------------------------

  const monthName =
    currentDate.toLocaleString("en-US", {
      month: "long",
    });

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  const firstDay =
    new Date(year, month, 1).getDay();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  // --------------------------------
  // Load venues
  // --------------------------------

  useEffect(() => {
    async function loadVenues() {
      try {
        const response =
          await fetch("/api/venues", {
            cache: "no-store",
          });

        if (!response.ok) {
          throw new Error(
            "Failed to load venues"
          );
        }

        const data =
          await response.json();

        setVenues(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load venues:",
          error
        );
      }
    }

    loadVenues();
  }, []);

  // --------------------------------
  // Load events
  // --------------------------------

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);

        const response =
          await fetch("/api/events", {
            cache: "no-store",
          });

        if (!response.ok) {
          throw new Error(
            "Failed to load events"
          );
        }

        const data =
          await response.json();

        setEvents(
          Array.isArray(data)
            ? data
            : data.events ?? []
        );
      } catch (error) {
        console.error(
          "Failed to load calendar events:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  // --------------------------------
  // Calendar days
  // --------------------------------

  const calendarDays = useMemo(() => {
    const totalCells =
      Math.ceil(
        (firstDay + daysInMonth) / 7
      ) * 7;

    return Array.from(
      { length: totalCells },
      (_, index) => {
        const dayNumber =
          index - firstDay + 1;

        return dayNumber >= 1 &&
          dayNumber <= daysInMonth
          ? dayNumber
          : null;
      }
    );
  }, [firstDay, daysInMonth]);

  // --------------------------------
  // Reset booking form
  // --------------------------------

  function resetBookingForm() {
    setEventName("");
    setGuestCount("");
    setStartTime("09:00");
    setEndTime("10:00");

    setSelectedVenueId("");
    setSelectedSpaceId("");
    setSelectedCapacity(null);

    setSpace("");

    setAvailability(null);
    setBookingCreated(false);
  }

  // --------------------------------
  // Open booking panel
  // --------------------------------

function openBooking(date?: string) {
  resetBookingForm();

  const today = new Date();

  const todayFormatted =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const bookingDate = date ?? selectedDate ?? todayFormatted;

  if (isPastDate(bookingDate)) {
    alert("You cannot create a booking for a previous date.");
    return;
  }

  setSelectedDate(bookingDate);
  setShowBooking(true);
}

function isPastDate(dateString: string) {
  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const selected = new Date(`${dateString}T00:00:00`);

  return selected < todayStart;
}
  // --------------------------------
  // Select calendar date
  // --------------------------------

function selectDate(day: number) {
  const selected = new Date(year, month, day);

  const formatted =
    `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;

  if (isPastDate(formatted)) {
    alert("You cannot create a booking for a previous date.");
    return;
  }

  setSelectedDate(formatted);
  setAvailability(null);
  setBookingCreated(false);
  setShowBooking(true);
}

  // --------------------------------
  // Check availability
  // --------------------------------

  const checkAvailability = async () => {
    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }

    if (!eventName.trim()) {
      alert("Please enter an event name.");
      return;
    }

    if (!guestCount || Number(guestCount) <= 0) {
      alert(
        "Please enter a valid guest count."
      );
      return;
    }

    if (!selectedVenueId) {
      alert("Please select a venue.");
      return;
    }

    if (!selectedSpaceId || !space.trim()) {
      alert("Please select a space.");
      return;
    }

    if (!startTime || !endTime) {
      alert(
        "Please select start and end time."
      );
      return;
    }

    if (endTime <= startTime) {
      alert(
        "End time must be after start time."
      );
      return;
    }

    // --------------------------------
    // Capacity validation
    // --------------------------------

    if (
      selectedCapacity !== null &&
      Number(guestCount) >
        selectedCapacity
    ) {
      alert(
        `Guest count exceeds the capacity of ${space}. Maximum capacity is ${selectedCapacity} guests.`
      );
      return;
    }

    setCheckingAvailability(true);
    setAvailability(null);

    try {
      const start =
        new Date(
          `${selectedDate}T${startTime}:00`
        ).toISOString();

      const end =
        new Date(
          `${selectedDate}T${endTime}:00`
        ).toISOString();

      const response =
        await fetch(
          "/api/calendar/availability",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              startTime: start,
              endTime: end,
              space: space.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Failed to check availability."
        );
        return;
      }

      setAvailability(data);
    } catch (error) {
      console.error(
        "Availability check failed:",
        error
      );

      alert(
        "Something went wrong while checking availability."
      );
    } finally {
      setCheckingAvailability(false);
    }
  };

  

  // --------------------------------
  // Create booking
  // --------------------------------

  const createBooking = async () => {
    if (!eventName.trim()) {
      alert("Please enter an event name.");
      return;
    }

    if (
      !guestCount ||
      Number(guestCount) <= 0
    ) {
      alert(
        "Please enter a valid guest count."
      );
      return;
    }

    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }

    if (!selectedVenueId) {
      alert("Please select a venue.");
      return;
    }

    if (!selectedSpaceId || !space.trim()) {
      alert("Please select a space.");
      return;
    }

    if (endTime <= startTime) {
      alert(
        "End time must be after start time."
      );
      return;
    }

    // --------------------------------
    // Capacity validation
    // --------------------------------

    if (
      selectedCapacity !== null &&
      Number(guestCount) >
        selectedCapacity
    ) {
      alert(
        `Guest count exceeds the capacity of ${space}. Maximum capacity is ${selectedCapacity} guests.`
      );
      return;
    }

    // --------------------------------
    // Availability must be checked
    // --------------------------------

    if (!availability) {
      alert(
        "Please check space availability first."
      );
      return;
    }

    if (!availability.available) {
      alert(
        "This space is not available. Please choose another time or space."
      );
      return;
    }

    setCreatingBooking(true);

    try {
      const start =
        new Date(
          `${selectedDate}T${startTime}:00`
        ).toISOString();

      const end =
        new Date(
          `${selectedDate}T${endTime}:00`
        ).toISOString();

      const response =
        await fetch(
          "/api/calendar/book",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              eventName:
                eventName.trim(),

              guestCount:
                Number(guestCount),

              startTime: start,
              endTime: end,

              space:
                space.trim(),

              venueId:
                selectedVenueId,

              spaceId:
                selectedSpaceId,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Failed to create booking."
        );
        return;
      }

      // Add event immediately
      // to the calendar

      setEvents(
        (currentEvents) => [
          ...currentEvents,
          data.event,
        ]
      );

      setBookingCreated(true);

      setAvailability(null);

    } catch (error) {
      console.error(
        "Create booking failed:",
        error
      );

      alert(
        "Something went wrong while creating the booking."
      );
    } finally {
      setCreatingBooking(false);
    }
  };

  // --------------------------------
  // Navigation
  // --------------------------------

  function previousMonth() {
    setCurrentDate(
      new Date(
        year,
        month - 1,
        1
      )
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(
        year,
        month + 1,
        1
      )
    );
  }

function goToToday() {
  const today = new Date();

  setCurrentDate(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  const todayFormatted =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  setSelectedDate(todayFormatted);
}

  // --------------------------------
  // Events for a day
  // --------------------------------

  function getEventsForDay(
    day: number
  ) {
    return events.filter(
      (event) => {
        const eventDate =
          new Date(
            event.startDate
          );

        return (
          eventDate.getFullYear() ===
            year &&
          eventDate.getMonth() ===
            month &&
          eventDate.getDate() ===
            day
        );
      }
    );
  }

  // --------------------------------
  // Render
  // --------------------------------

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <main>

        {/* ================================
            HEADER
        ================================= */}

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Calendar
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View and manage your venue
              schedule.
            </p>
          </div>

 <button
  type="button"
  onClick={() => {
    const today = new Date();

    const todayFormatted =
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    resetBookingForm();
    setSelectedDate(todayFormatted);
    setShowBooking(true);
  }}
  className="relative z-10 flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
>
  <Plus size={15} />
  New Event
</button>
        </div>

        {/* ================================
            CALENDAR CONTROLS
        ================================= */}

        <div className="mt-7 flex items-center justify-between">
          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={
                previousMonth
              }
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <div className="min-w-[150px] text-center text-sm font-semibold text-slate-800">
              {monthName}{" "}
              {year}
            </div>

            <button
              type="button"
              onClick={
                nextMonth
              }
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
            >
              <ChevronRight
                size={17}
              />
            </button>

          </div>

          <button
            type="button"
            onClick={
              goToToday
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
        </div>

        {/* ================================
            VIEW SELECTOR
        ================================= */}

        <div className="mt-5 flex w-fit rounded-xl border border-slate-200 bg-white p-1">
          <CalendarView
            active
            label="Month"
          />

          <CalendarView label="Week" />
          <CalendarView label="Day" />
          <CalendarView label="Functions" />
          <CalendarView label="Availability" />
        </div>

        {/* ================================
            CALENDAR
        ================================= */}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Week days */}

          <div className="grid grid-cols-7 border-b border-slate-200">
            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map(
              (day) => (
                <div
                  key={day}
                  className="border-r border-slate-100 px-3 py-3 text-center text-xs font-semibold text-slate-400 last:border-r-0"
                >
                  {day}
                </div>
              )
            )}
          </div>

          {/* Calendar grid */}

          <div className="grid grid-cols-7">
            {calendarDays.map(
              (day, index) => {

                const dayEvents =
                  day
                    ? getEventsForDay(
                        day
                      )
                    : [];

                const today =
                  new Date();

                const isToday =
                  day &&
                  today.getFullYear() ===
                    year &&
                  today.getMonth() ===
                    month &&
                  today.getDate() ===
                    day;

                const formattedDay =
                  day
                    ? `${year}-${String(
                        month + 1
                      ).padStart(
                        2,
                        "0"
                      )}-${String(
                        day
                      ).padStart(
                        2,
                        "0"
                      )}`
                    : null;

                const isSelected =
                  formattedDay ===
                  selectedDate;

                return (
                  <div
                    key={index}
                    className="relative min-h-[135px] border-b border-r border-slate-100 p-2"
                  >

                    {day && (
                      <>

                        {/* Date */}

                        <button
                          type="button"
                          onClick={() =>
                            selectDate(
                              day
                            )
                          }
                          className={`text-xs font-medium ${
                            isToday
                              ? "flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white"
                              : isSelected
                              ? "flex h-7 w-7 items-center justify-center rounded-full border border-slate-950 text-slate-950"
                              : "text-slate-400 hover:text-slate-950"
                          }`}
                        >
                          {day}
                        </button>

                        {/* Events */}

                        <div className="mt-1 space-y-1">
                          {dayEvents.map(
                            (event) => (
                              <button
                                type="button"
                                key={
                                  event.id
                                }
                                className="w-full rounded-lg bg-slate-50 p-2 text-left hover:bg-slate-100"
                              >
                                <div className="flex items-start gap-2">

                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-500" />

                                  <div className="min-w-0">

                                    <div className="truncate text-[11px] font-semibold text-slate-800">
                                      {
                                        event.name
                                      }
                                    </div>

                                    <div className="mt-0.5 text-[10px] text-slate-400">
                                      {new Date(
                                        event.startDate
                                      ).toLocaleTimeString(
                                        "en-US",
                                        {
                                          hour: "numeric",
                                          minute:
                                            "2-digit",
                                        }
                                      )}
                                    </div>

                                    {event.venue && (
                                      <div className="mt-0.5 truncate text-[10px] text-slate-400">
                                        {
                                          event.venue
                                        }
                                      </div>
                                    )}

                                  </div>
                                </div>
                              </button>
                            )
                          )}
                        </div>

                      </>
                    )}

                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* ================================
            BOOKING PANEL
        ================================= */}

       {showBooking && selectedDate && (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/30 px-4 py-8 backdrop-blur-sm">
    <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">

              {/* Booking header */}

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    New Booking
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Create an event for{" "}
                    {selectedDate}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowBooking(
                      false
                    );
                    setAvailability(
                      null
                    );
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={16} />
                </button>

              </div>

              {/* ================================
                  FORM
              ================================= */}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                {/* Event name */}

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Event Name
                  </label>

                  <input
                    type="text"
                    value={
                      eventName
                    }
                    onChange={(e) => {
                      setEventName(
                        e.target
                          .value
                      );
                      setBookingCreated(
                        false
                      );
                    }}
                    placeholder="Enter event name"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* Guest count */}

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Guest Count
                  </label>

                  <input
                    type="number"
                    value={
                      guestCount
                    }
                    onChange={(e) => {
                      setGuestCount(
                        e.target
                          .value
                      );
                      setAvailability(
                        null
                      );
                    }}
                    placeholder="e.g. 500"
                    min="1"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />

                  {/* Capacity warning */}

                  {selectedCapacity !==
                    null &&
                    guestCount &&
                    Number(
                      guestCount
                    ) >
                      selectedCapacity && (
                      <p className="mt-1.5 text-[11px] font-medium text-red-600">
                        Guest count exceeds
                        space capacity.
                      </p>
                    )}
                </div>

                {/* Venue */}

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Venue
                  </label>

                  <select
                    value={
                      selectedVenueId
                    }
                    onChange={(e) => {
                      const venueId =
                        e.target
                          .value;

                      setSelectedVenueId(
                        venueId
                      );

                      setSelectedSpaceId(
                        ""
                      );

                      setSelectedCapacity(
                        null
                      );

                      setSpace(
                        ""
                      );

                      setAvailability(
                        null
                      );
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">
                      Select a venue
                    </option>

                    {venues.map(
                      (venue) => (
                        <option
                          key={
                            venue.id
                          }
                          value={
                            venue.id
                          }
                        >
                          {
                            venue.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Space */}

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Space
                  </label>

                  <select
                    value={
                      selectedSpaceId
                    }
                    disabled={
                      !selectedVenueId
                    }
                    onChange={(e) => {
                      const spaceId =
                        e.target
                          .value;

                      setSelectedSpaceId(
                        spaceId
                      );

                      setAvailability(
                        null
                      );

                      const venue =
                        venues.find(
                          (
                            item
                          ) =>
                            item.id ===
                            selectedVenueId
                        );

                      const selectedSpace =
                        venue?.spaces.find(
                          (
                            item
                          ) =>
                            item.id ===
                            spaceId
                        );

                      setSpace(
                        selectedSpace?.name ??
                          ""
                      );

                      setSelectedCapacity(
                        selectedSpace?.capacity ??
                          null
                      );
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {selectedVenueId
                        ? "Select a space"
                        : "Select a venue first"}
                    </option>

                    {venues
                      .find(
                        (venue) =>
                          venue.id ===
                          selectedVenueId
                      )
                      ?.spaces.map(
                        (item) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.id
                            }
                          >
                            {item.name}
                            {item.capacity
                              ? ` — Capacity ${item.capacity}`
                              : ""}
                          </option>
                        )
                      )}
                  </select>

                  {/* Capacity */}

                  {selectedCapacity !==
                    null && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-[11px] text-slate-500">
                        Space capacity
                      </span>

                      <span className="text-[11px] font-semibold text-slate-700">
                        {selectedCapacity.toLocaleString()}{" "}
                        guests
                      </span>
                    </div>
                  )}
                </div>

                {/* Start time */}

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={
                      startTime
                    }
                    onChange={(e) => {
                      setStartTime(
                        e.target
                          .value
                      );
                      setAvailability(
                        null
                      );
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* End time */}

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    End Time
                  </label>

                  <input
                    type="time"
                    value={
                      endTime
                    }
                    onChange={(e) => {
                      setEndTime(
                        e.target
                          .value
                      );
                      setAvailability(
                        null
                      );
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

              </div>

              {/* ================================
                  ACTION BUTTONS
              ================================= */}

              <div className="mt-5 flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() => {
                    setShowBooking(
                      false
                    );
                    setAvailability(
                      null
                    );
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                {!availability?.available ? (
                  <button
                    type="button"
                    onClick={
                      checkAvailability
                    }
                    disabled={
                      checkingAvailability
                    }
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkingAvailability
                      ? "Checking..."
                      : "Check Availability"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      createBooking
                    }
                    disabled={
                      creatingBooking
                    }
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingBooking
                      ? "Creating..."
                      : "Create Booking"}
                  </button>
                )}

              </div>

              {/* ================================
                  SUCCESS MESSAGE
              ================================= */}

              {bookingCreated && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <div className="flex items-center gap-2">

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      ✓
                    </div>

                    <div>
                      <p className="text-sm font-bold text-emerald-700">
                        Booking Created
                      </p>

                      <p className="mt-1 text-xs text-emerald-600">
                        The event has been successfully
                        added to the calendar.
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* ================================
                  AVAILABILITY RESULT
              ================================= */}

              {availability && (
                <div
                  className={`mt-4 rounded-xl border p-4 ${
                    availability.available
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >

                  {availability.available ? (
                    <>
                      {/* Available */}

                      <div className="flex items-center gap-2">

                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700">
                          ✓
                        </div>

                        <div>
                          <p className="text-sm font-bold text-green-700">
                            Space Available
                          </p>

                          <p className="text-xs text-green-600">
                            The selected space is
                            available for this time.
                          </p>
                        </div>

                      </div>

                      <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">

                        <div className="grid gap-3 sm:grid-cols-3">

                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">
                              Venue
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-800">
                              {
                                venues.find(
                                  (venue) =>
                                    venue.id ===
                                    selectedVenueId
                                )?.name
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">
                              Space
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-800">
                              {space}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">
                              Time
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-800">
                              {startTime}{" "}
                              –{" "}
                              {endTime}
                            </p>
                          </div>

                        </div>

                      </div>
                    </>
                  ) : (
                    <>
                      {/* Unavailable */}

                      <div className="flex items-center gap-2">

                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700">
                          ✕
                        </div>

                        <div>
                          <p className="text-sm font-bold text-red-700">
                            Space Unavailable
                          </p>

                          <p className="text-xs text-red-600">
                            Another function is already
                            using this space during the
                            selected time.
                          </p>
                        </div>

                      </div>

                      {/* Conflicts */}

                      <div className="mt-3 space-y-2">

                        {availability.conflicts.map(
                          (conflict) => (
                            <div
                              key={
                                conflict.functionId
                              }
                              className="rounded-lg border border-red-200 bg-white p-3"
                            >

                              <p className="text-xs font-bold text-slate-800">
                                {
                                  conflict.eventName
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  conflict.functionName
                                }
                              </p>

                              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">

                                <span>
                                  Space:{" "}
                                  {
                                    conflict.space
                                  }
                                </span>

                                <span>
                                  Time:{" "}
                                  {new Date(
                                    conflict.startTime
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  )}
                                  {" – "}
                                  {new Date(
                                    conflict.endTime
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  )}
                                </span>

                              </div>

                            </div>
                          )
                        )}

                      </div>
                    </>
                  )}

                </div>
              )}

              {/* ================================
                  BOOKING SUMMARY
              ================================= */}

              {(eventName ||
                guestCount ||
                space) && (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Booking Summary
                  </p>

                  <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-4">

                    <div>
                      <span className="text-slate-400">
                        Event
                      </span>

                      <p className="font-semibold text-slate-700">
                        {eventName ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">
                        Guests
                      </span>

                      <p className="font-semibold text-slate-700">
                        {guestCount ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">
                        Space
                      </span>

                      <p className="font-semibold text-slate-700">
                        {space ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">
                        Date
                      </span>

                      <p className="font-semibold text-slate-700">
                        {selectedDate}
                      </p>
                    </div>

                  </div>
                </div>
              )}

        </div>
    </div>
  )}

  {loading && (
          <p className="mt-4 text-xs text-slate-400">
            Loading events...
          </p>
        )}

      </main>
    </div>
  );
}

// --------------------------------
// Calendar View Button
// --------------------------------

function CalendarView({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-slate-950 text-white"
          : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}