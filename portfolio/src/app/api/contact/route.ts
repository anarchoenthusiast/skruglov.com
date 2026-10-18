import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { siteConfig } from "@/content/site";
import { parseInquiry } from "@/lib/contact";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  if (!siteConfig.features.contactForm) return NextResponse.json({ error: "Contact form is disabled." }, { status: 404 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Invalid form submission." }, { status: 400 }); }
  const result = parseInquiry({ name: form.get("name"), email: form.get("email"), message: form.get("message"), website: form.get("website") });
  if (result.kind === "bot") return NextResponse.json({ ok: true });
  if (result.kind === "invalid") return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  const user = process.env.SMTP_USER?.trim() ?? process.env.MIGADU_SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim() ?? process.env.MIGADU_SMTP_PASS?.trim();
  const host = process.env.SMTP_HOST?.trim() || "smtp.migadu.com";
  const port = Number(process.env.SMTP_PORT || 587);
  if (!user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) return NextResponse.json({ error: "Email service is unavailable." }, { status: 503 });
  const transport = nodemailer.createTransport({ host, port, secure: port === 465, requireTLS: port !== 465, auth: { user, pass }, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 20000 });
  const { name, email, message } = result.inquiry;
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM?.trim() || process.env.MIGADU_SMTP_FROM?.trim() || { name: siteConfig.name, address: user },
      to: process.env.CONTACT_TO?.trim() || siteConfig.contact.email,
      replyTo: email, subject: `Website inquiry from ${name}`, text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
  } catch {
    console.error("Contact email delivery failed.");
    return NextResponse.json({ error: "Email service failed." }, { status: 502 });
  } finally { transport.close(); }
  return NextResponse.json({ ok: true });
}
