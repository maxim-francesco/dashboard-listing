import { useState, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Car, Plus, SlidersHorizontal, Check } from "lucide-react";
import {
  browseTradeListings,
  getMyTradeListings,
  getSlowStock,
  getNegotiations,
  exposeTradeListing,
  updateTradeListing,
  unexposeTradeListing,
  getOrCreateConversation,
  TradeListing,
  SlowStockItem,
  NegotiationSummary,
} from "@/services/api";
import { roCount } from "@/lib/plural";
import { toast } from "react-hot-toast";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";
import NetworkHeader from "@/components/network/NetworkHeader";
import TradeCarRow from "@/components/network/TradeCarRow";
import TradeCarDetailSheet from "@/components/network/TradeCarDetailSheet";
import { CARD } from "@/components/today/cardRecipe";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Reusable modals
import SelectCarToExposeModal from "@/components/modals/SelectCarToExposeModal";
import ExposeTradeModal from "@/components/modals/ExposeTradeModal";
import MakeOfferModal from "@/components/modals/MakeOfferModal";
import NegotiationDetailModal from "@/components/modals/NegotiationDetailModal";

export default function NetworkCars() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Segment: "colegi" (De la colegi) | "alemele" (Ale mele)
  const [activeSegment, setActiveSegment] = useState<"colegi" | "alemele">("colegi");

  // Filter for Browse: false (all) | true (acceptsTrade = true)
  const [acceptsTradeFilter, setAcceptsTradeFilter] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Modals state
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [exposeModalListing, setExposeModalListing] = useState<SlowStockItem | TradeListing | null>(null);
  const [exposeModalMode, setExposeModalMode] = useState<"create" | "edit">("create");
  const [makeOfferModalListing, setMakeOfferModalListing] = useState<TradeListing | null>(null);
  const [negotiationDetailId, setNegotiationDetailId] = useState<string | null>(null);

  // Detail Sheet & Dialog state
  const [selectedDetailListing, setSelectedDetailListing] = useState<TradeListing | null>(null);
  const [listingToRetract, setListingToRetract] = useState<TradeListing | null>(null);

  // Helper to invalidate all related queries
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
    queryClient.invalidateQueries({ queryKey: ["my-trade"] });
    queryClient.invalidateQueries({ queryKey: ["slow-stock"] });
    queryClient.invalidateQueries({ queryKey: ["negotiations"] });
    queryClient.invalidateQueries({ queryKey: ["network-summary"] });
    queryClient.invalidateQueries({ queryKey: ["exposable-cars"] });
  };

  // Queries
  const { data: browseListings, isLoading: isLoadingBrowse, isError, error } = useQuery<TradeListing[]>({
    queryKey: ["browse-trade"],
    queryFn: () => browseTradeListings({}),
  });

  const { data: myTradeListings, isLoading: isLoadingMy } = useQuery<TradeListing[]>({
    queryKey: ["my-trade"],
    queryFn: getMyTradeListings,
  });

  const { data: slowStock } = useQuery<SlowStockItem[]>({
    queryKey: ["slow-stock", 60],
    queryFn: () => getSlowStock(60),
  });

  const { data: negotiations } = useQuery<NegotiationSummary[]>({
    queryKey: ["negotiations"],
    queryFn: getNegotiations,
  });

  // Mutations
  const exposeMutation = useMutation({
    mutationFn: exposeTradeListing,
    onSuccess: () => {
      toast.success("Vehicul expus în rețea.");
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la expunerea vehiculului.");
    },
  });

  const updateExposeMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) => updateTradeListing(id, values),
    onSuccess: () => {
      toast.success("Expunere actualizată.");
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la actualizarea expunerii.");
    },
  });

  const unexposeMutation = useMutation({
    mutationFn: unexposeTradeListing,
    onSuccess: () => {
      toast.success("Vehicul retras.");
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la retragerea vehiculului.");
    },
  });

  const converseMutation = useMutation({
    mutationFn: ({ tradeListingId, counterpartyId }: { tradeListingId: string; counterpartyId: string }) =>
      getOrCreateConversation({
        otherBusinessId: counterpartyId,
        contextType: "TRADE",
        contextId: tradeListingId,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/network/messages/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la inițierea conversației.");
    },
  });

  // Lookup negotiations keyed by tradeListingId
  const negotiationsByTradeListingId = useMemo(() => {
    const lookup: Record<string, NegotiationSummary[]> = {};
    if (negotiations) {
      for (const n of negotiations) {
        if (!lookup[n.tradeListingId]) {
          lookup[n.tradeListingId] = [];
        }
        lookup[n.tradeListingId].push(n);
      }
    }
    return lookup;
  }, [negotiations]);

  // Sort list for Browse (De la colegi) by title, client-side filtered by acceptsTrade
  const visibleListings = useMemo(() => {
    if (!browseListings) return [];
    const visible = acceptsTradeFilter
      ? browseListings.filter((l) => l.acceptsTrade)
      : browseListings;
    return [...visible].sort((a, b) => a.car.title.localeCompare(b.car.title));
  }, [browseListings, acceptsTradeFilter]);

  // Sort list for Ale mele: ACTIVE first, CLOSED last; within each group, by title
  const sortedMyExposed = useMemo(() => {
    if (!myTradeListings) return [];
    return [...myTradeListings].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "ACTIVE" ? -1 : 1;
      }
      return a.car.title.localeCompare(b.car.title);
    });
  }, [myTradeListings]);

  // Count unexposed slow-stock items
  const unexposedSlowStockCount = useMemo(() => {
    if (!slowStock) return 0;
    return slowStock.filter((item) => !(item.isExposed && item.tradeStatus === "ACTIVE")).length;
  }, [slowStock]);

  const handleReExpose = (id: string) => {
    updateExposeMutation.mutate({ id, values: { status: "ACTIVE" } });
  };

  const handlePickCar = (item: SlowStockItem) => {
    setIsSelectModalOpen(false);
    setExposeModalListing(item);
    setExposeModalMode("create");
  };

  const handleExposeSubmit = (values: any) => {
    if (exposeModalMode === "create") {
      const listingId = (exposeModalListing as SlowStockItem).listingId;
      exposeMutation.mutate({ listingId, ...values });
    } else {
      const id = (exposeModalListing as TradeListing).id;
      updateExposeMutation.mutate({ id, values });
    }
  };

  const totalBrowseCount = browseListings?.length ?? 0;
  const totalMyCount = myTradeListings?.length ?? 0;

  const countText =
    activeSegment === "colegi"
      ? acceptsTradeFilter
        ? `${visibleListings.length} din ${totalBrowseCount} de la colegi`
        : `${totalBrowseCount} de la colegi`
      : `${totalMyCount} expuse de tine`;

  const headerActions = (
    <div className="flex items-center gap-2">
      {activeSegment === "colegi" && (
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          aria-label="Filtrează mașinile"
          className={cn(
            "relative w-11 h-11 border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors min-h-[44px] min-w-[44px]",
            acceptsTradeFilter ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {acceptsTradeFilter && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
      )}
      <button
        type="button"
        onClick={() => setIsSelectModalOpen(true)}
        aria-label="Expune o mașină"
        className="w-11 h-11 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 shrink-0 transition-colors min-h-[44px] min-w-[44px]"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );

  const segmentControl = (
    <div className="grid grid-cols-2 p-1 bg-muted rounded-lg w-full gap-1">
      <button
        type="button"
        onClick={() => setActiveSegment("colegi")}
        className={cn(
          "h-11 min-h-[44px] rounded-md text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
          activeSegment === "colegi"
            ? "bg-card text-foreground shadow-sm font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>De la colegi</span>
        <span className="text-[12px] tabular-nums text-muted-foreground">({totalBrowseCount})</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveSegment("alemele")}
        className={cn(
          "h-11 min-h-[44px] rounded-md text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
          activeSegment === "alemele"
            ? "bg-card text-foreground shadow-sm font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>Ale mele</span>
        <span className="text-[12px] tabular-nums text-muted-foreground">({totalMyCount})</span>
      </button>
    </div>
  );

  if (isLoadingBrowse && isLoadingMy) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <NetworkHeader
          title="Mașini"
          countText="Se încarcă..."
          backHref="/network"
          backAriaLabel="Înapoi la rețea"
          actions={headerActions}
        >
          {segmentControl}
        </NetworkHeader>
        <div className="flex items-center justify-center py-12">
          <span className="text-[13px] text-muted-foreground">Se încarcă...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <NetworkHeader
          title="Mașini"
          countText="Eroare"
          backHref="/network"
          backAriaLabel="Înapoi la rețea"
        />
        {isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[13px] text-center">
            A apărut o eroare la încărcarea mașinilor. Vă rugăm să încercați din nou.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 box-border w-full pb-24">
      {/* 1) HEADER WITH COLLAPSED CHROME & SEGMENTED VIEW SWITCH */}
      <NetworkHeader
        title="Mașini"
        countText={countText}
        backHref="/network"
        backAriaLabel="Înapoi la rețea"
        actions={headerActions}
      >
        {segmentControl}
      </NetworkHeader>

      {/* 2) SEGMENT "DE LA COLEGI" */}
      {activeSegment === "colegi" && (
        <div className="space-y-1.5">
          {/* Section Label */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Car className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                {acceptsTradeFilter ? "Mașini cu schimb" : "Toate mașinile"}
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
              {visibleListings.length}
            </span>
          </div>

          {/* List or Empty State */}
          {isLoadingBrowse ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[13px] text-muted-foreground">Se încarcă...</span>
            </div>
          ) : visibleListings.length === 0 ? (
            <div className={cn(CARD, "p-6 text-center space-y-3")}>
              <p className="text-[13px] text-muted-foreground">
                {acceptsTradeFilter
                  ? "Nicio mașină nu corespunde filtrului selectat."
                  : "Nu sunt mașini expuse de colegi în acest moment."}
              </p>
              {acceptsTradeFilter && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAcceptsTradeFilter(false)}
                    className="text-primary text-[13px] font-medium hover:underline min-h-[44px] px-3 flex items-center justify-center"
                  >
                    Resetează filtrul
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={cn(CARD, "overflow-hidden")}>
              {visibleListings.map((listing, idx) => (
                <Fragment key={listing.id}>
                  {idx > 0 && <div className="border-t border-border/40 ml-4" />}
                  <TradeCarRow
                    listing={listing}
                    segment="browse"
                    negotiations={negotiationsByTradeListingId[listing.id]}
                    onClick={() => setSelectedDetailListing(listing)}
                  />
                </Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3) SEGMENT "ALE MELE" */}
      {activeSegment === "alemele" && (
        <div className="space-y-4">
          {/* a) Slow Stock Hint */}
          {unexposedSlowStockCount > 0 && (
            <div className={cn(CARD, "p-4 flex flex-col gap-3")}>
              <p className="text-[15px] text-foreground font-normal">
                Ai {roCount(unexposedSlowStockCount, "mașină", "mașini")} de peste 60 de zile în stoc.
              </p>
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => setIsSelectModalOpen(true)}
                  className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
                >
                  Expune în rețea
                </button>
              </div>
            </div>
          )}

          {/* b) Section Label */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Car className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                  Mașinile mele expuse
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
                {sortedMyExposed.length}
              </span>
            </div>

            {/* List or Empty State */}
            {isLoadingMy ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-[13px] text-muted-foreground">Se încarcă...</span>
              </div>
            ) : sortedMyExposed.length === 0 ? (
              <div className={cn(CARD, "p-6 text-center space-y-3")}>
                <p className="text-[13px] text-muted-foreground">
                  Nu ai nicio mașină expusă în rețea.
                </p>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsSelectModalOpen(true)}
                    className="text-primary text-[13px] font-medium hover:underline min-h-[44px] px-3 flex items-center justify-center"
                  >
                    Expune o mașină
                  </button>
                </div>
              </div>
            ) : (
              <div className={cn(CARD, "overflow-hidden")}>
                {sortedMyExposed.map((listing, idx) => (
                  <Fragment key={listing.id}>
                    {idx > 0 && <div className="border-t border-border/40 ml-4" />}
                    <TradeCarRow
                      listing={listing}
                      segment="mine"
                      negotiations={negotiationsByTradeListingId[listing.id]}
                      onClick={() => setSelectedDetailListing(listing)}
                    />
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILTER BOTTOM SHEET (FOR BROWSE) */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-border text-foreground rounded-t-2xl px-4 py-5 max-h-[80vh]">
          <SheetHeader className="text-left pb-3 border-b border-border">
            <SheetTitle className="text-[17px] font-semibold text-foreground">Filtrează mașinile</SheetTitle>
            <SheetDescription className="text-[13px] text-muted-foreground">
              Afișează doar vehiculele care acceptă schimb
            </SheetDescription>
          </SheetHeader>
          <div className="py-3 flex flex-col gap-2">
            {[
              { id: false, label: "Toate mașinile" },
              { id: true, label: "Doar cu schimb (acceptă schimb)" },
            ].map((opt) => (
              <button
                key={String(opt.id)}
                type="button"
                onClick={() => {
                  setAcceptsTradeFilter(opt.id);
                  setIsFilterSheetOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-4 min-h-[48px] rounded-lg transition-colors text-left",
                  acceptsTradeFilter === opt.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/50 hover:bg-muted text-foreground font-medium"
                )}
              >
                <span className="text-[15px]">{opt.label}</span>
                {acceptsTradeFilter === opt.id && <Check className="w-5 h-5 shrink-0" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* TRADE CAR DETAIL SHEET */}
      <TradeCarDetailSheet
        listing={selectedDetailListing}
        segment={activeSegment === "colegi" ? "browse" : "mine"}
        negotiations={selectedDetailListing ? negotiationsByTradeListingId[selectedDetailListing.id] : undefined}
        open={!!selectedDetailListing}
        onOpenChange={(open) => !open && setSelectedDetailListing(null)}
        onMakeOffer={(listing) => {
          setSelectedDetailListing(null);
          setMakeOfferModalListing(listing);
        }}
        onOpenNegotiation={(negotiationId) => {
          setSelectedDetailListing(null);
          setNegotiationDetailId(negotiationId);
        }}
        onEdit={(listing) => {
          setSelectedDetailListing(null);
          setExposeModalListing(listing);
          setExposeModalMode("edit");
        }}
        onRequestRetrage={(listing) => {
          setSelectedDetailListing(null);
          setListingToRetract(listing);
        }}
        onReExpose={(listingId) => {
          handleReExpose(listingId);
          setSelectedDetailListing(null);
        }}
      />

      {/* RETRACT CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={!!listingToRetract} onOpenChange={(open) => !open && setListingToRetract(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground max-w-sm rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[17px] font-semibold text-foreground">
              Retragi vehiculul din rețea?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground">
              {listingToRetract?.car.title} nu va mai fi vizibilă pentru ceilalți dealeri. O poți reactiva oricând.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-end mt-2">
            <AlertDialogCancel className="min-h-[44px] mt-0 bg-card border-border text-foreground">
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (listingToRetract) {
                  unexposeMutation.mutate(listingToRetract.id);
                  setListingToRetract(null);
                }
              }}
              className="min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retrage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Select Car to Expose Modal */}
      <SelectCarToExposeModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        onPick={handlePickCar}
        onAddNew={() => navigate("/listings/new")}
      />

      {/* Expose Trade Modal */}
      <ExposeTradeModal
        isOpen={exposeModalListing !== null}
        onClose={() => setExposeModalListing(null)}
        listing={exposeModalListing}
        mode={exposeModalMode}
        onSubmit={handleExposeSubmit}
      />

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={makeOfferModalListing !== null}
        onClose={() => setMakeOfferModalListing(null)}
        listing={makeOfferModalListing}
        onCreated={(negotiation) => {
          setNegotiationDetailId(negotiation.id);
          invalidateAll();
        }}
        onExisting={(negotiationId) => {
          setNegotiationDetailId(negotiationId);
          invalidateAll();
        }}
      />

      {/* Negotiation Detail Modal */}
      <NegotiationDetailModal
        negotiationId={negotiationDetailId}
        isOpen={negotiationDetailId !== null}
        onClose={() => {
          setNegotiationDetailId(null);
          invalidateAll();
        }}
        onConverse={(tradeListingId, counterpartyId) =>
          converseMutation.mutate({ tradeListingId, counterpartyId })
        }
      />
    </div>
  );
}
