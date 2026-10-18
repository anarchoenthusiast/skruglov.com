"use client";

import { FormEvent, useState } from "react";
import { contactFormLabels } from "@/content/contact";
import type { Locale } from "@/content/locales";

export function ContactForm({ locale = "en" }: { locale?: Locale }) {
  const copy = contactFormLabels[locale];
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const response = await fetch("/api/contact", { method: "POST", body: form });
      if (!response.ok) throw new Error("Unable to send inquiry");
      formElement.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <label>
        <span className="visually-hidden">{copy.name}</span>
        <input name="name" maxLength={200} required autoComplete="name" placeholder={copy.name} className="contact-form__field" />
      </label>
      <label>
        <span className="visually-hidden">{copy.email}</span>
        <input
          name="email"
          type="email"
          maxLength={254}
          required
          autoComplete="email"
          placeholder={copy.email}
          className="contact-form__field"
        />
      </label>
      <label>
        <span className="visually-hidden">{copy.message}</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder={copy.message}
          className="contact-form__field contact-form__field--area"
        />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="honeypot" />
      <button type="submit" disabled={status === "sending"} className="contact-form__button">
        {status === "sending" ? copy.sending : copy.submit}
      </button>
      <p aria-live="polite" className="contact-form__status text-holder-small">
        {status === "success" ? copy.success : status === "error" ? copy.error : null}
      </p>
    </form>
  );
}
