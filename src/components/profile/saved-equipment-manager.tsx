"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SavedItem = {
  id: string;
  label: string;
  equipmentType: string;
  equipmentDescription: string | null;
  brand: string | null;
  serialNumber: string | null;
  model: string | null;
};

export function SavedEquipmentManager({ initialItems }: { initialItems: SavedItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    label: "",
    equipmentType: "",
    equipmentDescription: "",
    brand: "",
    serialNumber: "",
    model: "",
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profile/saved-equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) return;
    const row = await res.json();
    setItems((prev) => [...prev, row].sort((a, b) => a.label.localeCompare(b.label)));
    setForm({
      label: "",
      equipmentType: "",
      equipmentDescription: "",
      brand: "",
      serialNumber: "",
      model: "",
    });
    setCreating(false);
  }

  async function remove(id: string) {
    if (!confirm("Remove this saved equipment profile?")) return;
    await fetch(`/api/profile/saved-equipment/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-6">
      {!creating ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          + Add saved equipment profile
        </Button>
      ) : (
        <form onSubmit={add} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Friendly label</Label>
              <Input
                required
                placeholder="My laptop — personal"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Type / kind of equipment</Label>
              <Input
                required
                placeholder="e.g. Laptop computer"
                value={form.equipmentType}
                onChange={(e) => setForm((f) => ({ ...f, equipmentType: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description (optional)</Label>
              <Input
                value={form.equipmentDescription}
                onChange={(e) => setForm((f) => ({ ...f, equipmentDescription: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Serial number</Label>
              <Input
                value={form.serialNumber}
                onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save profile</Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No profiles yet. Use “Add saved equipment profile.”</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border bg-white">
          {items.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-ub-maroon">{i.label}</p>
                <p className="text-gray-600">
                  {i.equipmentType}
                  {[i.brand, i.serialNumber ? `SN: ${i.serialNumber}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button type="button" variant="destructive" size="sm" onClick={() => remove(i.id)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500">
        Profiles are private to your account and used only to pre-fill the gate pass form — not broadcast to
        other users.
      </p>
    </div>
  );
}
