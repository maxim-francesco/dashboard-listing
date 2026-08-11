import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ArrowLeft, 
  FileText, 
  CalendarClock, 
  MessageSquare, 
  BookmarkCheck,
  User,
  Phone,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { getCustomer } from "@/services/api";
import { formatEur } from "@/lib/format";
import { roCount } from "@/lib/plural";
import { relativeTime } from "@/lib/relativeTime";
import AppointmentModal from "@/components/modals/AppointmentModal";

const TYPE_LABELS: Record<string, string> = {
  TEST_DRIVE: 'Test-drive',
  VIEWING: 'Vizionare',
  HANDOVER: 'Predare',
  MEETING: 'Întâlnire',
  OTHER: 'Altele',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programată',
  COMPLETED: 'Finalizată',
  CANCELLED: 'Anulată',
};

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activă',
  COMPLETED: 'Finalizată',
  CANCELLED: 'Anulată',
  EXPIRED: 'Expirată',
};

const LEAD_CAT_LABELS = { 
  CONTACT: "Contact", 
  FINANCING: "Finanțare", 
  STOCK: "Stoc", 
  ORDER: "Comandă", 
  BUYBACK: "Buy-Back" 
};

const LEAD_CAT_COLORS = { 
  CONTACT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", 
  FINANCING: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", 
  STOCK: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", 
  ORDER: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300", 
  BUYBACK: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" 
};

const getLeadCategory = (m: any): keyof typeof LEAD_CAT_LABELS => {
  if (m.type === "BUYBACK") return "BUYBACK";
  if (m.type === "ORDER") return "ORDER";
  if (m.type === "STOCK") return "STOCK";
  if (m.type === "FINANCING") return "FINANCING";
  return "CONTACT";
};

