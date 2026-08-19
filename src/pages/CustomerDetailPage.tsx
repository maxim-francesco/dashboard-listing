import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Loader2,
  ArrowLeft,
  User,
  Phone,
  Mail,
  CalendarPlus,
  FileText,
  CalendarClock,
  BookmarkCheck,
  Tag,
  Car,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  MessageSquare,
} from "lucide-react";
import { getCustomer } from "@/services/api";
import { formatEur } from "@/lib/format";
import AppointmentWizard from "@/components/modals/AppointmentWizard";
import AppointmentEditSheet from "@/components/modals/AppointmentEditSheet";
import { LeadDetailPanel } from "@/components/leads/LeadDetailPanel";
import {
  TYPE_LABELS,
  TYPE_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/components/leads/leadConstants";
import { formatRoPhone, telLink, waLink, hasUsablePhone } from "@/utils/phone";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const APPT_TYPE_LABELS: Record<string, string> = {
  TEST_DRIVE: "Test-drive",
  VIEWING: "Vizionare",
  HANDOVER: "Predare",
  MEETING: "Întâlnire",
  OTHER: "Altele",
};

const APPT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Programată",
  COMPLETED: "Finalizată",
  CANCELLED: "Anulată",
};

const RES_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activă",
  COMPLETED: "Finalizată",
  CANCELLED: "Anulată",
  EXPIRED: "Expirată",
};

const leadCat = (m: any): string => {
  if (m.type === "BUYBACK") return "BUYBACK";
  if (m.type === "ORDER") return "ORDER";
  if (m.type === "STOCK") return "STOCK";
  if (m.type === "FINANCING") return "FINANCING";
  return "GENERAL";
};

const fmt = (s?: string, p = "dd MMM yyyy") => {
  if (!s) return "N/A";
  try {
    return format(new Date(s), p, { locale: ro });
  } catch {
    return "N/A";
  }
};

