import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Loader2, ArrowLeft, User, Phone, Mail, MessageCircle, CalendarPlus,
  FileText, CalendarClock, BookmarkCheck, Tag, Car, ChevronRight,
  Coins, Package, ShoppingCart, RotateCcw,
} from "lucide-react";
import { getCustomer } from "@/services/api";
import { formatEur } from "@/lib/format";
import AppointmentWizard from "@/components/modals/AppointmentWizard";
import AppointmentEditSheet from "@/components/modals/AppointmentEditSheet";
import MessageDetailSheet from "@/components/modals/MessageDetailSheet";
import { formatRoPhone, telLink, waLink, hasUsablePhone } from "@/utils/phone";

const TYPE_LABELS: Record<string, string> = {
  TEST_DRIVE: "Test-drive",
  VIEWING: "Vizionare",
  HANDOVER: "Predare",
  MEETING: "Întâlnire",
  OTHER: "Altele",
};
const STATUS_LABELS: Record<string, string> = {
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
const LEAD_LABELS: Record<string, string> = {
  CONTACT: "Contact",
  FINANCING: "Finanțare",
  STOCK: "Stoc",
  ORDER: "Comandă",
  BUYBACK: "Buy-Back",
};
const LEAD_COLORS: Record<string, string> = {
  CONTACT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  FINANCING: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  STOCK: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  ORDER: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  BUYBACK: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};
const LEAD_ICON: Record<string, any> = {
  CONTACT: MessageCircle,
  FINANCING: Coins,
  STOCK: Package,
  ORDER: ShoppingCart,
  BUYBACK: RotateCcw,
};
const LEAD_ICON_WRAP: Record<string, string> = {
  CONTACT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  FINANCING: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  STOCK: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  ORDER: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  BUYBACK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};
const leadCat = (m: any): string => {
  if (m.type === "BUYBACK") return "BUYBACK";
  if (m.type === "ORDER") return "ORDER";
  if (m.type === "STOCK") return "STOCK";
  if (m.type === "FINANCING") return "FINANCING";
  return "CONTACT";
};

const fmt = (s?: string, p = "dd MMM yyyy") => {
  if (!s) return "N/A";
  try {
    return format(new Date(s), p, { locale: ro });
  } catch {
    return "N/A";
  }
};
const initials = (name?: string) => {
  const n = (name || "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/);
  return (parts[0]?.[0] || "" + (parts[1]?.[0] || "")).toUpperCase().slice(0, 2) || "?";
};

const CustomerDetailPage = () => {
  const { phone } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<any>(null);
  const [leadFilter, setLeadFilter] = useState<string>("ALL");
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgSelected, setMsgSelected] = useState<any>(null);

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
      <div className="space-y-6 pb-24">
        <button onClick={() => navigate("/customers")} className="flex items-center gap-2 text-[14px] text-muted-foreground h-11">
          <ArrowLeft className="w-4 h-4" /> Înapoi la clienți
        </button>
        <div className="text-center py-16 px-4">
          <User className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
          <h3 className="text-[16px] font-semibold text-foreground">Clientul nu a fost găsit</h3>
          <p className="text-[14px] text-muted-foreground mt-1">Nu s-au putut prelua detaliile pentru acest număr.</p>
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

  const email = (messages.find((m: any) => m.email)?.email as string) || "";

  const leadTypesPresent = Array.from(
    new Set(sortedMessages.map((m: any) => leadCat(m)))
  ).filter((t) => t !== "CONTACT" || sortedMessages.every((m: any) => leadCat(m) === "CONTACT"));

  const carsOfInterest = Array.from(
    new Set(sortedMessages.map((m: any) => m.car).filter(Boolean))
  ).slice(0, 3);

  const totalInteractions = contracts.length + reservations.length + offers.length + appointments.length + messages.length;

  const counts: Record<string, number> = {
    ALL: sortedMessages.length,
    CONTACT: sortedMessages.filter((m: any) => leadCat(m) === "CONTACT").length,
    FINANCING: sortedMessages.filter((m: any) => leadCat(m) === "FINANCING").length,
    STOCK: sortedMessages.filter((m: any) => leadCat(m) === "STOCK").length,
    ORDER: sortedMessages.filter((m: any) => leadCat(m) === "ORDER").length,
    BUYBACK: sortedMessages.filter((m: any) => leadCat(m) === "BUYBACK").length,
  };
  const filterChips = ["ALL", "CONTACT", "FINANCING", "STOCK", "ORDER", "BUYBACK"].filter(
    (k) => k === "ALL" || counts[k] > 0
  );
  const visibleMessages = leadFilter === "ALL" ? sortedMessages : sortedMessages.filter((m: any) => leadCat(m) === leadFilter);

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

  const stats: { n: number; label: string }[] = [];
  if (messages.length) stats.push({ n: messages.length, label: messages.length === 1 ? "mesaj" : "mesaje" });
  if (appointments.length) stats.push({ n: appointments.length, label: appointments.length === 1 ? "programare" : "programări" });
  if (offers.length) stats.push({ n: offers.length, label: offers.length === 1 ? "ofertă" : "oferte" });
  if (contracts.length) stats.push({ n: contracts.length, label: contracts.length === 1 ? "contract" : "contracte" });

  return (
    <div className="space-y-4 pb-24">
      <button onClick={() => navigate("/customers")} className="flex items-center gap-2 text-[14px] text-muted-foreground h-11">
        <ArrowLeft className="w-4 h-4" /> Înapoi la clienți
      </button>

      {/* IDENTITY */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-primary/10 flex items-center justify-center text-[19px] font-semibold text-primary">
            {initials(customer.name)}
          </div>
          <div className="min-w-0">
            <h1 className="text-[19px] font-semibold text-foreground leading-tight truncate">{customer.name || "Nume necunoscut"}</h1>
            <p className="text-[13px] text-muted-foreground">
              {totalInteractions} {totalInteractions === 1 ? "interacțiune" : "interacțiuni"}
            </p>
          </div>
        </div>

        {hasUsablePhone(customer.phone) ? (
          <a href={telLink(customer.phone)} className="flex items-center gap-2.5 py-2.5 text-[14px] text-primary">
            <Phone className="w-4 h-4 shrink-0" /> {formatRoPhone(customer.phone)}
          </a>
        ) : (
          <div className="flex items-center gap-2.5 py-2.5 text-[14px] text-muted-foreground">
            <Phone className="w-4 h-4 shrink-0" /> Fără telefon
          </div>
        )}
        {email && (
          <a href={"mailto:" + email} className="flex items-center gap-2.5 py-2.5 text-[14px] text-primary border-t border-border truncate">
            <Mail className="w-4 h-4 shrink-0" /> <span className="truncate">{email}</span>
          </a>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3">
          {hasUsablePhone(customer.phone) ? (
            <a href={telLink(customer.phone)} className="py-2.5 rounded-xl bg-primary text-primary-foreground flex flex-col items-center gap-1">
              <Phone className="w-5 h-5" /> <span className="text-[12px] font-medium">Sună</span>
            </a>
          ) : (
            <div className="py-2.5 rounded-xl bg-primary text-primary-foreground flex flex-col items-center gap-1 opacity-40 pointer-events-none">
              <Phone className="w-5 h-5" /> <span className="text-[12px] font-medium">Sună</span>
            </div>
          )}
          {hasUsablePhone(customer.phone) ? (
            <a href={waLink(customer.phone, "")} target="_blank" rel="noreferrer" className="py-2.5 rounded-xl border border-border bg-background flex flex-col items-center gap-1">
              <MessageCircle className="w-5 h-5 text-green-600" /> <span className="text-[12px] font-medium text-foreground">WhatsApp</span>
            </a>
          ) : (
            <div className="py-2.5 rounded-xl border border-border bg-background flex flex-col items-center gap-1 opacity-40 pointer-events-none">
              <MessageCircle className="w-5 h-5 text-green-600" /> <span className="text-[12px] font-medium text-foreground">WhatsApp</span>
            </div>
          )}
          <button onClick={() => setCreateOpen(true)} className="py-2.5 rounded-xl border border-border bg-background flex flex-col items-center gap-1">
            <CalendarPlus className="w-5 h-5 text-foreground" /> <span className="text-[12px] font-medium text-foreground">Programare</span>
          </button>
        </div>
      </div>

      {/* WHAT THEY WANT NOW */}
      {(leadTypesPresent.length > 0 || carsOfInterest.length > 0) && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ce vrea acum</p>
          {leadTypesPresent.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {leadTypesPresent.map((t) => (
                <span key={t} className={"text-[12px] font-medium px-2.5 py-0.5 rounded-full " + (LEAD_COLORS[t] || "")}>
                  {LEAD_LABELS[t] || t}
                </span>
              ))}
            </div>
          )}
          {carsOfInterest.length > 0 && (
            <div className="flex items-start gap-2 text-[14px]">
              <Car className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Interesat de: <span className="text-foreground font-medium">{carsOfInterest.join(", ")}</span></span>
            </div>
          )}
        </div>
      )}

      {/* QUICK STATS */}
      {stats.length > 0 && (
        <div className="flex gap-2">
          {stats.map((s, i) => (
            <div key={i} className="flex-1 text-center py-2.5 rounded-xl bg-muted/60">
              <p className="text-[20px] font-semibold text-foreground leading-none">{s.n}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* CONTRACTS */}
      {contracts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Contracte ({contracts.length})</span>
          </div>
          <div className="divide-y divide-border">
            {contracts.map((c: any) => (
              <div key={c.id || c.contractNumber} className="px-4 py-3">
                <p className="text-[15px] font-medium text-foreground truncate">#{c.contractNumber} · {c.car || "Vehicul fără titlu"}</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">{formatEur(c.salePrice)} · {fmt(c.saleDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESERVATIONS */}
      {reservations.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
            <BookmarkCheck className="w-4 h-4 text-amber-500" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Rezervări ({reservations.length})</span>
          </div>
          <div className="divide-y divide-border">
            {reservations.map((r: any) => (
              <div key={r.id} className="px-4 py-3">
                <p className="text-[15px] font-medium text-foreground truncate">{r.car || "Vehicul fără titlu"}</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">{formatEur(r.depositAmount)} avans · {fmt(r.createdAt)} · {RES_STATUS_LABELS[r.status] || r.status || "N/A"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OFFERS */}
      {offers.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
            <Tag className="w-4 h-4 text-indigo-500" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Oferte trimise ({offers.length})</span>
          </div>
          <div className="divide-y divide-border">
            {offers.map((o: any) => {
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
                <div key={o.id} className="px-4 py-3 flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-foreground truncate">{o.car || "Vehicul fără titlu"}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{fmt(o.createdAt)} · <span className={stateCls}>{stateText}</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-semibold text-foreground">{formatEur(o.offerPrice)}</p>
                    {o.listPrice && o.listPrice > o.offerPrice && (
                      <p className="text-[12px] text-muted-foreground line-through">{formatEur(o.listPrice)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* APPOINTMENTS (tap -> edit) */}
      {appointments.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
            <CalendarClock className="w-4 h-4 text-teal-500" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Programări ({appointments.length})</span>
          </div>
          <div className="divide-y divide-border">
            {appointments.map((a: any) => (
              <button key={a.id} onClick={() => openEdit(a)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-foreground truncate">{a.title || "Programare"}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    {TYPE_LABELS[a.type] || a.type} · {fmt(a.startAt, "dd MMM, HH:mm")} · {STATUS_LABELS[a.status] || a.status}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MESSAGES */}
      {messages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-purple-500" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Mesaje & lead-uri ({messages.length})</span>
          </div>

          {filterChips.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {filterChips.map((k) => {
                const selected = leadFilter === k;
                const label = k === "ALL" ? "Toate" : LEAD_LABELS[k];
                return (
                  <button
                    key={k}
                    onClick={() => setLeadFilter(k)}
                    className={
                      "shrink-0 text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-colors " +
                      (selected ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground")
                    }
                  >
                    {label} {counts[k]}
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-2.5">
            {visibleMessages.length > 0 ? (
              visibleMessages.map((m: any) => {
                const cat = leadCat(m);
                const Icon = LEAD_ICON[cat] || MessageCircle;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setMsgSelected(m); setMsgOpen(true); }}
                    className="w-full text-left bg-card border border-border rounded-xl p-3 flex gap-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className={"w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 " + (LEAD_ICON_WRAP[cat] || "")}>
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={"text-[13px] font-medium " + (cat === "FINANCING" ? "text-green-700 dark:text-green-300" : cat === "ORDER" ? "text-indigo-700 dark:text-indigo-300" : cat === "STOCK" ? "text-purple-700 dark:text-purple-300" : cat === "BUYBACK" ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300")}>{LEAD_LABELS[cat]}</span>
                        <span className="text-[12px] text-muted-foreground ml-auto shrink-0">{fmt(m.createdAt, "dd MMM, HH:mm")}</span>
                      </div>
                      <p className="text-[14px] text-foreground leading-relaxed line-clamp-2">{m.message || "Fără conținut."}</p>
                      {m.car && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-muted-foreground">
                          <Car className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{m.car}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-[14px] text-muted-foreground text-center py-4">Niciun lead în această categorie.</p>
            )}
          </div>
        </div>
      )}

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
      <MessageDetailSheet
        isOpen={msgOpen}
        message={msgSelected}
        customerPhone={customer.phone || ""}
        onClose={() => setMsgOpen(false)}
      />
    </div>
  );
};

export default CustomerDetailPage;
