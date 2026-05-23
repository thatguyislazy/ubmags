"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function ApprovalActions({
  entityType,
  entityId,
}: {
  entityType: "reservation" | "gate_pass";
  entityId: string;
}) {
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject") {
    setLoading(true);
    await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, action, remarks, signatureName }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <p className="text-xs text-gray-600">
        Electronic processing: approvals and typed names replace physical signatures on the paper forms. Entries are stored with timestamps for audit.
      </p>
      <Input
        placeholder="Signature over printed name (typed; optional — defaults to your name)"
        value={signatureName}
        onChange={(e) => setSignatureName(e.target.value)}
      />
      <Textarea
        placeholder="Remarks / comments"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        rows={2}
      />
      <div className="flex gap-2">
        <Button onClick={() => act("approve")} disabled={loading}>
          Approve
        </Button>
        <Button variant="destructive" onClick={() => act("reject")} disabled={loading}>
          Reject
        </Button>
      </div>
    </div>
  );
}
