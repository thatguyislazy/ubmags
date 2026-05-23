"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewEquipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    const nameValue = formData.get("name") as string;
    const descriptionValue = formData.get("description") as string;
    const quantityValue = formData.get("quantity") as string;

    if (!nameValue || nameValue.trim().length === 0) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    const quantity = parseInt(quantityValue) || 0;
    if (quantity < 0) {
      setError("Quantity cannot be negative");
      setLoading(false);
      return;
    }

    const data = {
      name: nameValue.trim(),
      description: descriptionValue || null,
      quantity: quantity,
      category: "EQUIPMENT",
    };

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

      router.push("/admin/resources/equipment");
      router.refresh();
    } catch (err) {
      console.error("Submit error:", err);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ub-maroon">Add New Equipment</h1>
        <p className="text-sm text-gray-500">Create a new equipment resource for reservations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Information</CardTitle>
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
                Equipment Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g., Laptop, Projector, Microphone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe the equipment (brand, model, specifications, etc.)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                required
                min="0"
                defaultValue={0}
                className="w-32"
              />
              <p className="text-xs text-gray-500">
                Number of units available for reservation
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Equipment"}
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