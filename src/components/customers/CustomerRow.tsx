import { useNavigate } from "react-router";
import {
  Phone,
  MessageSquare,
  Car,
  Package,
  RefreshCw,
  Coins,
  Calendar,
  FileText,
  Check,
  User,
  Tag
} from "lucide-react";
import InitialsAvatar from "@/components/ui/InitialsAvatar";
import { isToday, isTomorrow, differenceInCalendarDays, format, formatDistanceToNow, isPast } from "date-fns";
import { ro } from "date-fns/locale";
import { CustomerListItem } from "@/services/api";
import { formatEur } from "@/lib/format";
import { getLeadAgeBand } from "@/lib/date";
import { TYPE_LABELS, TYPE_COLORS } from "@/components/leads/LeadDetailPanel";
import { telLink, formatRoPhone, hasUsablePhone, normalizeRoPhone } from "@/utils/phone";

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

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GENERAL: MessageSquare,
  STOCK: Car,
  ORDER: Package,
  BUYBACK: RefreshCw,
  FINANCING: Coins,
};

const DOT_COLORS: Record<string, string> = {
  GENERAL: "bg-blue-500",
  STOCK: "bg-purple-500",
  ORDER: "bg-indigo-500",
  BUYBACK: "bg-amber-500",
  FINANCING: "bg-green-500",
};

