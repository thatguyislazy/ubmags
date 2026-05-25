import { NextResponse } from "next/server";
import { sendTransactionalEmail, isEmailConfigured } from "@/lib/email";

export async function GET() {
  // Check if email is configured
  const configured = isEmailConfigured();
  
  console.log("Email configured:", configured);
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  
  // Test send
  const result = await sendTransactionalEmail({
    to: "marcadriancuano@gmail.com",
    subject: "Test Email from MAGS System",
    html: "<h1>Test</h1><p>This is a test email.</p>",
    text: "Test email from MAGS System",
  });
  
  return NextResponse.json({
    configured,
    smtp_host: process.env.SMTP_HOST,
    smtp_user: process.env.SMTP_USER,
    result,
  });
}