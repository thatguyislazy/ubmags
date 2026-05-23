import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Building2, Calendar, Shield, FileCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ub-maroon via-ub-maroon-dark to-ub-navy">
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <BrandLogo size={44} priority className="ring-2 ring-ub-gold/70" />
          <div className="text-white">
            <p className="font-bold leading-tight">MAGS</p>
            <p className="text-xs text-white/70">University of Batangas</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-white">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-ub-gold">
              Management of Assets & General Services
            </p>
            <h1 className="mb-6 text-4xl font-bold leading-tight lg:text-5xl">
              MAGS Resource Management System - UBLC
            </h1>
            <p className="mb-8 text-lg text-white/80">
              A paperless platform for reserving school rooms, venues, equipment, manpower,
              and gate passes — with digital approvals aligned to F-MAGS LC-10, LC-05, and LC-06 forms.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Request Access
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Building2, title: "Venue Reservations", desc: "F-MAGS LC-10 compliant forms" },
              { icon: FileCheck, title: "Gate Passes", desc: "QR-verified equipment pull-out" },
              { icon: Calendar, title: "Smart Scheduling", desc: "Conflict detection & calendars" },
              { icon: Shield, title: "Role-Based Access", desc: "Student to Admin workflows" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <f.icon className="mb-3 h-8 w-8 text-ub-gold" />
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-white/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-white/50">
        © {new Date().getFullYear()} University of Batangas — MAGS Resource Management System - UBLC. See the{" "}
        <code className="text-ub-gold">docs/</code> folder for module guides.
      </footer>
    </div>
  );
}
