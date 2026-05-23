"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

export function Header({ title, unreadCount = 0 }: { title: string; unreadCount?: number }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-xl font-semibold text-ub-maroon">{title}</h1>
      <Link
        href="/notifications"
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ub-maroon text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}
