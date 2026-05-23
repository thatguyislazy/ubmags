"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CAMPUSES } from "@/lib/constants";

type Resource = {
  id: string;
  name: string;
  requiresSpecify: boolean;
  category: string;
};

export function VenueReservationForm({
  departments,
  defaultDepartmentId,
}: {
  departments: { id: string; name: string }[];
  defaultDepartmentId?: string | null;
}) {
  const router = useRouter();
  const [venues, setVenues] = useState<Resource[]>([]);
  const [services, setServices] = useState<Resource[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [venueSpecify, setVenueSpecify] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toErrorMessage(err: unknown): string {
    if (!err) return "Submission failed";
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message;
    const maybe = err as {
      formErrors?: unknown;
      fieldErrors?: Record<string, unknown>;
      error?: unknown;
      message?: unknown;
    };
    if (typeof maybe.message === "string") return maybe.message;
    const formErrors = Array.isArray(maybe.formErrors)
      ? maybe.formErrors.filter((x): x is string => typeof x === "string")
      : [];
    if (formErrors.length) return formErrors.join("\n");
    const fieldErrors =
      maybe.fieldErrors && typeof maybe.fieldErrors === "object"
        ? maybe.fieldErrors
        : undefined;
    if (fieldErrors) {
      const first = Object.values(fieldErrors)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .find((v) => typeof v === "string") as string | undefined;
      if (first) return first;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return "Submission failed";
    }
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/resources?category=VENUE").then((r) => r.json()),
      fetch("/api/resources?category=SERVICE").then((r) => r.json()),
    ]).then(([v, s]) => {
      setVenues(v);
      setServices(s);
    });
  }, []);

  function toggleVenue(id: string) {
    setSelectedVenues((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const campus = String(form.get("campus") || "");
    const startDateTime = String(form.get("startDateTime") || "");
    const endDateTime = String(form.get("endDateTime") || "");

    if (!campus) { setLoading(false); setError("Campus is required."); return; }
    if (!startDateTime || !endDateTime) { setLoading(false); setError("Start and end date/time are required."); return; }
    if (!(new Date(endDateTime) > new Date(startDateTime))) {
      setLoading(false); setError("End time must be after start time."); return;
    }

    const serviceIds = services
      .filter((s) => form.get(`svc-${s.id}`) === "on")
      .map((s) => ({ resourceId: s.id, notes: String(form.get(`svc-note-${s.id}`) || "") }));

    const requestBody = {
      departmentId: form.get("departmentId"),
      campus,
      eventTitle: form.get("eventTitle"),
      eventDescription: (() => {
        const raw = form.get("eventDescription");
        if (raw == null) return undefined;
        const v = String(raw).trim();
        return v.length ? v : undefined;
      })(),
      startDateTime,
      endDateTime,
      venueIds: selectedVenues,
      venueSpecify,
      equipmentIds: [],
      serviceIds,
      itemsPersonnelNote: form.get("itemsPersonnelNote"),
      customVenueSpecify: form.get("customVenueSpecify"),
      conformeName: form.get("conformeName"),
    };

    console.log("Submitting request:", requestBody);

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response data:", data);

    setLoading(false);

    if (!res.ok) {
      console.warn("[MAGS] venue reservation submit failed", { status: res.status, data });
      setError(
        data?.conflicts
          ? "Venue conflict detected. Please select another time or venue."
          : toErrorMessage(data?.message ?? data?.error ?? data)
      );
      return;
    }

    // Check if data.id exists
    if (!data.id) {
      console.error("No reservation ID in response!", data);
      setError("Reservation created but no ID returned. Please check your reservations list.");
      return;
    }

    console.log("Redirecting to:", `/reservations/${data.id}`);
    router.push(`/reservations/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Basic Info ── */}
      <section className="space-y-4">
        <h3 className="font-semibold text-ub-maroon">F-MAGS LC-10 — Venue Reservation</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Date of Filing</Label>
            <Input value={new Date().toISOString().slice(0, 10)} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departmentId">Office / Department</Label>
            <Select id="departmentId" name="departmentId" defaultValue={defaultDepartmentId || ""} required>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campus">Campus</Label>
            <Select id="campus" name="campus" required>
              <option value="">Select campus</option>
              {CAMPUSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="eventTitle">Event</Label>
            <Input id="eventTitle" name="eventTitle" required placeholder="Event title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDateTime">Start Date & Time</Label>
            <Input id="startDateTime" name="startDateTime" type="datetime-local" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDateTime">End Date & Time</Label>
            <Input id="endDateTime" name="endDateTime" type="datetime-local" required />
          </div>
        </div>
      </section>

      {/* ── Venue Selection ── */}
      <section className="space-y-3">
        <Label>Select Venue(s) — per F-MAGS LC-10</Label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <label
              key={v.id}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors ${
                selectedVenues.includes(v.id)
                  ? "border-ub-maroon bg-ub-maroon/5"
                  : "border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedVenues.includes(v.id)}
                onChange={() => toggleVenue(v.id)}
                className="mt-1"
              />
              <span className="text-sm">
                {v.name}
                {v.requiresSpecify && selectedVenues.includes(v.id) && (
                  <Input
                    className="mt-2"
                    placeholder="Specify room (e.g. Building A - Room 203)"
                    value={venueSpecify[v.id] || ""}
                    onChange={(e) =>
                      setVenueSpecify((s) => ({ ...s, [v.id]: e.target.value }))
                    }
                  />
                )}
              </span>
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="customVenueSpecify">Others — Specify</Label>
          <Input
            id="customVenueSpecify"
            name="customVenueSpecify"
            placeholder="Custom venue specification"
          />
        </div>
      </section>

      {/* ── Services / Manpower ── */}
      <section className="space-y-3">
        <Label>Services / Manpower</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label key={s.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <input type="checkbox" name={`svc-${s.id}`} />
                {s.name}
              </div>
              <Input name={`svc-note-${s.id}`} placeholder="Notes" className="mt-2" />
            </label>
          ))}
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="itemsPersonnelNote">
          Note: List of items / personnel needed (attach details)
        </Label>
        <Textarea id="itemsPersonnelNote" name="itemsPersonnelNote" rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="conformeName">Conforme — Chief of Office / Representative</Label>
        <Input
          id="conformeName"
          name="conformeName"
          placeholder="Name for conforme signature block"
        />
      </div>

      <Button type="submit" disabled={loading || selectedVenues.length === 0}>
        {loading ? "Submitting..." : "Submit Venue Reservation"}
      </Button>
    </form>
  );
}