export function parseInquiry(values: { name: unknown; email: unknown; message: unknown; website?: unknown }) {
  const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
  const inquiry = { name: text(values.name), email: text(values.email), message: text(values.message) };
  if (text(values.website)) return { kind: "bot" as const };
  if (!inquiry.name || inquiry.name.length > 200 || /[\r\n]/.test(inquiry.name) || inquiry.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email) || inquiry.message.length < 10 || inquiry.message.length > 5000) return { kind: "invalid" as const };
  return { kind: "valid" as const, inquiry };
}
