import { useNavigate } from "react-router";
import { Phone } from "lucide-react";
import InitialsAvatar from "@/components/ui/InitialsAvatar";
import { isToday, isTomorrow, differenceInCalendarDays, format, formatDistanceToNow, isPast } from "date-fns";
import { ro } from "date-fns/locale";
import { CustomerListItem } from "@/services/api";
import { formatEur } from "@/lib/format";

const TYPE_LABELS_LOWER: Record<string, string> = {
  TEST_DRIVE: "test-drive",
  VIEWING: "vizionare",
  HANDOVER: "predare",
  MEETING: "întâlnire",
  OTHER: "altele",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nou",
  CONTACTED: "Contactat",
  VIEWING: "Vizionare",
  OFFER: "Ofertă",
  WON: "Câștigat",
  LOST: "Pierdut",
};

function getSortedCandidates(c: CustomerListItem) {
  const candidates: { type: "reservation" | "offer" | "appointment"; date: Date }[] = [];

  if (c.activeReservation) {
    candidates.push({ type: "reservation", date: new Date(c.activeReservation.expiresAt) });
  }
  if (c.pendingOffer) {
    candidates.push({ type: "offer", date: new Date(c.pendingOffer.expiresAt) });
  }
  if (c.nextAppointment) {
    candidates.push({ type: "appointment", date: new Date(c.nextAppointment.startAt) });
  }

  const typeOrder = {
    reservation: 0,
    offer: 1,
    appointment: 2,
  };

  candidates.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    if (diff !== 0) return diff;
    return typeOrder[a.type] - typeOrder[b.type];
  });

  return candidates;
}

export type Bucket = "expirat" | "azi" | "maine" | "saptamana" | "tarziu";

export function getDeadline(c: CustomerListItem): Date | null {
  const candidates = getSortedCandidates(c);
  return candidates[0]?.date ?? null;
}

export function getBucket(d: Date | null): Bucket {
  if (d === null) return "tarziu";
  if (isPast(d)) return "expirat";
  if (isToday(d)) return "azi";
  if (isTomorrow(d)) return "maine";
  if (differenceInCalendarDays(d, new Date()) <= 7) return "saptamana";
  return "tarziu";
}

export function getPrimary(c: CustomerListItem, bucket: Bucket, withDay: boolean): { lead: string; rest: string; tone: string } {
  const candidates = getSortedCandidates(c);
  const chosen = candidates[0];
  if (!chosen) {
    return { lead: "", rest: "", tone: "text-foreground" };
  }

  let lead = "";
  let rest = "";
  const tone = bucket === "expirat" ? "text-destructive" : "text-foreground";

  if (chosen.type === "reservation") {
    const depositAmount = c.activeReservation?.depositAmount ?? 0;
    lead = formatEur(depositAmount);
    const car = c.activeReservation?.car;
    rest = car ? `avans · ${car}` : "avans";
  } else if (chosen.type === "offer") {
    const offerPrice = c.pendingOffer?.offerPrice ?? 0;
    lead = formatEur(offerPrice);
    const car = c.pendingOffer?.car;
    rest = car ? `ofertă · ${car}` : "ofertă";
  } else if (chosen.type === "appointment") {
    const startAt = new Date(c.nextAppointment!.startAt);
    const hhMm = format(startAt, "HH:mm");
    if (isToday(startAt)) {
      lead = withDay ? `azi ${hhMm}` : hhMm;
    } else if (isTomorrow(startAt)) {
      lead = withDay ? `mâine ${hhMm}` : hhMm;
    } else {
      lead = format(startAt, "d MMM, HH:mm", { locale: ro });
    }
    const type = c.nextAppointment?.type ?? "OTHER";
    const typeLabelLower = TYPE_LABELS_LOWER[type] || "altele";
    rest = typeLabelLower;
  }

  return { lead, rest, tone };
}

export function getSecondary(c: CustomerListItem): string | null {
  const candidates = getSortedCandidates(c);
  const chosen = candidates[1];
  if (!chosen) return null;

  const d = chosen.date;
  if (chosen.type === "reservation") {
    const depositAmount = c.activeReservation?.depositAmount ?? 0;
    return `+ rezervare ${formatEur(depositAmount)} avans, până pe ${format(d, "d MMM", { locale: ro })}`;
  } else if (chosen.type === "offer") {
    const offerPrice = c.pendingOffer?.offerPrice ?? 0;
    return `+ ofertă ${formatEur(offerPrice)}, până pe ${format(d, "d MMM", { locale: ro })}`;
  } else if (chosen.type === "appointment") {
    const type = c.nextAppointment?.type ?? "OTHER";
    const typeLabelLower = TYPE_LABELS_LOWER[type] || "altele";
    return `+ ${typeLabelLower} pe ${format(d, "d MMM", { locale: ro })} la ${format(d, "HH:mm")}`;
  }
  return null;
}