const CustomerDetailPage = () => {
  const { phone } = useParams();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<any>(null);
  const [leadFilter, setLeadFilter] = useState<string>("ALL");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Collapsible section states (all start collapsed)
  const [contractsOpen, setContractsOpen] = useState(false);
  const [reservationsOpen, setReservationsOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ["customer", phone],
    queryFn: () => getCustomer(phone!),
    enabled: !!phone,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-6 pb-24 px-1">
        <Link
          to="/customers"
          aria-label="Înapoi la clienți"
          className="w-11 h-11 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center py-16 px-4">
          <User className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
          <h3 className="text-[17px] font-semibold text-foreground">Clientul nu a fost găsit</h3>
          <p className="text-[13px] text-muted-foreground mt-1">Nu s-au putut prelua detaliile pentru acest număr.</p>
        </div>
      </div>
    );
  }

  const contracts = customer.contracts ?? [];
  const reservations = customer.reservations ?? [];
  const offers = customer.offers ?? [];
  const appointments = customer.appointments ?? [];
  const messages = customer.messages ?? [];

  const sortedMessages = [...messages].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const email = (messages.find((m: any) => m.email)?.email as string) || customer.email || "";

  const leadTypesPresent = Array.from(
    new Set(sortedMessages.map((m: any) => leadCat(m)))
  ).filter((t) => t !== "GENERAL" || sortedMessages.every((m: any) => leadCat(m) === "GENERAL"));

  const carsOfInterest = Array.from(
    new Set(sortedMessages.map((m: any) => m.car).filter(Boolean))
  ).slice(0, 3);

  const totalInteractions =
    contracts.length + reservations.length + offers.length + appointments.length + messages.length;

  const counts: Record<string, number> = {
    ALL: sortedMessages.length,
    GENERAL: sortedMessages.filter((m: any) => leadCat(m) === "GENERAL").length,
    FINANCING: sortedMessages.filter((m: any) => leadCat(m) === "FINANCING").length,
    STOCK: sortedMessages.filter((m: any) => leadCat(m) === "STOCK").length,
    ORDER: sortedMessages.filter((m: any) => leadCat(m) === "ORDER").length,
    BUYBACK: sortedMessages.filter((m: any) => leadCat(m) === "BUYBACK").length,
  };

  const filterChips = ["ALL", "GENERAL", "FINANCING", "STOCK", "ORDER", "BUYBACK"].filter(
    (k) => k === "ALL" || counts[k] > 0
  );

  const visibleMessages =
    leadFilter === "ALL" ? sortedMessages : sortedMessages.filter((m: any) => leadCat(m) === leadFilter);

  const openEdit = (a: any) => {
    setEditInitial({
      id: a.id,
      title: a.title,
      type: a.type,
      startAt: a.startAt,
      endAt: a.endAt,
      clientName: a.clientName ?? customer.name,
      clientPhone: a.clientPhone ?? customer.phone,
      listingId: a.listingId ?? "",
      notes: a.notes,
      status: a.status,
    });
    setEditOpen(true);
  };

  // Pre-calculate collapsible row details
  const latestContract = contracts[0];
  const latestContractDetail = latestContract?.salePrice ? formatEur(latestContract.salePrice) : "";

  const latestReservation = reservations[0];
  const latestReservationDetail = latestReservation?.depositAmount
    ? `${formatEur(latestReservation.depositAmount)} avans`
    : "";

  const latestOffer = offers[0];
  const latestOfferDetail = latestOffer?.offerPrice ? formatEur(latestOffer.offerPrice) : "";

  const sortedAppointments = [...appointments].sort(
    (a: any, b: any) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
  const now = new Date().getTime();
  const soonestAppt =
    sortedAppointments.find((a: any) => new Date(a.startAt).getTime() >= now) || sortedAppointments[0];
  const soonestApptDetail = soonestAppt ? fmt(soonestAppt.startAt, "dd MMM, HH:mm") : "";

  return (
    <div className="space-y-4 pb-28">
      {/* 1. APP-BAR HEADER */}
      <div className="flex items-center gap-2.5 px-1">
        {/* Back button (clears 44px) */}
        <Link
          to="/customers"
          aria-label="Înapoi la clienți"
          className="w-11 h-11 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Title over subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-semibold text-foreground leading-tight truncate">
            {customer.name || "Nume necunoscut"}
          </h1>
          <p className="text-[12px] text-muted-foreground leading-tight truncate mt-0.5 tabular-nums">
            {formatRoPhone(customer.phone) || "Fără telefon"} · {totalInteractions}{" "}
            {totalInteractions === 1 ? "interacțiune" : "interacțiuni"}
          </p>
        </div>

        {/* Overflow Menu on Right (shown only when email exists) */}
        {email && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Opțiuni suplimentare"
                className="w-11 h-11 p-0 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border min-w-[200px]">
              <DropdownMenuItem
                onClick={() => window.open(`mailto:${email}`, "_self")}
                className="cursor-pointer text-[13px] flex items-center gap-2 min-h-[44px]"
              >
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{email}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 2. CE VREA ACUM */}
      {(leadTypesPresent.length > 0 || carsOfInterest.length > 0) && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Ce vrea acum
          </p>
          {leadTypesPresent.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {leadTypesPresent.map((t) => (
                <span
                  key={t}
                  className={cn(
                    "text-[12px] font-medium px-2.5 py-0.5 rounded-full",
                    TYPE_COLORS[t] || "bg-muted text-muted-foreground"
                  )}
                >
                  {TYPE_LABELS[t] || t}
                </span>
              ))}
            </div>
          )}
          {carsOfInterest.length > 0 && (
            <div className="flex items-start gap-2 text-[14px]">
              <Car className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">
                Interesat de:{" "}
                <span className="text-foreground font-medium">{carsOfInterest.join(", ")}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. FOUR COLLAPSIBLE ROWS IN ONE BORDERED CONTAINER */}
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {/* ROW 1: CONTRACTE */}
        <div>
          <button
            type="button"
            data-testid="collapsible-contracts-trigger"
            onClick={() => setContractsOpen((prev) => !prev)}
            className="w-full px-4 py-3 min-h-[48px] flex items-center justify-between gap-3 text-left transition-colors hover:bg-accent/20 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText
                className={cn(
                  "w-4 h-4 shrink-0",
                  contracts.length > 0 ? "text-blue-500" : "text-muted-foreground/60"
                )}
              />
              <span
                className={cn(
                  "text-[14px] font-medium",
                  contracts.length > 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Contracte
              </span>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                ({contracts.length})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {latestContractDetail && (
                <span className="text-[13px] text-muted-foreground tabular-nums">
                  {latestContractDetail}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  contractsOpen && "rotate-180"
                )}
              />
            </div>
          </button>
          {contractsOpen && (
            <div className="divide-y divide-border bg-background/50 border-t border-border">
              {contracts.length > 0 ? (
                contracts.map((c: any) => (
                  <div
                    key={c.id || c.contractNumber}
                    className="px-4 py-3 min-h-[48px] flex flex-col justify-center"
                  >
                    <p className="text-[15px] font-medium text-foreground truncate">
                      #{c.contractNumber} · {c.car || "Vehicul fără titlu"}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">
                      {formatEur(c.salePrice)} · {fmt(c.saleDate)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-[13px] text-muted-foreground italic">
                  Niciun contract înregistrat.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ROW 2: REZERVĂRI */}
        <div>
          <button
            type="button"
            data-testid="collapsible-reservations-trigger"
            onClick={() => setReservationsOpen((prev) => !prev)}
            className="w-full px-4 py-3 min-h-[48px] flex items-center justify-between gap-3 text-left transition-colors hover:bg-accent/20 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BookmarkCheck
                className={cn(
                  "w-4 h-4 shrink-0",
                  reservations.length > 0 ? "text-amber-500" : "text-muted-foreground/60"
                )}
              />
              <span
                className={cn(
                  "text-[14px] font-medium",
                  reservations.length > 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Rezervări
              </span>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                ({reservations.length})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {latestReservationDetail && (
                <span className="text-[13px] text-muted-foreground tabular-nums">
                  {latestReservationDetail}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  reservationsOpen && "rotate-180"
                )}
              />
            </div>
          </button>
          {reservationsOpen && (
            <div className="divide-y divide-border bg-background/50 border-t border-border">
              {reservations.length > 0 ? (
                reservations.map((r: any) => (
                  <div key={r.id} className="px-4 py-3 min-h-[48px] flex flex-col justify-center">
                    <p className="text-[15px] font-medium text-foreground truncate">
                      {r.car || "Vehicul fără titlu"}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">
                      {formatEur(r.depositAmount)} avans · {fmt(r.createdAt)} ·{" "}
                      {RES_STATUS_LABELS[r.status] || r.status || "N/A"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-[13px] text-muted-foreground italic">
                  Nicio rezervare înregistrată.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ROW 3: OFERTE TRIMISE */}
        <div>
          <button
            type="button"
            data-testid="collapsible-offers-trigger"
            onClick={() => setOffersOpen((prev) => !prev)}
            className="w-full px-4 py-3 min-h-[48px] flex items-center justify-between gap-3 text-left transition-colors hover:bg-accent/20 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Tag
                className={cn(
                  "w-4 h-4 shrink-0",
                  offers.length > 0 ? "text-indigo-500" : "text-muted-foreground/60"
                )}
              />
              <span
                className={cn(
                  "text-[14px] font-medium",
                  offers.length > 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Oferte trimise
              </span>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                ({offers.length})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {latestOfferDetail && (
                <span className="text-[13px] text-muted-foreground tabular-nums">
                  {latestOfferDetail}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  offersOpen && "rotate-180"
                )}
              />
            </div>
          </button>
          {offersOpen && (
            <div className="divide-y divide-border bg-background/50 border-t border-border">
              {offers.length > 0 ? (
                offers.map((o: any) => {
                  const stateText = o.viewedAt
                    ? "văzută"
                    : o.expiresAt && new Date(o.expiresAt) < new Date()
                    ? "expirată"
                    : "trimisă, nedeschisă";
                  const stateCls = o.viewedAt
                    ? "text-green-600"
                    : o.expiresAt && new Date(o.expiresAt) < new Date()
                    ? "text-destructive"
                    : "text-muted-foreground";
                  return (
                    <div
                      key={o.id}
                      className="px-4 py-3 min-h-[48px] flex justify-between items-start gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium text-foreground truncate">
                          {o.car || "Vehicul fără titlu"}
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">
                          {fmt(o.createdAt)} · <span className={stateCls}>{stateText}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-semibold text-foreground tabular-nums">
                          {formatEur(o.offerPrice)}
                        </p>
                        {o.listPrice && o.listPrice > o.offerPrice && (
                          <p className="text-[12px] text-muted-foreground line-through tabular-nums">
                            {formatEur(o.listPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-[13px] text-muted-foreground italic">
                  Nicio ofertă înregistrată.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ROW 4: PROGRAMĂRI */}
        <div>
          <button
            type="button"
            data-testid="collapsible-appointments-trigger"
            onClick={() => setAppointmentsOpen((prev) => !prev)}
            className="w-full px-4 py-3 min-h-[48px] flex items-center justify-between gap-3 text-left transition-colors hover:bg-accent/20 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CalendarClock
                className={cn(
                  "w-4 h-4 shrink-0",
                  appointments.length > 0 ? "text-teal-500" : "text-muted-foreground/60"
                )}
              />
              <span
                className={cn(
                  "text-[14px] font-medium",
                  appointments.length > 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Programări
              </span>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                ({appointments.length})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {soonestApptDetail && (
                <span className="text-[13px] text-muted-foreground tabular-nums">
                  {soonestApptDetail}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  appointmentsOpen && "rotate-180"
                )}
              />
            </div>
          </button>
          {appointmentsOpen && (
            <div className="divide-y divide-border bg-background/50 border-t border-border">
              {appointments.length > 0 ? (
                appointments.map((a: any) => (
                  <button
                    key={a.id}
                    type="button"
                    data-testid={`appointment-item-${a.id}`}
                    onClick={() => openEdit(a)}
                    className="w-full text-left px-4 py-3 min-h-[48px] flex items-center gap-3 hover:bg-accent/40 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-foreground truncate">
                        {a.title || "Programare"}
                      </p>
                      <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">
                        {APPT_TYPE_LABELS[a.type] || a.type} · {fmt(a.startAt, "dd MMM, HH:mm")} ·{" "}
                        {APPT_STATUS_LABELS[a.status] || a.status}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-[13px] text-muted-foreground italic">
                  Nicio programare înregistrată.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. MESSAGES & LEADS */}
      {messages.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Mesaje & lead-uri ({messages.length})
            </span>
          </div>

          {/* Filter Chips */}
          {filterChips.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {filterChips.map((k) => {
                const selected = leadFilter === k;
                const label = k === "ALL" ? "Toate" : TYPE_LABELS[k] || k;
                return (
                  <button
                    key={k}
                    type="button"
                    data-testid={`filter-chip-${k}`}
                    onClick={() => setLeadFilter(k)}
                    className={cn(
                      "shrink-0 min-h-[44px] text-[13px] font-medium px-3 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer",
                      selected
                        ? "bg-primary border-primary text-primary-foreground font-semibold"
                        : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span>{label}</span>
                    <span
                      className={cn(
                        "text-[12px] tabular-nums",
                        selected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {counts[k]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages Bordered Container with hairline dividers */}
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {visibleMessages.length > 0 ? (
              visibleMessages.map((m: any) => {
                const cat = leadCat(m);
                return (
                  <button
                    key={m.id}
                    type="button"
                    data-testid={`message-row-${m.id}`}
                    onClick={() => setSelectedLeadId(m.id)}
                    className="w-full text-left px-4 py-3 min-h-[48px] flex flex-col gap-1.5 hover:bg-accent/40 transition-colors cursor-pointer"
                  >
                    {/* Line 1: message text truncated with relative time right-aligned */}
                    <div className="flex items-baseline justify-between gap-3 w-full">
                      <p className="text-[14px] text-foreground font-medium truncate flex-1 min-w-0">
                        {m.message || "Fără conținut."}
                      </p>
                      <span className="text-[12px] text-muted-foreground tabular-nums shrink-0">
                        {formatDistanceToNow(new Date(m.createdAt), {
                          addSuffix: true,
                          locale: ro,
                        })}
                      </span>
                    </div>

                    {/* Line 2: type pill, status (if not NEW), linked car */}
                    <div className="flex items-center gap-2 flex-wrap text-[12px]">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-medium",
                          TYPE_COLORS[m.type || cat] ||
                            TYPE_COLORS.GENERAL ||
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {TYPE_LABELS[m.type || cat] || m.type || cat}
                      </span>
                      {m.status && m.status !== "NEW" && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-medium",
                            STATUS_COLORS[m.status] || "bg-muted text-muted-foreground"
                          )}
                        >
                          {STATUS_LABELS[m.status] || m.status}
                        </span>
                      )}
                      {m.car && (
                        <div className="flex items-center gap-1 text-muted-foreground truncate min-w-0">
                          <Car className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{m.car}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-[13px] text-muted-foreground">
                Niciun lead în această categorie.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. STICKY BOTTOM ACTIONS BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur border-t border-border p-3 flex items-center gap-2.5 max-w-7xl mx-auto">
        {hasUsablePhone(customer.phone) ? (
          <Button
            asChild
            variant="outline"
            className="flex-1 min-h-[44px] h-11 border-border text-foreground font-semibold text-[14px] rounded-lg"
          >
            <a href={telLink(customer.phone)} data-testid="bottom-suna-btn">
              <Phone className="w-4 h-4 mr-1.5" />
              <span>Sună</span>
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled
            data-testid="bottom-suna-btn"
            className="flex-1 min-h-[44px] h-11 border-border text-muted-foreground font-semibold text-[14px] rounded-lg opacity-40"
          >
            <Phone className="w-4 h-4 mr-1.5" />
            <span>Sună</span>
          </Button>
        )}

        {hasUsablePhone(customer.phone) ? (
          <Button
            asChild
            className="flex-[2] min-h-[44px] h-11 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-[14px] rounded-lg border-none"
          >
            <a
              href={waLink(customer.phone, "")}
              target="_blank"
              rel="noreferrer"
              data-testid="bottom-whatsapp-btn"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              <span>WhatsApp</span>
            </a>
          </Button>
        ) : (
          <Button
            disabled
            data-testid="bottom-whatsapp-btn"
            className="flex-[2] min-h-[44px] h-11 bg-[#25D366] text-white font-semibold text-[14px] rounded-lg border-none opacity-40"
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            <span>WhatsApp</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          aria-label="Programează întâlnire"
          data-testid="bottom-appointment-btn"
          onClick={() => setCreateOpen(true)}
          className="w-11 h-11 min-h-[44px] p-0 border-border text-foreground rounded-lg flex items-center justify-center shrink-0 hover:bg-muted"
        >
          <CalendarPlus className="w-5 h-5" />
        </Button>
      </div>

      {/* MODALS & SHEETS */}
      <AppointmentWizard
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["customer", phone] })}
        customerName={customer.name || ""}
        customerPhone={customer.phone || ""}
      />
      <AppointmentEditSheet
        isOpen={editOpen}
        initial={editInitial}
        onClose={() => setEditOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["customer", phone] })}
      />
      <LeadDetailPanel
        messageId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onNavigate={(id) => setSelectedLeadId(id)}
        orderedIds={sortedMessages.map((m: any) => m.id)}
        onMessageUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["customer", phone] });
          queryClient.invalidateQueries({ queryKey: ["customers"] });
          queryClient.invalidateQueries({ queryKey: ["message-counts"] });
        }}
      />
    </div>
  );
};

export default CustomerDetailPage;

