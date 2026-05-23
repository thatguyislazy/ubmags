"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SavedItem = {
  id: string;
  label: string;
  equipmentType: string;
  equipmentDescription: string | null;
  brand: string | null;
  serialNumber: string | null;
  model: string | null;
};

export function GatePassForm({
  defaultName,
  defaultCourse,
  defaultStudentNumber,
}: {
  defaultName?: string;
  defaultCourse?: string | null;
  defaultStudentNumber?: string | null;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile/saved-equipment")
      .then((r) => r.json())
      .then(setSaved)
      .catch(() => setSaved([]));
  }, []);



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/gate-passes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestorName: form.get("requestorName"),
        course: form.get("course"),
        studentNumber: form.get("studentNumber"),
        equipmentType: form.get("equipmentType"),
        equipmentDescription: form.get("equipmentDescription"),
        brand: form.get("brand"),
        serialNumber: form.get("serialNumber"),
        model: form.get("model"),
        purpose: form.get("purpose"),
        entryDateTime: form.get("entryDateTime"),
        pullOutDateTime: form.get("pullOutDateTime"),
      }),
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Submission failed");
      return;
    }
    router.push(`/gate-passes/${data.id}`);
    router.refresh();
  }

  const selected = saved.find((s) => s.id === selectedSavedId);

  return (
    <form key={`${selectedSavedId || "manual"}-${formKey}`} onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <h3 className="font-semibold text-ub-maroon">F-MAGS LC-06 — Gate Pass</h3>

      {saved.length > 0 && (
        <div className="rounded-lg border border-ub-maroon/20 bg-amber-50/50 p-4">
          <Label htmlFor="savedPick">Quick fill from Profile</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            <select
              id="savedPick"
              className="min-w-[200px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              value={selectedSavedId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedSavedId(id);
                setFormKey((x) => x + 1);
              }}
            >
              <option value="">Choose saved equipment…</option>
              {saved.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open("/profile", "_blank")}
            >
              Manage profiles
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Save equipment profiles on <strong>My Profile</strong> so serial numbers and models load here instantly.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Date Filed</Label>
          <Input value={new Date().toISOString().slice(0, 10)} disabled />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="requestorName">Name</Label>
          <Input id="requestorName" name="requestorName" defaultValue={defaultName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course">Course</Label>
          <Input id="course" name="course" defaultValue={defaultCourse || ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentNumber">SN (Student Number)</Label>
          <Input id="studentNumber" name="studentNumber" defaultValue={defaultStudentNumber || ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="equipmentType">Type / Kind of Equipment</Label>
          <Input
            id="equipmentType"
            name="equipmentType"
            required
            key={`t-${selected?.id}-${selected?.equipmentType}`}
            defaultValue={selected?.equipmentType || ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="equipmentDescription">Description</Label>
          <Textarea
            id="equipmentDescription"
            name="equipmentDescription"
            rows={2}
            key={`d-${selected?.id}-${selected?.equipmentDescription ?? ""}`}
            defaultValue={selected?.equipmentDescription || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            name="brand"
            key={`b-${selected?.id}-${selected?.brand ?? ""}`}
            defaultValue={selected?.brand || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial No.</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            key={`s-${selected?.id}-${selected?.serialNumber ?? ""}`}
            defaultValue={selected?.serialNumber || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            name="model"
            key={`m-${selected?.id}-${selected?.model ?? ""}`}
            defaultValue={selected?.model || ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea id="purpose" name="purpose" required rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="entryDateTime">Date/Time of Entry</Label>
          <Input id="entryDateTime" name="entryDateTime" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pullOutDateTime">Date/Time of Pull-Out</Label>
          <Input id="pullOutDateTime" name="pullOutDateTime" type="datetime-local" required />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Gate Pass Request"}
      </Button>
    </form>
  );
}
