"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  reservationId: string;
  status: string;
  userId: string;
  sessionId: string;
  sessionRole: string;
  hasEquipment?: boolean;
  endDateTime?: string;
};

export function ReservationActions({
  reservationId,
  status,
  userId,
  sessionId,
  sessionRole,
  hasEquipment = false,
  endDateTime,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remarks, setRemarks] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Check if reservation period has ended
  useEffect(() => {
    if (endDateTime && status === "APPROVED") {
      const endDate = new Date(endDateTime);
      const now = new Date();
      setIsExpired(endDate < now);
    }
  }, [endDateTime, status]);

  // Role checks
  const isFaculty = sessionRole === "FACULTY" || sessionRole === "DEPT_HEAD" || sessionRole === "STAFF";
  const isMags = sessionRole === "MAGS_OFFICER" || sessionRole === "ADMIN";
  const isOwner = sessionId === userId;

  // Button visibility
  const showSemiApprove = isFaculty && status === "PENDING_DEPT";
  const showFacultyDecline = isFaculty && status === "PENDING_DEPT";
  const showMagsApprove = isMags && status === "PENDING_MAGS";
  const showMagsDecline = isMags && status === "PENDING_MAGS";
  const showCancel = isOwner && ["PENDING_DEPT", "PENDING_MAGS"].includes(status);

  // Venue: Auto mark as completed when expired
  const showMarkCompleted = isMags && status === "APPROVED" && !hasEquipment && isExpired;

  // Equipment: Manual return with remarks
  const showEquipmentReturn = isMags && status === "APPROVED" && hasEquipment && !isExpired;

  const needsSignature = showSemiApprove || showFacultyDecline || showMagsApprove || showMagsDecline;
  const hasActions =
    showSemiApprove ||
    showFacultyDecline ||
    showMagsApprove ||
    showMagsDecline ||
    showCancel ||
    showMarkCompleted ||
    showEquipmentReturn;

  if (!hasActions) {
    return (
      <div className="border-t pt-4">
        <p className="text-sm text-gray-500">No actions available for this reservation at this stage.</p>
      </div>
    );
  }

  async function submitAction(action: string, extraRemarks?: string) {
    if (needsSignature && !signatureName.trim()) {
      setError("Please enter your name as typed signature.");
      return;
    }
    if (action === "decline" && !remarks.trim()) {
      setError("Please provide a reason for declining.");
      return;
    }
    if (action === "equipment_return" && !extraRemarks?.trim()) {
      setError("Please provide return remarks (e.g., condition of equipment).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/reservations/${reservationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          remarks: extraRemarks || remarks,
          signatureName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Action failed. Please try again.");
        setLoading(false);
        return;
      }

      setShowReturnForm(false);
      setReturnRemarks("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="border-t pt-4 space-y-4">
      <h4 className="font-medium text-ub-maroon">Actions</h4>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* For Venue that has expired - show auto-complete info */}
      {showMarkCompleted && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          <p className="font-medium">Reservation period has ended.</p>
          <p className="text-xs mt-1">Click "Mark as Completed" to close this reservation.</p>
        </div>
      )}

      {/* Equipment Return Form */}
      {showReturnForm && (
        <div className="space-y-3 rounded-lg border p-4 bg-amber-50">
          <p className="text-sm font-medium text-amber-800">Confirm Equipment Return</p>
          <div className="space-y-1">
            <Label htmlFor="returnRemarks">
              Return Remarks <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="returnRemarks"
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              rows={3}
              placeholder="e.g., All equipment returned in good condition / Laptop has minor scratches..."
            />
            <p className="text-xs text-gray-500">
              Include any damages or missing items here
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => submitAction("equipment_return", returnRemarks)}
              disabled={loading}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {loading ? "Processing..." : "Confirm Return"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowReturnForm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {needsSignature && (
        <div className="space-y-3 rounded-lg border p-4 bg-gray-50">
          <div className="space-y-1">
            <Label htmlFor="signatureName">
              Your name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="signatureName"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Type your full name as signature"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="remarks">
              Remarks{" "}
              {(showFacultyDecline || showMagsDecline) && (
                <span className="text-red-500">* required if declining</span>
              )}
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="Add remarks or reason..."
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {showSemiApprove && (
          <Button
            onClick={() => submitAction("semi_approve")}
            disabled={loading}
            className="bg-ub-maroon text-white"
          >
            {loading ? "Processing..." : "Semi-Approve"}
          </Button>
        )}
        {showFacultyDecline && (
          <Button
            onClick={() => submitAction("decline")}
            disabled={loading}
            variant="outline"
            className="border-red-300 text-red-600"
          >
            {loading ? "Processing..." : "Decline"}
          </Button>
        )}
        {showMagsApprove && (
          <Button
            onClick={() => submitAction("approve")}
            disabled={loading}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {loading ? "Processing..." : "Approve"}
          </Button>
        )}
        {showMagsDecline && (
          <Button
            onClick={() => submitAction("decline")}
            disabled={loading}
            variant="outline"
            className="border-red-300 text-red-600"
          >
            {loading ? "Processing..." : "Decline"}
          </Button>
        )}
        {showCancel && (
          <Button
            onClick={() => submitAction("cancel")}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Processing..." : "Cancel Reservation"}
          </Button>
        )}
        {showMarkCompleted && (
          <Button
            onClick={() => submitAction("complete")}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Processing..." : "Mark as Completed"}
          </Button>
        )}
        {showEquipmentReturn && !showReturnForm && (
          <Button
            onClick={() => setShowReturnForm(true)}
            disabled={loading}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            Return Equipment
          </Button>
        )}
      </div>
    </div>
  );
}