// Keep existing exports working
export function getSignal(c: CustomerListItem): {
  text: string;
  tone: "warning" | "destructive" | "muted" | "foreground";
  deadline: Date | null;
} {
  const deadline = getDeadline(c);
  if (!deadline) {
    let text = "";
    if (c.openLead && c.openLead.status === "NEW") {
      text = `Lead nou · ${formatDistanceToNow(new Date(c.openLead.createdAt), { addSuffix: true, locale: ro })}`;
    } else if (c.openLead) {
      const statusLabel = STATUS_LABELS[c.openLead.status] || c.openLead.status;
      text = `${statusLabel} · ${formatDistanceToNow(new Date(c.openLead.createdAt), { addSuffix: true, locale: ro })}`;
    } else if (c.purchasedCars && c.purchasedCars.length > 0) {
      const firstCar = c.purchasedCars[0];
      text = `A cumpărat ${firstCar}${c.purchasedCars.length > 1 ? ` și încă ${c.purchasedCars.length - 1}` : ""}`;
    } else {
      text = `+${c.phone}`;
    }
    return { text, tone: "muted", deadline: null };
  }

  const bucket = getBucket(deadline);
  const primary = getPrimary(c, bucket, false);
  const tone = bucket === "expirat" ? "destructive" : (bucket === "azi" || bucket === "maine" ? "warning" : "foreground");
  return {
    text: `${primary.lead} ${primary.rest}`,
    tone,
    deadline,
  };
}

interface CustomerRowProps {
  customer: CustomerListItem;
  variant?: "action" | "plain";
}

export default function CustomerRow({ customer, variant = "plain" }: CustomerRowProps) {
  const navigate = useNavigate();
  const deadline = getDeadline(customer);
  const secondaryText = getSecondary(customer);
  const withDay = variant === "plain";

  let line2Content: React.ReactNode = null;

  if (deadline) {
    const bucket = getBucket(deadline);
    const primary = getPrimary(customer, bucket, withDay);
    line2Content = (
      <div className="text-[13px] truncate">
        <span className={`font-medium ${primary.tone}`}>{primary.lead}</span>{" "}
        <span className="text-muted-foreground">{primary.rest}</span>
      </div>
    );
  } else {
    let fallbackText = "";
    if (customer.openLead && customer.openLead.status === "NEW") {
      fallbackText = `Lead nou · ${formatDistanceToNow(new Date(customer.openLead.createdAt), { addSuffix: true, locale: ro })}`;
    } else if (customer.openLead) {
      const statusLabel = STATUS_LABELS[customer.openLead.status] || customer.openLead.status;
      fallbackText = `${statusLabel} · ${formatDistanceToNow(new Date(customer.openLead.createdAt), { addSuffix: true, locale: ro })}`;
    } else if (customer.purchasedCars && customer.purchasedCars.length > 0) {
      const firstCar = customer.purchasedCars[0];
      fallbackText = `A cumpărat ${firstCar}${customer.purchasedCars.length > 1 ? ` și încă ${customer.purchasedCars.length - 1}` : ""}`;
    } else {
      fallbackText = `+${customer.phone}`;
    }

    line2Content = (
      <div className="text-[13px] truncate text-muted-foreground">
        {fallbackText}
      </div>
    );
  }

  const callBtnClass = variant === "action"
    ? "bg-success text-success-foreground"
    : "bg-success-light text-success";

  return (
    <div
      onClick={() => navigate(`/customers/${encodeURIComponent(customer.phone)}`)}
      className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
    >
      <InitialsAvatar name={customer.name} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-foreground truncate">
          {customer.name || "Fără nume"}
        </div>
        {line2Content}
        {secondaryText && variant === "action" && (
          <div className="text-[12px] text-muted-foreground truncate mt-0.5">
            {secondaryText}
          </div>
        )}
      </div>
      {customer.phone && (
        <a
          href={`tel:+${customer.phone}`}
          onClick={(e) => e.stopPropagation()}
          className={`w-11 h-11 rounded-full ${callBtnClass} flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-colors`}
          aria-label={`Sună pe ${customer.name || "client"}`}
        >
          <Phone className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}
