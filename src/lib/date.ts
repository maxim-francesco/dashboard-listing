import { differenceInCalendarDays } from "date-fns";

export type LeadAgeBand = "noi" | "neatinse" | "vechi";

/**
 * Categorizes lead creation age into standard product bands:
 * - "noi": <= 2 days
 * - "neatinse": <= 14 days
 * - "vechi": > 14 days
 */
export function getLeadAgeBand(createdAt: string): LeadAgeBand {
  const days = differenceInCalendarDays(new Date(), new Date(createdAt));
  if (days <= 2) return "noi";
  if (days <= 14) return "neatinse";
  return "vechi";
}

/**
 * Calculates remaining calendar days until expiration.
 */
export function daysLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
