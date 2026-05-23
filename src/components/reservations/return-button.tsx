"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ReturnButton({ reservationId }: { reservationId: string }) {
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleReturn() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to return equipment");
      }

      setOpen(false);
      setRemarks("");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to return equipment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
          Return Equipment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Return Equipment</DialogTitle>
          <DialogDescription>
            Confirm that all equipment has been returned in good condition.
            This will add the quantities back to available stock.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Any issues or notes about the returned equipment..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleReturn} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
            {loading ? "Processing..." : "Confirm Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}