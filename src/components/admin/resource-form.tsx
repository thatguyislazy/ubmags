"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ResourceFormProps = {
  type: "EQUIPMENT" | "VENUE" | "SERVICE";
  initialData?: {
    id?: string;
    name: string;
    description?: string | null;
    requiresSpecify?: boolean;
    sortOrder?: number;
  };
};

export function ResourceForm({ type, initialData }: ResourceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initialData?.id;

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
      category: type,
    };

    // Validate name
    if (!data.name || (data.name as string).trim().length === 0) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    const url = isEdit 
      ? `/api/admin/resources/${initialData.id}/update`
      : "/api/admin/resources/create";
    
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Redirect back to the list page
      const listPage = `/admin/resources/${type.toLowerCase()}`;
      router.push(listPage);
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const getTitle = () => {
    switch (type) {
      case "EQUIPMENT":
        return "Equipment";
      case "VENUE":
        return "Venue";
      case "SERVICE":
        return "Service";
      default:
        return "Resource";
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case "EQUIPMENT":
        return "e.g., Laptop, Projector, Microphone";
      case "VENUE":
        return "e.g., Auditorium, Conference Room, Gymnasium";
      case "SERVICE":
        return "e.g., Tech Support, Catering, Security";
      default:
        return "Enter resource name";
    }
  };

  const getDescriptionPlaceholder = () => {
    switch (type) {
      case "EQUIPMENT":
        return "Describe the equipment (brand, model, specifications, etc.)";
      case "VENUE":
        return "Describe the venue (capacity, location, amenities, etc.)";
      case "SERVICE":
        return "Describe the service (what's included, duration, etc.)";
      default:
        return "Enter description";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          {getTitle()} Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData?.name || ""}
          required
          placeholder={getPlaceholder()}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          This will be displayed in reservation forms
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData?.description || ""}
          rows={3}
          placeholder={getDescriptionPlaceholder()}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Optional: Provide additional details about this resource
        </p>
      </div>

      {type === "VENUE" && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requiresSpecify"
            name="requiresSpecify"
            defaultChecked={initialData?.requiresSpecify || false}
            className="h-4 w-4 rounded border-gray-300 text-ub-maroon focus:ring-2 focus:ring-ub-maroon/20"
          />
          <Label htmlFor="requiresSpecify" className="cursor-pointer">
            Requires specification (e.g., room number, building name)
          </Label>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={initialData?.sortOrder || 0}
          className="w-32"
          min="0"
          step="1"
        />
        <p className="text-xs text-gray-500">
          Lower numbers appear first in lists. Default is 0.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-ub-maroon text-white hover:bg-ub-maroon/90"
        >
          {loading ? "Saving..." : isEdit ? "Update Resource" : "Create Resource"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}