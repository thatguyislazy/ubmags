"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";

import {
  LayoutDashboard,
  Calendar,
  DoorOpen,
  Package,
  FileText,
  Bell,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  ClipboardCheck,
  Wrench,
  UserRound,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import { canAccessAdmin, canViewReports } from "@/lib/rbac";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reservations", label: "Reservations", icon: DoorOpen },
  { href: "/gate-passes", label: "Gate Passes", icon: ClipboardCheck },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/profile", label: "My Profile", icon: UserRound },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar({
  user,
}: {
  user: { name: string; role: UserRole; email: string };
}) {
  const pathname = usePathname();
  const showAdmin = canAccessAdmin(user.role);
  const showReports = canViewReports(user.role);

  // Submenu states
  const [newResOpen, setNewResOpen] = useState(
    pathname.startsWith("/reservations/new")
  );
  const [resourcesOpen, setResourcesOpen] = useState(
    pathname.startsWith("/admin/resources/")
  );

  useEffect(() => {
    if (!pathname.startsWith("/reservations/new")) {
      setNewResOpen(false);
    }
    if (!pathname.startsWith("/admin/resources/")) {
      setResourcesOpen(false);
    }
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-ub-maroon text-white">
      {/* Logo Section - Fixed at top */}
      <div className="flex-shrink-0 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} className="ring-2 ring-ub-gold/70" />
          <div>
            <p className="text-sm font-bold leading-tight">MAGS</p>
            <p className="text-[10px] text-white/70">Resource Management - UBLC</p>
          </div>
        </div>
      </div>

      {/* Navigation Section - Scrollable if needed */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/50">
          Main Menu
        </p>

        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
            pathname === "/dashboard"
              ? "bg-ub-gold text-ub-maroon font-medium"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Reservations */}
        <Link
          href="/reservations"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
            pathname === "/reservations"
              ? "bg-ub-gold text-ub-maroon font-medium"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <DoorOpen className="h-4 w-4" />
          Reservations
        </Link>

        {/* New Reservation — collapsible submenu */}
        <div>
          <button
            onClick={() => setNewResOpen((v) => !v)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              pathname.startsWith("/reservations/new")
                ? "bg-white/10 text-white font-medium"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">New Reservation</span>
            {newResOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {newResOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
              <Link
                href="/reservations/new/equipment"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive("/reservations/new/equipment")
                    ? "bg-ub-gold text-ub-maroon font-medium"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Package className="h-4 w-4" />
                Equipment
              </Link>
              <Link
                href="/reservations/new/venue"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive("/reservations/new/venue")
                    ? "bg-ub-gold text-ub-maroon font-medium"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <DoorOpen className="h-4 w-4" />
                Venue
              </Link>
            </div>
          )}
        </div>

        {/* Gate Passes */}
        <Link
          href="/gate-passes"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
            pathname === "/gate-passes"
              ? "bg-ub-gold text-ub-maroon font-medium"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <ClipboardCheck className="h-4 w-4" />
          Gate Passes
        </Link>

        {/* Calendar */}
        <Link
          href="/calendar"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
            pathname === "/calendar"
              ? "bg-ub-gold text-ub-maroon font-medium"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </Link>

        {/* My Profile */}
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
            pathname === "/profile"
              ? "bg-ub-gold text-ub-maroon font-medium"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <UserRound className="h-4 w-4" />
          My Profile
        </Link>

        {/* Notifications */}
        <Link
          href="/notifications"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
            pathname === "/notifications"
              ? "bg-ub-gold text-ub-maroon font-medium"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <Bell className="h-4 w-4" />
          Notifications
        </Link>

        {/* Administration Section */}
        {showAdmin && (
          <>
            <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Administration
            </p>
            
            {/* Users */}
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive("/admin/users")
                  ? "bg-ub-gold text-ub-maroon font-medium"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Users className="h-4 w-4" />
              Users
            </Link>

            {/* Departments */}
            <Link
              href="/admin/departments"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive("/admin/departments")
                  ? "bg-ub-gold text-ub-maroon font-medium"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Building2 className="h-4 w-4" />
              Departments
            </Link>

            {/* Resources — collapsible submenu */}
            <div>
              <button
                onClick={() => setResourcesOpen((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  pathname.startsWith("/admin/resources")
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Wrench className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Resources</span>
                {resourcesOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>

              {resourcesOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
                  <Link
                    href="/admin/resources/equipment"
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive("/admin/resources/equipment")
                        ? "bg-ub-gold text-ub-maroon font-medium"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Package className="h-4 w-4" />
                    Equipment
                  </Link>
                  <Link
                    href="/admin/resources/venue"
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive("/admin/resources/venue")
                        ? "bg-ub-gold text-ub-maroon font-medium"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <DoorOpen className="h-4 w-4" />
                    Venue
                  </Link>
                </div>
              )}
            </div>

            {/* Approvals */}
            <Link
              href="/admin/approvals"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive("/admin/approvals")
                  ? "bg-ub-gold text-ub-maroon font-medium"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <ClipboardCheck className="h-4 w-4" />
              Approvals
            </Link>

            {/* Reports (conditional) */}
            {showReports && (
              <Link
                href="/admin/reports"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive("/admin/reports")
                    ? "bg-ub-gold text-ub-maroon font-medium"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <BarChart3 className="h-4 w-4" />
                Reports
              </Link>
            )}

            {/* Settings */}
            <Link
              href="/admin/settings"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive("/admin/settings")
                  ? "bg-ub-gold text-ub-maroon font-medium"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </>
        )}
      </nav>

      {/* User Info & Logout - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-white/10 p-4">
        <div className="mb-3 px-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-white/60">{user.email}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}