const ageLabel = (status: string, createdAt: string): string => {
  const label = STATUS_LABELS[status] || status;
  if (status !== "NEW") return label;
  const band = getLeadAgeBand(createdAt);
  if (band === "noi") return "Nou";
  if (band === "neatinse") return "Neatins";
  return "Vechi";
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

export function getSignal(c: CustomerListItem): {
  text: string;
  tone: "warning" | "destructive" | "muted" | "foreground";
  deadline: Date | null;
} {
  const deadline = getDeadline(c);
  if (!deadline) {
    let text = "";
    if (c.openLead) {
      text = `${ageLabel(c.openLead.status, c.openLead.createdAt)} · ${formatDistanceToNow(new Date(c.openLead.createdAt), { addSuffix: true, locale: ro })}`;
    } else if (c.purchasedCars && c.purchasedCars.length > 0) {
      const firstCar = c.purchasedCars[0];
      text = `A cumpărat ${firstCar}${c.purchasedCars.length > 1 ? ` și încă ${c.purchasedCars.length - 1}` : ""}`;
    } else {
      text = formatRoPhone(c.phone) || "Fără telefon";
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

export interface PrimaryEvent {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClasses: string;
  detail: string;
}

export function getPrimaryEvent(customer: CustomerListItem): PrimaryEvent {
  const unreadLead = customer.openLead && !customer.openLead.isRead;
  const appt = customer.nextAppointment;
  const offer = customer.pendingOffer;
  const resv = customer.activeReservation;

  if (unreadLead) {
    const type = customer.openLead!.type;
    const statusLabel = ageLabel(customer.openLead!.status, customer.openLead!.createdAt);
    const distanceStr = formatDistanceToNow(new Date(customer.openLead!.createdAt), { addSuffix: true, locale: ro });
    return {
      label: TYPE_LABELS[type] || type,
      icon: TYPE_ICONS[type] || MessageSquare,
      colorClasses: TYPE_COLORS[type] || "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      detail: `${statusLabel} · ${distanceStr}`
    };
  }

  if (appt) {
    const startAt = new Date(appt.startAt);
    const hhMm = format(startAt, "HH:mm");
    let dayPrefix = "";
    if (isToday(startAt)) {
      dayPrefix = "Azi";
    } else if (isTomorrow(startAt)) {
      dayPrefix = "Mâine";
    } else {
      dayPrefix = format(startAt, "d MMM", { locale: ro });
    }
    const type = appt.type ?? "OTHER";
    const typeLabelLower = TYPE_LABELS_LOWER[type] || "altele";
    return {
      label: "Programare",
      icon: Calendar,
      colorClasses: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      detail: `${dayPrefix} ${hhMm} · ${typeLabelLower}`
    };
  }

  if (offer) {
    const offerPrice = offer.offerPrice ?? 0;
    const car = offer.car || "autovehicul";
    return {
      label: "Ofertă",
      icon: FileText,
      colorClasses: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      detail: `${car} · ${formatEur(offerPrice)}`
    };
  }

  if (resv) {
    const depositAmount = resv.depositAmount ?? 0;
    const car = resv.car || "autovehicul";
    return {
      label: "Rezervare",
      icon: Tag,
      colorClasses: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      detail: `${formatEur(depositAmount)} avans · ${car}`
    };
  }

  // Fallback
  let fallbackDetail = "";
  if (customer.purchasedCars && customer.purchasedCars.length > 0) {
    const firstCar = customer.purchasedCars[0];
    fallbackDetail = `A cumpărat ${firstCar}${customer.purchasedCars.length > 1 ? ` și încă ${customer.purchasedCars.length - 1}` : ""}`;
  } else if (customer.openLead) {
    const statusLabel = ageLabel(customer.openLead.status, customer.openLead.createdAt);
    const distanceStr = formatDistanceToNow(new Date(customer.openLead.createdAt), { addSuffix: true, locale: ro });
    fallbackDetail = `${statusLabel} · ${distanceStr}`;
  } else if (customer.lastInteraction) {
    try {
      const d = new Date(customer.lastInteraction);
      if (!isNaN(d.getTime())) {
        fallbackDetail = `Ultima interacțiune ${formatDistanceToNow(d, { addSuffix: true, locale: ro })}`;
      } else {
        fallbackDetail = customer.lastInteraction;
      }
    } catch {
      fallbackDetail = customer.lastInteraction;
    }
  } else {
    fallbackDetail = formatRoPhone(customer.phone) || "Fără telefon";
  }

  return {
    label: customer.purchasedCars && customer.purchasedCars.length > 0 ? "Cumpărător" : "",
    icon: customer.purchasedCars && customer.purchasedCars.length > 0 ? Check : User,
    colorClasses: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400",
    detail: fallbackDetail
  };
}

export const CUSTOMER_COLS = {
  avatar: "w-9",
  name: "flex-1 min-w-0",
  phone: "w-36",
  type: "w-28",
  detail: "w-72",
  amount: "w-32",
  deadline: "w-24",
  call: "w-20",
} as const;

interface CustomerRowProps {
  customer: CustomerListItem;
  variant?: "action" | "plain";
}

export default function CustomerRow({ customer, variant = "plain" }: CustomerRowProps) {
  const navigate = useNavigate();
  
  const hasUnreadLead = !!(customer.openLead && !customer.openLead.isRead);
  const primaryEvent = getPrimaryEvent(customer);
  const IconComponent = primaryEvent.icon;

  const presentEvents = [
    !!(customer.openLead && !customer.openLead.isRead),
    !!customer.nextAppointment,
    !!customer.pendingOffer,
    !!customer.activeReservation
  ].filter(Boolean).length;

  const otherCount = presentEvents > 0 ? presentEvents - 1 : 0;

  const callBtnClass = variant === "action"
    ? "bg-success text-success-foreground"
    : "bg-success-light text-success";

  const hasPhone = hasUsablePhone(customer.phone);
  const handleClick = hasPhone
    ? () => navigate(`/customers/${encodeURIComponent(normalizeRoPhone(customer.phone))}`)
    : undefined;

  const rawAmount = customer.activeReservation?.depositAmount ?? customer.pendingOffer?.offerPrice;

  const deadline = getDeadline(customer);
  let deadlineLabel = "—";
  let deadlineTone = "text-muted-foreground";

  if (deadline) {
    const bucket = getBucket(deadline);
    if (bucket === "expirat") {
      deadlineLabel = "expirat";
      deadlineTone = "text-destructive font-medium";
    } else if (bucket === "azi") {
      deadlineLabel = "azi";
      deadlineTone = "text-warning font-medium";
    } else if (bucket === "maine") {
      deadlineLabel = "mâine";
      deadlineTone = "text-warning font-medium";
    } else if (bucket === "saptamana") {
      deadlineLabel = "săptămâna";
      deadlineTone = "text-muted-foreground";
    } else {
      deadlineLabel = format(deadline, "d MMM", { locale: ro });
      deadlineTone = "text-muted-foreground";
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`lg:hidden flex items-center gap-3.5 px-4 py-4 transition-colors ${hasPhone ? "cursor-pointer hover:bg-muted/50" : "cursor-default"}`}
      >
        <InitialsAvatar name={customer.name} className="w-[46px] h-[46px] text-base" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            {hasUnreadLead && (
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${DOT_COLORS[customer.openLead!.type]} shrink-0 animate-pulse`} />
            )}
            <div className="text-[17px] font-medium text-foreground truncate leading-snug">
              {customer.name || "Fără nume"}
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-2 mb-1">
            {primaryEvent.label && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-medium ${primaryEvent.colorClasses}`}>
                {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                {primaryEvent.label}
              </span>
            )}
            
            {otherCount > 0 && (
              <span className="text-[12px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                +{otherCount}
              </span>
            )}
          </div>

          <div className="text-[14px] text-muted-foreground truncate leading-normal">
            {primaryEvent.detail}
          </div>
        </div>
        {hasPhone && (
          <a
            href={telLink(customer.phone)}
            onClick={(e) => e.stopPropagation()}
            className={`w-[50px] h-[50px] rounded-full ${callBtnClass} flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-colors`}
            aria-label={`Sună pe ${customer.name || "client"}`}
          >
            <Phone className="h-5 w-5" />
          </a>
        )}
      </div>

      <div
        data-row
        onClick={handleClick}
        className={`hidden lg:flex items-center gap-3 px-3 py-1.5 h-[54px] border border-transparent transition-colors w-full select-none ${hasPhone ? "cursor-pointer hover:bg-muted/50" : "cursor-default"}`}
      >
        <div data-col="avatar" className={`${CUSTOMER_COLS.avatar} shrink-0 relative`}>
          <InitialsAvatar name={customer.name} className="w-9 h-9 text-[13px]" />
          {hasUnreadLead && (
            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card ${DOT_COLORS[customer.openLead!.type]}`} />
          )}
        </div>

        <div data-col="name" className={`${CUSTOMER_COLS.name} text-[15px] font-medium text-foreground truncate`}>
          {customer.name || "Fără nume"}
        </div>

        <div data-col="phone" className={`${CUSTOMER_COLS.phone} shrink-0 text-[13px] text-muted-foreground tabular-nums truncate`}>
          {formatRoPhone(customer.phone) || "—"}
        </div>

        <div data-col="type" className={`${CUSTOMER_COLS.type} shrink-0 flex justify-center`}>
          {primaryEvent.label ? (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium truncate ${primaryEvent.colorClasses}`}>
              {IconComponent && <IconComponent className="w-3 h-3" />}
              {primaryEvent.label}
            </span>
          ) : null}
        </div>

        <div data-col="detail" className={`${CUSTOMER_COLS.detail} shrink-0 text-[13px] text-muted-foreground truncate`}>
          {primaryEvent.detail}
        </div>

        <div
          data-col="amount"
          className={`${CUSTOMER_COLS.amount} shrink-0 text-right tabular-nums ${
            rawAmount != null
              ? "text-[15px] font-semibold text-foreground"
              : "text-[13px] font-normal text-muted-foreground"
          }`}
        >
          {rawAmount != null ? formatEur(rawAmount) : "—"}
        </div>

        <div data-col="deadline" className={`${CUSTOMER_COLS.deadline} shrink-0 text-right text-[13px] tabular-nums ${deadlineTone}`}>
          {deadlineLabel}
        </div>

        <div data-col="call" className={`${CUSTOMER_COLS.call} shrink-0 flex justify-end`}>
          {hasPhone && (
            <a
              href={telLink(customer.phone)}
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-success-light text-success flex items-center justify-center hover:opacity-90 transition-colors"
              aria-label={`Sună pe ${customer.name || "client"}`}
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </>
  );
}
