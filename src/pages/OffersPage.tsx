import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, Plus, User, Eye } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { getOffers, createOffer, OfferItem } from "@/services/api";
import { roCount } from "@/lib/plural";
import PickCarSheet from "@/components/modals/PickCarSheet";
import GenerateOfferModal from "@/components/modals/GenerateOfferModal";
import ShareOfferSheet from "@/components/modals/ShareOfferSheet";

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

  const now = Date.now();
  const valabile = offers.filter((o) => new Date(o.expiresAt).getTime() > now);
  const istoric = offers.filter((o) => new Date(o.expiresAt).getTime() <= now);

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

  const priceFmt = (n: number) => new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(n || 0) + " €";

  return (
    <div className="space-y-4 max-w-[390px] mx-auto md:max-w-full pb-24">
      <div className="px-1 pt-1">
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Oferte trimise</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {valabile.length > 0 ? roCount(valabile.length, "valabilă", "valabile") : "Prețuri trimise clienților"}
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
      ) : (
        <>
          {valabile.length > 0 && (
            <div className="px-1">
              <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground mb-2">Valabile</p>
              <div className="flex flex-col gap-2.5">
                {valabile.map((o) => {
                  const dl = daysLeft(o.expiresAt);
                  return (
                    <div key={o.id} className="bg-card border border-border rounded-xl p-3.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-[16px] font-semibold text-foreground leading-snug flex-1 min-w-0">
                          {o.listingTitleSnapshot}
                        </h3>
                        {o.viewedAt ? (
                          <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-success/15 text-success whitespace-nowrap inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Văzută
                          </span>
                        ) : (
                          <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                            Nedeschisă
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[14px] text-muted-foreground">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="text-foreground">{o.clientName}</span>
                        <span className="text-muted-foreground">· {o.clientPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[18px] font-semibold text-foreground">{priceFmt(o.offerPrice)}</span>
                        {o.listPrice ? (
                          <span className="text-[13px] text-muted-foreground line-through">{priceFmt(o.listPrice)}</span>
                        ) : null}
                        <span className="text-[12px] text-muted-foreground ml-auto">
                          {dl <= 0 ? "Expiră azi" : "Valabilă încă " + roCount(dl, "zi", "zile")}
                        </span>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => openReshare(o)}
                          className="w-full h-10 rounded-lg border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50"
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
                      {o.clientName} · {priceFmt(o.offerPrice)} · {format(new Date(o.createdAt), "dd MMM yyyy", { locale: ro })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

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
    </div>
  );
}
