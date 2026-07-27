export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 6) return null;

  if (digits.startsWith("0")) {
    if (digits.length >= 10) {
      return "40" + digits.substring(1);
    }
  }
  return digits;
}
