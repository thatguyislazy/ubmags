import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { canAccessAdmin } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || !canAccessAdmin(session.role)) redirect("/dashboard");

  return (
    <>
      <Header title="Settings" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>MAGS Officer default approver: Editha E. Sevilleja</p>
            <p>Form references: F-MAGS LC-10, LC-05, LC-06</p>
            <p>Email/SMS: Configure SMTP environment variables for production notifications.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
