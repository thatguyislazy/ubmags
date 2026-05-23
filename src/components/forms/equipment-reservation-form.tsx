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
  quantity: number;
  availableQuantity: number;
  category: string;
};

export function EquipmentReservationForm({
  departments,
  defaultDepartmentId,
}: {
  departments: { id: string; name: string }[];
  defaultDepartmentId?: string | null;
}) {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Resource[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/resources?category=EQUIPMENT")
      .then((r) => r.json())
      .then((data) => {
        console.log("Loaded equipment:", data);
        setEquipment(data);
      })
      .catch((err) => console.error("Error loading equipment:", err));
  }, []);

  function handleQuantityChange(itemId: string, value: number) {
    const item = equipment.find(e => e.id === itemId);
    if (item) {
      const maxAvailable = item.availableQuantity || 0;
      if (value > maxAvailable) {
        setError(`Only ${maxAvailable} unit(s) of ${item.name} available.`);
        return;
      }
      setError("");
    }
    setSelectedQuantities(prev => ({ ...prev, [itemId]: value }));
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

    const equipmentIds = equipment
      .filter((eq) => {
        const isChecked = form.get(`eq-${eq.id}`) === "on";
        const quantity = selectedQuantities[eq.id] || 1;
        return isChecked && quantity > 0;
      })
      .map((eq) => ({
        resourceId: eq.id,
        quantity: selectedQuantities[eq.id] || 1,
      }));

    if (equipmentIds.length === 0) {
      setLoading(false);
      setError("Please select at least one equipment.");
      return;
    }

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
        venueIds: [],
        venueSpecify: {},
        equipmentIds,
        serviceIds: [],
        itemsPersonnelNote: form.get("itemsPersonnelNote"),
        conformeName: form.get("conformeName"),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      console.warn("[MAGS] equipment reservation submit failed", { status: res.status, data });
      setError(data?.message || data?.error || "Submission failed");
      return;
    }

    router.push(`/reservations/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <section className="space-y-4">
        <h3 className="font-semibold text-ub-maroon">Equipment Reservation</h3>
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
            <Label htmlFor="eventTitle">Event / Purpose</Label>
            <Input id="eventTitle" name="eventTitle" required placeholder="Event or purpose of equipment use" />
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

      {/* Equipment Selection */}
      <section className="space-y-3">
        <Label>Select Equipment Needed</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {equipment.length === 0 ? (
            <div className="text-gray-500 p-4 text-center col-span-2">
              No equipment available. Please contact administrator.
            </div>
          ) : (
            equipment.map((eq) => {
              const maxAvailable = eq.availableQuantity || 0;
              const isOutOfStock = maxAvailable === 0;
              
              return (
                <label
                  key={eq.id}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                    isOutOfStock ? 'opacity-50 bg-gray-50' : ''
                  }`}
                >
                  <input 
                    type="checkbox" 
                    name={`eq-${eq.id}`} 
                    disabled={isOutOfStock}
                  />
                  <span className="flex-1">
                    {eq.name}
                    {maxAvailable > 0 && (
                      <span className="ml-2 text-xs text-green-600">
                        ({maxAvailable} available)
                      </span>
                    )}
                    {maxAvailable === 0 && (
                      <span className="ml-2 text-xs text-red-600">
                        (Out of stock)
                      </span>
                    )}
                  </span>
                  <Input
                    name={`eq-qty-${eq.id}`}
                    type="number"
                    min={1}
                    max={maxAvailable}
                    defaultValue={1}
                    className="w-20"
                    disabled={isOutOfStock}
                    onChange={(e) => handleQuantityChange(eq.id, parseInt(e.target.value) || 0)}
                  />
                </label>
              );
            })
          )}
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

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Equipment Reservation"}
      </Button>
    </form>
  );
}