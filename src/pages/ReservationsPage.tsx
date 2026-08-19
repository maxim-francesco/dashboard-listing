import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CalendarClock, Plus, User, Phone, Coins, ArrowLeft, Filter } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ReserveModal from "@/components/modals/ReserveModal";
import MarkAsSoldModal from "@/components/modals/MarkAsSoldModal";
import PickCarSheet from "@/components/modals/PickCarSheet";
import ExtendReservationSheet from "@/components/modals/ExtendReservationSheet";
import ReservationDetailSheet from "@/components/modals/ReservationDetailSheet";
import { daysLeft } from "@/lib/date";

function getBadgeProps(dl: number) {
  if (dl <= 0) {
    return {
      className: "bg-destructive/10 text-destructive",
      label: "Expiră azi",
    };
  }
  if (dl <= 2) {
    return {
      className: "bg-warning-light text-warning",
      label: "Expiră în " + roCount(dl, "zi", "zile"),
    };
  }
  return {
    className: "bg-muted text-muted-foreground",
    label: "Expiră în " + roCount(dl, "zi", "zile"),
  };
}

export default function ReservationsPage() {
  const navigate = useNavigate();
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
  const [detailRow, setDetailRow] = useState<ReservationItem | null>(null);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<ReservationItem["status"]>>(new Set());
  const [carFilter, setCarFilter] = useState<string>("all");
  const hasActiveFilter = statusFilter.size > 0 || carFilter !== "all";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/listings");
    }
  };

  const openDetails = (row: ReservationItem) => {
    setDetailRow(row);
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    queryClient.invalidateQueries({ queryKey: ["stock-counts"] });
  };

  const distinctCars = useMemo(() => {
    const map = new Map<string, string>();
    reservations.forEach((r) => {
      if (r.listingId && !map.has(r.listingId)) {
        map.set(r.listingId, r.listing?.title || "Mașină");
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const statusOk = statusFilter.size === 0 || statusFilter.has(r.status);
      const carOk = carFilter === "all" || r.listingId === carFilter;
      return statusOk && carOk;
    });
  }, [reservations, statusFilter, carFilter]);

  const active = filteredReservations
    .filter((r) => r.status === "ACTIVE")
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  const history = filteredReservations.filter((r) => r.status !== "ACTIVE");

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
      <div className="flex items-center gap-2.5 px-1 py-1">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Înapoi"
          className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center border border-border rounded-lg text-foreground hover:bg-accent/50 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-medium text-foreground leading-tight">Rezervări</h1>
          <p className="text-[12px] text-muted-foreground leading-snug">
            {active.length > 0 ? roCount(active.length, "activă", "active") : "Mașini ținute cu avans"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Filtrează"
          onClick={() => setFilterOpen(true)}
          className={cn(
            "w-9 h-9 min-h-[44px] min-w-[44px] border rounded-lg flex items-center justify-center shrink-0 transition-colors ml-auto",
            hasActiveFilter
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-foreground hover:bg-accent/50"
          )}
        >
          <Filter className="w-4 h-4" />
        </button>
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
      ) : filteredReservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-1">
          <CalendarClock className="w-12 h-12 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-[15px] font-medium text-foreground">Nicio rezervare pentru acest filtru</h3>
          <p className="text-xs text-muted-foreground mt-1">Încearcă să schimbi statusul sau mașina selectată.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="px-1">
              <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground mb-2">Active</p>
              <div className="flex flex-col gap-2.5">
                {active.map((row) => {
                  const dl = daysLeft(row.expiresAt);
                  const badge = getBadgeProps(dl);
                  return (
                    <div
                      key={row.id}
                      onClick={() => openDetails(row)}
                      className="bg-card border border-border rounded-xl p-3.5 cursor-pointer hover:border-border/80 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-[16px] font-semibold text-foreground leading-snug flex-1 min-w-0">
                          {row.listingId ? (
                            <Link
                              to={`/listings/${row.listingId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                            >
                              {row.listing?.title || "Mașină"}
                            </Link>
                          ) : (
                            row.listing?.title || "Mașină"
                          )}
                        </h3>
                        <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[14px] text-muted-foreground">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="text-foreground">{row.clientName}</span>
                        {hasUsablePhone(row.clientPhone) && (
                          <a
                            href={telLink(row.clientPhone)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary ml-auto inline-flex items-center gap-1 hover:underline"
                          >
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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExtendRow(row);
                          }}
                          className="flex-1 h-11 min-h-[44px] rounded-lg border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50"
                        >
                          Prelungește
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(row);
                          }}
                          className="flex-1 h-11 min-h-[44px] rounded-lg border border-destructive/40 bg-card text-destructive text-[14px] font-medium hover:bg-destructive/10"
                        >
                          Anulează
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSoldRow(row);
                          }}
                          className="flex-1 h-11 min-h-[44px] rounded-lg border border-success/40 bg-success/10 text-success text-[14px] font-medium hover:bg-success/20"
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

      {/* FILTER BOTTOM SHEET */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left pb-2 border-b border-border">
            <SheetTitle className="text-[17px] font-semibold text-foreground">
              Filtrează
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "ACTIVE", label: "Active" },
                    { value: "COMPLETED", label: "Finalizate" },
                    { value: "CANCELLED", label: "Anulate" },
                    { value: "EXPIRED", label: "Expirate" },
                  ] as const
                ).map((item) => {
                  const isSelected = statusFilter.has(item.value);
                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => {
                        setStatusFilter((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.value)) {
                            next.delete(item.value);
                          } else {
                            next.add(item.value);
                          }
                          return next;
                        });
                      }}
                      className={`min-h-[44px] px-3.5 py-2 rounded-full border text-[13px] font-medium transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-2">Mașină</p>
              <select
                value={carFilter}
                onChange={(e) => setCarFilter(e.target.value)}
                className="w-full h-11 min-h-[44px] px-3 bg-card border border-border rounded-xl text-foreground text-[14px] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Toate mașinile</option>
                {distinctCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setStatusFilter(new Set());
                setCarFilter("all");
              }}
              className="flex-1 h-11 min-h-[44px] rounded-xl border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50 transition-colors"
            >
              Resetează
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="flex-1 h-11 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 transition-colors"
            >
              Aplică
            </button>
          </div>
        </SheetContent>
      </Sheet>

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

      <ReservationDetailSheet
        row={detailRow}
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        onExtend={(r) => {
          setDetailRow(null);
          setExtendRow(r);
        }}
        onCancel={(r) => {
          setDetailRow(null);
          handleCancel(r);
        }}
        onSold={(r) => {
          setDetailRow(null);
          setSoldRow(r);
        }}
      />
    </div>
  );
}


