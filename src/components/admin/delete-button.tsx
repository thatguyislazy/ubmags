"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/admin/resources/${id}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button 
      onClick={handleDelete}
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}