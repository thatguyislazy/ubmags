"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [equipment, setEquipment] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchEquipment();
    }
  }, [id]);

  async function fetchEquipment() {
    try {
      const res = await fetch(`/api/admin/resources/${id}`);
      if (!res.ok) throw new Error("Failed to fetch equipment");
      const data = await res.json();
      setEquipment(data);
    } catch (err) {
      setError("Failed to load equipment data");
    } finally {
      setLoadingData(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description") || null,
      quantity: parseInt(formData.get("quantity") as string) || 0,
      category: "EQUIPMENT",
    };

    if (!data.name || (data.name as string).trim().length === 0) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (data.quantity < 0) {
      setError("Quantity cannot be negative");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/resources/${id}/update`, {
        method: "PUT",
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
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">Equipment not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ub-maroon">Edit Equipment</h1>
        <p className="text-sm text-gray-500">Update equipment information</p>
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
                defaultValue={equipment.name}
                placeholder="e.g., Laptop, Projector, Microphone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={equipment.description || ""}
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
                defaultValue={equipment.quantity || 0}
                className="w-32"
              />
              <p className="text-xs text-gray-500">
                Number of units available for reservation
              </p>
            </div>

            {equipment.availableQuantity !== undefined && (
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Currently Available:</span> {equipment.availableQuantity} / {equipment.quantity} units
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This shows how many units are currently not reserved
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
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