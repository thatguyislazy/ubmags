import { NextResponse } from "next/server";
import { Resend } from 'resend';

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'MAGS Test <onboarding@resend.dev>',
      to: ['marcadriancuano@gmail.com'],
      subject: 'Test from MAGS API',
      html: '<h1>Hello!</h1><p>This is a test from your MAGS app.</p>',
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
