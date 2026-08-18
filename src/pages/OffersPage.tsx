import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, Plus, User, Eye, ArrowLeft, Filter, Car, Phone } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { getOffers, createOffer, OfferItem } from "@/services/api";
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
import PickCarSheet from "@/components/modals/PickCarSheet";
import GenerateOfferModal from "@/components/modals/GenerateOfferModal";
import ShareOfferSheet from "@/components/modals/ShareOfferSheet";
import OfferDetailSheet from "@/components/modals/OfferDetailSheet";

function daysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface ShareData {
  publicUrl: string | null;
  clientPhone: string;
  carTitle: string;
  offerPrice: number;
  validityDays?: number;
}

export default function OffersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: offers = [], isLoading } = useQuery<OfferItem[]>({
    queryKey: ["offers"],
    queryFn: getOffers,
    refetchOnWindowFocus: false,
  });

  const [pickOpen, setPickOpen] = useState(false);
  const [genListing, setGenListing] = useState<any | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [share, setShare] = useState<ShareData | null>(null);
  const [detailRow, setDetailRow] = useState<OfferItem | null>(null);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [stateFilter, setStateFilter] = useState<Set<"VALABILA" | "EXPIRATA" | "VAZUTA" | "NEDESCHISA">>(new Set());
  const [carFilter, setCarFilter] = useState<string>("all");

  const hasActiveFilter = stateFilter.size > 0 || carFilter !== "all";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/listings");
    }
  };

  const distinctCars = useMemo(() => {
    const map = new Map<string, string>();
    offers.forEach((o) => {
      if (o.listingId && !map.has(o.listingId)) {
        map.set(o.listingId, o.listingTitleSnapshot || "Mașină");
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [offers]);

  const filteredOffers = useMemo(() => {
    const now = Date.now();
    return offers.filter((o) => {
      const isExpired = new Date(o.expiresAt).getTime() <= now;
      const isViewed = !isExpired && !!o.viewedAt;
      const isUnviewed = !isExpired && !o.viewedAt;
      const isValabila = !isExpired;

      let stateMatch = true;
      if (stateFilter.size > 0) {
        stateMatch =
          (stateFilter.has("VALABILA") && isValabila) ||
          (stateFilter.has("EXPIRATA") && isExpired) ||
          (stateFilter.has("VAZUTA") && isViewed) ||
          (stateFilter.has("NEDESCHISA") && isUnviewed);
      }

      const carMatch = carFilter === "all" || o.listingId === carFilter;

      return stateMatch && carMatch;
    });
  }, [offers, stateFilter, carFilter]);

  const now = Date.now();
  const valabile = filteredOffers.filter((o) => new Date(o.expiresAt).getTime() > now);
  const istoric = filteredOffers.filter((o) => new Date(o.expiresAt).getTime() <= now);

  const handlePick = (listing: any) => {
    setPickOpen(false);
    setGenListing(listing);
    setGenOpen(true);
  };

  const handleGenerate = async (data: { clientName: string; clientPhone: string; offerPrice: number; validityDays: number }) => {
    if (!genListing) return;
    try {
      const listPrice = genListing?.price ?? null;
      const created = await createOffer({
        listingId: genListing.id,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        offerPrice: data.offerPrice,
        listPrice,
        validityDays: data.validityDays,
      });
      toast.success("Ofertă generată.");
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      setShare({
        publicUrl: created.publicUrl,
        clientPhone: data.clientPhone,
        carTitle: genListing.title,
        offerPrice: data.offerPrice,
        validityDays: data.validityDays,
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Nu s-a putut genera oferta.");
    }
  };

  const openReshare = (o: OfferItem) => {
    setShare({
      publicUrl: o.publicUrl,
      clientPhone: o.clientPhone,
      carTitle: o.listingTitleSnapshot,
      offerPrice: o.offerPrice,
      validityDays: undefined,
    });
  };

  return (
    <div className="space-y-4 max-w-[390px] mx-auto md:max-w-full pb-24">
      {/* PART A: HEADER BAR */}
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
          <h1 className="text-[17px] font-medium text-foreground leading-tight">Oferte trimise</h1>
          <p className="text-[12px] text-muted-foreground leading-snug">
            {valabile.length > 0 ? roCount(valabile.length, "valabilă", "valabile") : "Prețuri trimise clienților"}
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
          type="button"
          onClick={() => setPickOpen(true)}
          className="flex items-center gap-3 w-full min-h-[60px] py-4 px-4 bg-primary/5 border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-primary bg-primary/10">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-[16px] font-semibold text-foreground leading-snug">Adaugă ofertă</div>
            <div className="text-[13px] text-muted-foreground leading-none mt-0.5">Alegi mașina, apoi client și preț</div>
          </div>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-1">
          <FileText className="w-12 h-12 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-[15px] font-medium text-foreground">Nicio ofertă încă</h3>
          <p className="text-xs text-muted-foreground mt-1">Apasă „Adaugă ofertă" ca să trimiți un preț unui client.</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-1">
          <FileText className="w-12 h-12 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-[15px] font-medium text-foreground">Nicio ofertă pentru acest filtru</h3>
          <p className="text-xs text-muted-foreground mt-1">Încearcă să schimbi starea sau mașina selectată.</p>
        </div>
      ) : (
        <>
          {valabile.length > 0 && (
            <div className="px-1">
              <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground mb-2">Valabile</p>
              <div className="flex flex-col gap-2.5">
                {valabile.map((o) => {
                  const dl = daysLeft(o.expiresAt);
                  return (
                    <div
                      key={o.id}
                      onClick={() => setDetailRow(o)}
                      className="bg-card border border-border rounded-xl p-3.5 cursor-pointer hover:border-border/80 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {o.listingImageSnapshot ? (
                          <img
                            src={o.listingImageSnapshot}
                            alt={o.listingTitleSnapshot}
                            className="w-16 h-12 rounded-lg object-cover shrink-0 border border-border"
                          />
                        ) : (
                          <div className="w-16 h-12 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                            <Car className="w-5 h-5 opacity-60" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-[15px] font-semibold text-foreground leading-snug truncate">
                              {o.listingTitleSnapshot}
                            </h3>
                            {o.viewedAt ? (
                              <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-success/15 text-success whitespace-nowrap inline-flex items-center gap-1 shrink-0">
                                <Eye className="w-3 h-3" /> Văzută
                              </span>
                            ) : (
                              <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap shrink-0">
                                Nedeschisă
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[13px] text-muted-foreground">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-foreground font-medium truncate">{o.clientName}</span>
                            {hasUsablePhone(o.clientPhone) ? (
                              <a
                                href={telLink(o.clientPhone)}
                                onClick={(e) => e.stopPropagation()}
                                className="text-primary hover:underline ml-auto shrink-0 inline-flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{formatRoPhone(o.clientPhone)}</span>
                              </a>
                            ) : (
                              <span className="text-muted-foreground shrink-0">· {o.clientPhone}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/50">
                        <span className="text-[17px] font-semibold text-foreground">{formatEur(o.offerPrice)}</span>
                        {o.listPrice && o.listPrice !== o.offerPrice ? (
                          <span className="text-[13px] text-muted-foreground line-through">{formatEur(o.listPrice)}</span>
                        ) : null}
                        <span className={cn("text-[12px] ml-auto shrink-0", dl <= 2 && dl > 0 ? "text-warning font-medium" : "text-muted-foreground")}>
                          {dl <= 0 ? "Expiră azi" : "Valabilă încă " + roCount(dl, "zi", "zile")}
                        </span>
                      </div>

                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openReshare(o);
                          }}
                          className="w-full h-11 min-h-[44px] rounded-lg border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50 transition-colors"
                        >
                          Trimite din nou
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {istoric.length > 0 && (
            <div className="px-1">
              <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground mb-2 mt-2">Istoric</p>
              <div className="flex flex-col gap-2">
                {istoric.map((o) => (
                  <div key={o.id} className="bg-card border border-border rounded-xl p-3.5 opacity-80">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-[15px] font-medium text-foreground truncate flex-1 min-w-0">
                        {o.listingTitleSnapshot}
                      </h3>
                      <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                        Expirată
                      </span>
                    </div>
                    <div className="mt-1 text-[13px] text-muted-foreground">
                      {o.clientName} · {formatEur(o.offerPrice)} · {format(new Date(o.createdAt), "dd MMM yyyy", { locale: ro })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* PART D: FILTER BOTTOM SHEET */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left pb-2 border-b border-border">
            <SheetTitle className="text-[17px] font-semibold text-foreground">
              Filtrează
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-2">Stare</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "VALABILA", label: "Valabile" },
                    { value: "EXPIRATA", label: "Expirate" },
                    { value: "VAZUTA", label: "Văzute" },
                    { value: "NEDESCHISA", label: "Nedeschise" },
                  ] as const
                ).map((item) => {
                  const isSelected = stateFilter.has(item.value);
                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => {
                        setStateFilter((prev) => {
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
                setStateFilter(new Set());
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

      <GenerateOfferModal
        isOpen={genOpen}
        onClose={() => { setGenOpen(false); setGenListing(null); }}
        listing={genListing}
        onGenerate={handleGenerate}
      />

      <ShareOfferSheet
        isOpen={!!share}
        onClose={() => setShare(null)}
        publicUrl={share?.publicUrl ?? null}
        clientPhone={share?.clientPhone ?? ""}
        carTitle={share?.carTitle ?? ""}
        offerPrice={share?.offerPrice ?? 0}
        validityDays={share?.validityDays}
      />

      <OfferDetailSheet
        row={detailRow}
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        onReshare={(o) => {
          setDetailRow(null);
          openReshare(o);
        }}
      />
    </div>
  );
}
