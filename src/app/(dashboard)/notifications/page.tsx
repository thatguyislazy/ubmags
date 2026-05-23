"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []));
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  }

  return (
    <>
      <Header title="Notifications" />
      <div className="p-6">
        <button
          onClick={markAllRead}
          className="mb-4 text-sm text-ub-maroon hover:underline"
        >
          Mark all as read
        </button>
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 ${n.read ? "bg-white" : "border-ub-maroon/30 bg-ub-maroon/5"}`}
            >
              <p className="font-medium">{n.title}</p>
              <p className="text-sm text-gray-600">{n.message}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(n.createdAt).toLocaleString("en-PH")}
              </p>
              {n.link && (
                <a href={n.link} className="mt-2 inline-block text-sm text-ub-maroon hover:underline">
                  View details →
                </a>
              )}
            </li>
          ))}
        </ul>
        {notifications.length === 0 && (
          <p className="text-gray-500">No notifications.</p>
        )}
      </div>
    </>
  );
}
