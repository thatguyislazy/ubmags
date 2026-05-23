"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ReportsPage() {
  const [data, setData] = useState<{
    summary?: Record<string, number>;
    departmentActivity?: { department: string; count: number }[];
    topVenues?: { name: string; count: number }[];
    topEquipment?: { name: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <>
      <Header title="Reports & Analytics" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Reservations", key: "totalReservations" },
            { label: "Approved", key: "approvedReservations" },
            { label: "Pending Approvals", key: "pendingApprovals" },
            { label: "Gate Passes", key: "gatePassCount" },
          ].map((s) => (
            <Card key={s.key}>
              <CardContent className="p-5">
                <p className="text-2xl font-bold text-ub-maroon">
                  {data?.summary?.[s.key] ?? "—"}
                </p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {data?.topVenues && data.topVenues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Most Used Venues</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topVenues}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b0000" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
