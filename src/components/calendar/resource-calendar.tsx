"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";

type VenueOption = { id: string; name: string };

const POLL_MS = 60_000;

export function ResourceCalendar() {
  const calendarRef = useRef<InstanceType<typeof FullCalendar> | null>(null);
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [venueFilter, setVenueFilter] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/resources?category=VENUE")
      .then((r) => r.json())
      .then((data: VenueOption[]) => setVenues(data));
  }, []);

  const fetchEvents = useCallback(
    async (
      info: { startStr: string; endStr: string },
      successCallback: (e: EventInput[]) => void,
      failureCallback: (e: Error) => void
    ) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          start: info.startStr,
          end: info.endStr,
        });
        if (venueFilter) params.set("resourceId", venueFilter);
        const res = await fetch(`/api/calendar?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load calendar");
        const data = await res.json();
        const events: EventInput[] = data.map(
          (e: {
            id: string;
            title: string;
            start: string;
            end: string;
            backgroundColor?: string;
          }) => ({
            id: e.id,
            title: e.title,
            start: new Date(e.start).toISOString(),
            end: new Date(e.end).toISOString(),
            backgroundColor: e.backgroundColor,
          })
        );
        setLastSync(new Date());
        successCallback(events);
      } catch (err) {
        failureCallback(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [venueFilter]
  );

  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      calendarRef.current?.getApi().refetchEvents();
    };

    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, [venueFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <label htmlFor="venue-filter" className="text-sm font-medium text-gray-700">
            Filter by room / venue
          </label>
          <select
            id="venue-filter"
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="min-w-[220px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All venues (real-time availability)</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-right text-xs text-gray-500">
          {loading && <span className="text-ub-maroon">Updating… </span>}
          <span>
            Auto-refresh every {POLL_MS / 1000}s · Last sync:{" "}
            {lastSync ? lastSync.toLocaleTimeString() : "—"}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        Green = approved booking · Orange = pending MAGS · Amber = pending department. Overlapping
        times for the same venue are blocked when submitting new requests.
      </p>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={fetchEvents}
        nowIndicator
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        height="auto"
        eventClick={(info) => {
          const id = info.event.id;
          if (id) window.location.href = `/reservations/${id}`;
        }}
      />
    </div>
  );
}
