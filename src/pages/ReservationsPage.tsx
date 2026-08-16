import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CalendarClock, Plus, User, Phone, Coins } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "react-hot-toast";
import {
  getReservations,
  cancelReservation,
  extendReservation,
  createReservation,
  ReservationItem,
} from "@/services/api";
import { roCount } from "@/lib/plural";
import { formatEur } from "@/lib/format";
import { telLink, formatRoPhone, hasUsablePhone } from "@/utils/phone";
import ReserveModal from "@/components/modals/ReserveModal";
import MarkAsSoldModal from "@/components/modals/MarkAsSoldModal";
import PickCarSheet from "@/components/modals/PickCarSheet";
import ExtendReservationSheet from "@/components/modals/ExtendReservationSheet";

function daysLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const { data: reservations = [], isLoading } = useQuery<ReservationItem[]>({
    queryKey: ["reservations"],
    queryFn: getReservations,
    refetchOnWindowFocus: false,
  });

  const [pickOpen, setPickOpen] = useState(false);
  const [reserveListing, setReserveListing] = useState<any | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [extendRow, setExtendRow] = useState<ReservationItem | null>(null);
  const [soldRow, setSoldRow] = useState<ReservationItem | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    queryClient.invalidateQueries({ queryKey: ["stock-counts"] });
  };

  const active = reservations
    .filter((r) => r.status === "ACTIVE")
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  const history = reservations.filter((r) => r.status !== "ACTIVE");

  const handlePick = (listing: any) => {
    setPickOpen(false);
    setReserveListing(listing);
    setReserveOpen(true);
  };

  const handleCreate = async (data: { clientName: string; clientPhone: string; depositAmount: number; reservationDays: number }) => {
    if (!reserveListing) return;
    try {
      await createReservation({ listingId: reserveListing.id, ...data });
      toast.success("Mașina a fost rezervată.");
      refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Nu s-a putut crea rezervarea.");
    }
  };

  const handleCancel = async (row: ReservationItem) => {
    if (!window.confirm("Anulezi rezervarea? Mașina redevine disponibilă.")) return;
    try {
      await cancelReservation(row.id);
      toast.success("Rezervare anulată. Mașina este din nou disponibilă.");
      refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Nu s-a putut anula rezervarea.");
    }
  };

  const handleExtend = async (days: number) => {
    if (!extendRow) return;
    try {
      await extendReservation(extendRow.id, days);
      toast.success("Rezervare prelungită cu " + days + " zile.");
      refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Nu s-a putut prelungi rezervarea.");
    } finally {
      setExtendRow(null);
    }
  };

  const statusLabel = (s: string) => {
    if (s === "COMPLETED") return "Finalizată";
    if (s === "CANCELLED") return "Anulată";
    if (s === "EXPIRED") return "Expirată";
    return s;
  };

  return (
    <div className="space-y-4 max-w-[390px] mx-auto md:max-w-full pb-24">
      <div className="px-1 pt-1">
        <Link to="/listings" className="inline-flex items-center text-[13px] text-primary hover:underline mb-1">
          ← Toate categoriile
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Rezervări</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {active.length > 0 ? roCount(active.length, "activă", "active") : "Mașini ținute cu avans"}
        </p>
      </div>

      <div className="px-1">
        <button
          onClick={() => setPickOpen(true)}
          className="flex items-center gap-3 w-full min-h-[60px] py-4 px-4 bg-primary/5 border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-primary bg-primary/10">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-[16px] font-semibold text-foreground leading-snug">Adaugă rezervare</div>
            <div className="text-[13px] text-muted-foreground leading-none mt-0.5">Alegi mașina, apoi clientul</div>
          </div>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-1">
          <CalendarClock className="w-12 h-12 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-[15px] font-medium text-foreground">Nicio rezervare încă</h3>
          <p className="text-xs text-muted-foreground mt-1">Apasă „Adaugă rezervare" ca să ții o mașină cu avans.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="px-1">
              <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground mb-2">Active</p>
              <div className="flex flex-col gap-2.5">
                {active.map((row) => {
                  const dl = daysLeft(row.expiresAt);
                  const urgent = dl <= 2;
                  return (
                    <div key={row.id} className="bg-card border border-border rounded-xl p-3.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-[16px] font-semibold text-foreground leading-snug flex-1 min-w-0">
                          {row.listing?.title || "Mașină"}
                        </h3>
                        <span className={"text-[12px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap " + (urgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                          {dl <= 0 ? "Expiră azi" : "Expiră în " + roCount(dl, "zi", "zile")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[14px] text-muted-foreground">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="text-foreground">{row.clientName}</span>
                        {hasUsablePhone(row.clientPhone) && (
                          <a href={telLink(row.clientPhone)} className="text-primary ml-auto inline-flex items-center gap-1">
                            <Phone className="w-4 h-4" /> {formatRoPhone(row.clientPhone)}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[14px] text-muted-foreground">
                        <Coins className="w-4 h-4 shrink-0" />
                        <span>Avans {formatEur(row.depositAmount)}</span>
                        <span className="ml-auto text-[12px]">din {format(new Date(row.startDate), "dd MMM", { locale: ro })}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setExtendRow(row)}
                          className="flex-1 h-10 rounded-lg border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50"
                        >
                          Prelungește
                        </button>
                        <button
                          onClick={() => handleCancel(row)}
                          className="flex-1 h-10 rounded-lg border border-destructive/40 bg-card text-destructive text-[14px] font-medium hover:bg-destructive/10"
                        >
                          Anulează
                        </button>
                        <button
                          onClick={() => setSoldRow(row)}
                          className="flex-1 h-10 rounded-lg border border-success/40 bg-success/10 text-success text-[14px] font-medium hover:bg-success/20"
                        >
                          Vândut
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="px-1">
              <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground mb-2 mt-2">Istoric</p>
              <div className="flex flex-col gap-2">
                {history.map((row) => (
                  <div key={row.id} className="bg-card border border-border rounded-xl p-3.5 opacity-80">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-[15px] font-medium text-foreground truncate flex-1 min-w-0">
                        {row.listing?.title || "Mașină"}
                      </h3>
                      <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                        {statusLabel(row.status)}
                      </span>
                    </div>
                    <div className="mt-1 text-[13px] text-muted-foreground">
                      {row.clientName} · {format(new Date(row.startDate), "dd MMM yyyy", { locale: ro })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <PickCarSheet isOpen={pickOpen} onClose={() => setPickOpen(false)} onPick={handlePick} />

      <ReserveModal
        isOpen={reserveOpen}
        onClose={() => { setReserveOpen(false); setReserveListing(null); }}
        listing={reserveListing}
        onSubmit={handleCreate}
      />

      <ExtendReservationSheet
        isOpen={!!extendRow}
        onClose={() => setExtendRow(null)}
        carTitle={extendRow?.listing?.title || "Mașină"}
        onConfirm={handleExtend}
      />

      {soldRow && (
        <MarkAsSoldModal
          isOpen={!!soldRow}
          onClose={() => { setSoldRow(null); refresh(); }}
          listingId={soldRow.listing?.id || ""}
          listingTitle={soldRow.listing?.title || "Mașină"}
        />
      )}
    </div>
  );
}