const CustomerDetailPage = () => {
  const { phone } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [leadFilter, setLeadFilter] = useState<string>("ALL");

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ['customer', phone],
    queryFn: () => getCustomer(phone!),
    enabled: !!phone,
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateStr?: string, pattern: string = "dd MMM yyyy") => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), pattern, { locale: ro });
    } catch (e) {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Se încarcă istoricul clientului...</p>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/customers')} className="h-11 gap-2">
          <ArrowLeft className="w-4 h-4" /> Înapoi la clienți
        </Button>
        <Card className="border-card-border bg-card max-w-md mx-auto text-center py-10">
          <CardContent className="space-y-4">
            <User className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">Clientul nu a fost găsit</h3>
            <p className="text-sm text-muted-foreground">
              Nu s-au putut prelua detaliile pentru acest număr de telefon sau clientul nu mai există.
            </p>
            <Button onClick={() => navigate('/customers')}>Înapoi la listă</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contracts = customer.contracts ?? [];
  const reservations = customer.reservations ?? [];
  const offers = customer.offers ?? [];
  const appointments = customer.appointments ?? [];
  const messages = customer.messages ?? [];

  const sortedMessages = [...messages].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const counts = {
    ALL: sortedMessages.length,
    CONTACT: sortedMessages.filter((m: any) => getLeadCategory(m) === "CONTACT").length,
    FINANCING: sortedMessages.filter((m: any) => getLeadCategory(m) === "FINANCING").length,
    STOCK: sortedMessages.filter((m: any) => getLeadCategory(m) === "STOCK").length,
    ORDER: sortedMessages.filter((m: any) => getLeadCategory(m) === "ORDER").length,
    BUYBACK: sortedMessages.filter((m: any) => getLeadCategory(m) === "BUYBACK").length,
  };

  const visibleMessages = leadFilter === "ALL" 
    ? sortedMessages 
    : sortedMessages.filter((m: any) => getLeadCategory(m) === leadFilter);

  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart.getTime() + 60 * 60 * 1000);

  return (
    <div className="space-y-6 pb-24">
      {/* Back navigation */}
      <Button variant="outline" onClick={() => navigate('/customers')} className="border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground gap-2 h-11">
        <ArrowLeft className="w-4 h-4" /> Înapoi la clienți
      </Button>

      {/* Header Profile */}
      <div>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">
          {customer.name || "Nume necunoscut"}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {(() => {
            const subtitleParts: string[] = [];
            if (contracts.length > 0) subtitleParts.push(roCount(contracts.length, "contract", "contracte"));
            if (reservations.length > 0) subtitleParts.push(roCount(reservations.length, "rezervare", "rezervări"));
            if (offers.length > 0) subtitleParts.push(roCount(offers.length, "ofertă", "oferte"));
            if (appointments.length > 0) subtitleParts.push(roCount(appointments.length, "programare", "programări"));
            if (messages.length > 0) subtitleParts.push(roCount(messages.length, "mesaj", "mesaje"));

            return [customer.phone, ...subtitleParts].filter(Boolean).join(" · ");
          })()}
        </p>
      </div>

      {/* Action Buttons Card */}
      <Card className="border-card-border bg-card">
        <CardContent className="pt-6">
          <div className="flex gap-2 w-full">
            <a
              href={`tel:+${customer.phone}`}
              className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-medium min-h-[52px]"
            >
              <Phone className="w-5 h-5 shrink-0" />
              <span>Sună</span>
            </a>
            <button
              onClick={() => setModalOpen(true)}
              className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border-strong text-foreground text-xs font-medium min-h-[52px]"
            >
              <Calendar className="w-5 h-5 shrink-0" />
              <span>Programare</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 1. CONTRACTS SECTION */}
      {contracts.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <FileText className="w-4 h-4 text-blue-500" />
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Contracte de Vânzare ({contracts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {contracts.map((c: any) => (
                <div key={c.id || c.contractNumber} className="py-3 px-4 min-h-[52px]">
                  <div className="text-[15px] font-medium text-foreground truncate">
                    #{c.contractNumber} · {c.car || "Vehicul fără titlu"}
                  </div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">
                    {formatEur(c.salePrice)} · {formatDate(c.saleDate)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. RESERVATIONS SECTION */}
      {reservations.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <BookmarkCheck className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Rezervări înregistrate ({reservations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {reservations.map((r: any) => (
                <div key={r.id} className="py-3 px-4 min-h-[52px]">
                  <div className="text-[15px] font-medium text-foreground truncate">
                    {r.car || "Vehicul fără titlu"}
                  </div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">
                    {formatEur(r.depositAmount)} avans · {formatDate(r.createdAt)} · {RESERVATION_STATUS_LABELS[r.status] || r.status || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2.5. OFFERS SECTION */}
      {offers.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <FileText className="w-4 h-4 text-indigo-500" />
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Oferte trimise ({offers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {offers.map((o: any) => {
                const getOfferStateText = (offer: any) => {
                  if (offer.viewedAt) {
                    return `văzută ${relativeTime(offer.viewedAt)}`;
                  }
                  if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) {
                    return "expirată";
                  }
                  return "trimisă, nedeschisă";
                };
                return (
                  <div key={o.id} className="flex justify-between items-start py-3 px-4 min-h-[52px]">
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-medium text-foreground truncate">
                        {o.car || "Vehicul fără titlu"}
                      </div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">
                        {formatDate(o.createdAt, "dd MMM yyyy")} · <span className={o.viewedAt ? "text-success" : (o.expiresAt && new Date(o.expiresAt) < new Date()) ? "text-destructive" : "text-muted-foreground"}>{getOfferStateText(o)}</span>
                      </div>
                    </div>
                    <div className="text-[15px] font-semibold text-foreground shrink-0 pl-3">
                      {formatEur(o.offerPrice)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. APPOINTMENTS SECTION */}
      {appointments.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <CalendarClock className="w-4 h-4 text-teal-500" />
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Programări în Calendar ({appointments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {appointments.map((a: any) => (
                <div key={a.id} className="py-3 px-4 min-h-[52px]">
                  <div className="text-[15px] font-medium text-foreground truncate">
                    {a.title || "Programare"}
                  </div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">
                    {TYPE_LABELS[a.type] || a.type || "Altele"} · {formatDate(a.startAt, "dd MMM yyyy, HH:mm")} · {STATUS_LABELS[a.status] || a.status || "Programată"}
                  </div>
                  {a.notes && (
                    <div className="text-[12px] text-muted-foreground/80 mt-1">
                      {a.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. MESSAGES SECTION */}
      {messages.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex flex-row items-center gap-3">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Mesaje și Lead-uri ({messages.length})</CardTitle>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "ALL", label: "Toate" },
                { key: "CONTACT", label: "Contact" },
                { key: "FINANCING", label: "Finanțare" },
                { key: "STOCK", label: "Stoc" },
                { key: "ORDER", label: "Comandă" },
                { key: "BUYBACK", label: "Buy-Back" }
              ].map((cat) => {
                const count = counts[cat.key as keyof typeof counts];
                const isSelected = leadFilter === cat.key;
                if (cat.key !== "ALL" && count === 0) return null;
                return (
                  <Button
                    key={cat.key}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setLeadFilter(cat.key)}
                    className="w-full min-h-[52px] text-sm font-medium justify-center"
                  >
                    {cat.label} ({count})
                  </Button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {visibleMessages.length > 0 ? (
              visibleMessages.map((m: any) => {
                const cat = getLeadCategory(m);
                return (
                  <div key={m.id} className="p-5 rounded-lg border border-border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{formatDate(m.createdAt, "dd MMM yyyy, HH:mm")}</span>
                        <Badge className={`text-xs py-0.5 font-normal ${LEAD_CAT_COLORS[cat]}`}>
                          {LEAD_CAT_LABELS[cat]}
                        </Badge>
                      </div>
                      {m.car && (
                        <span className="text-sm font-semibold text-muted-foreground truncate max-w-xs">
                          Vehicul de interes: {m.car}
                        </span>
                      )}
                    </div>
                    <p className="text-base leading-relaxed text-foreground italic">
                      {m.message || m.content || m.text || "Fără conținut textual."}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-base text-muted-foreground text-center py-4">Niciun lead în această categorie.</p>
            )}
          </CardContent>
        </Card>
      )}

      <AppointmentModal
        isOpen={modalOpen}
        mode="create"
        initial={{
          clientName: customer.name || "",
          clientPhone: customer.phone || "",
          type: 'OTHER',
          startAt: tomorrowStart.toISOString(),
          endAt: tomorrowEnd.toISOString(),
        }}
        onClose={() => setModalOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['customer', phone] })}
      />
    </div>
  );
};

export default CustomerDetailPage;
