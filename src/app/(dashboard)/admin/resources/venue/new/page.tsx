"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewVenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresSpecify, setRequiresSpecify] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description") || null,
      requiresSpecify: formData.get("requiresSpecify") === "on",
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      category: "VENUE",
    };

    if (!data.name || (data.name as string).trim().length === 0) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/resources/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/admin/resources/venue");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ub-maroon">Add New Venue</h1>
        <p className="text-sm text-gray-500">Create a new venue resource for reservations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Venue Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g., Auditorium, Conference Room, Gymnasium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe the venue (capacity, location, amenities, etc.)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresSpecify"
                name="requiresSpecify"
                checked={requiresSpecify}
                onChange={(e) => setRequiresSpecify(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="requiresSpecify" className="cursor-pointer">
                Requires specification (e.g., room number, building name)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={0}
                className="w-32"
                min="0"
              />
              <p className="text-xs text-gray-500">
                Lower numbers appear first in lists
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Venue"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}