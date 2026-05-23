"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/brand-logo";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ub-maroon/5 to-ub-gold/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex items-center justify-center">
            <BrandLogo size={56} priority className="ring-2 ring-ub-maroon/20" />
          </div>
          <CardTitle>Sign in to MAGS</CardTitle>
          <CardDescription>MAGS Resource Management System - UBLC</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@ub.edu.ph" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <Link href="/forgot-password" className="text-ub-maroon hover:underline">
              Forgot password?
            </Link>
            <p className="text-gray-500">
              No account?{" "}
              <Link href="/register" className="font-medium text-ub-maroon hover:underline">
                Register
              </Link>
            </p>
          </div>
          <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <p className="font-medium">Demo accounts (after seed):</p>
            <p>admin@ub.edu.ph / Admin@123</p>
            <p>mags@ub.edu.ph / Mags@123</p>
            <p>student@ub.edu.ph / Student@123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
