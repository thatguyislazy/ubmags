"use client";

import { useState } from "react";
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
};

export function ReservationActions({
  reservationId,
  status,
  userId,
  sessionId,
  sessionRole,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remarks, setRemarks] = useState("");
  const [signatureName, setSignatureName] = useState("");

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

  const needsSignature = showSemiApprove || showFacultyDecline || showMagsApprove || showMagsDecline;
  const hasActions = showSemiApprove || showFacultyDecline || showMagsApprove || showMagsDecline || showCancel;

  // Debug logging
  console.log("ReservationActions Debug:", {
    sessionRole,
    status,
    isMags,
    showMagsApprove,
    showMagsDecline,
    hasActions
  });

  if (!hasActions) {
    return (
      <div className="border-t pt-4">
        <p className="text-sm text-gray-500">No actions available for this reservation at this stage.</p>
      </div>
    );
  }

  async function submitAction(action: string) {
    if (needsSignature && !signatureName.trim()) {
      setError("Please enter your name as typed signature.");
      return;
    }
    if (action === "decline" && !remarks.trim()) {
      setError("Please provide a reason for declining.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/reservations/${reservationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remarks, signatureName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Action failed. Please try again.");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch (err) {
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
              Remarks {(showFacultyDecline || showMagsDecline) && <span className="text-red-500">* required if declining</span>}
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
          <Button onClick={() => submitAction("semi_approve")} disabled={loading} className="bg-ub-maroon text-white">
            {loading ? "Processing..." : "Semi-Approve"}
          </Button>
        )}
        {showFacultyDecline && (
          <Button onClick={() => submitAction("decline")} disabled={loading} variant="outline" className="border-red-300 text-red-600">
            {loading ? "Processing..." : "Decline"}
          </Button>
        )}
        {showMagsApprove && (
          <Button onClick={() => submitAction("approve")} disabled={loading} className="bg-green-600 text-white hover:bg-green-700">
            {loading ? "Processing..." : "Approve"}
          </Button>
        )}
        {showMagsDecline && (
          <Button onClick={() => submitAction("decline")} disabled={loading} variant="outline" className="border-red-300 text-red-600">
            {loading ? "Processing..." : "Decline"}
          </Button>
        )}
        {showCancel && (
          <Button onClick={() => submitAction("cancel")} disabled={loading} variant="outline">
            {loading ? "Processing..." : "Cancel Reservation"}
          </Button>
        )}
      </div>
    </div>
  );
}