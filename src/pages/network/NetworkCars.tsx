import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Phone, Car, Plus } from "lucide-react";
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
  NegotiationSummary
} from "@/services/api";
import { roCount } from "@/lib/plural";
import { formatEur } from "@/lib/format";
import { toast } from "react-hot-toast";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";

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

  // Modals state
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [exposeModalListing, setExposeModalListing] = useState<SlowStockItem | TradeListing | null>(null);
  const [exposeModalMode, setExposeModalMode] = useState<"create" | "edit">("create");
  const [makeOfferModalListing, setMakeOfferModalListing] = useState<TradeListing | null>(null);
  const [negotiationDetailId, setNegotiationDetailId] = useState<string | null>(null);

  // Helper to invalidate all related queries
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
    queryClient.invalidateQueries({ queryKey: ["my-trade"] });
    queryClient.invalidateQueries({ queryKey: ["slow-stock"] });
    queryClient.invalidateQueries({ queryKey: ["negotiations"] });
    queryClient.invalidateQueries({ queryKey: ["network-summary"] });
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
    }
  });

  const updateExposeMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) => updateTradeListing(id, values),
    onSuccess: () => {
      toast.success("Expunere actualizată.");
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la actualizarea expunerii.");
    }
  });

  const unexposeMutation = useMutation({
    mutationFn: unexposeTradeListing,
    onSuccess: () => {
      toast.success("Vehicul retras.");
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la retragerea vehiculului.");
    }
  });

  const converseMutation = useMutation({
    mutationFn: ({ tradeListingId, counterpartyId }: { tradeListingId: string; counterpartyId: string }) =>
      getOrCreateConversation({
        otherBusinessId: counterpartyId,
        contextType: "TRADE",
        contextId: tradeListingId
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/network/messages/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la inițierea conversației.");
    }
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
      ? browseListings.filter(l => l.acceptsTrade)
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
    return slowStock.filter(item => !(item.isExposed && item.tradeStatus === "ACTIVE")).length;
  }, [slowStock]);

  // Handlers for my exposed actions
  const handleRetrage = (id: string, title: string) => {
    if (window.confirm(`Retragi ${title} din rețea?`)) {
      unexposeMutation.mutate(id);
    }
  };

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

  if (isError) {
    return (
      <div className="space-y-4 box-border w-full pb-24">
        {/* 1) HEADER */}
        <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/network")}
              className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 rounded-full shrink-0"
              aria-label="Înapoi"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-[20px] font-semibold">Mașini</h1>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Cumpără de la colegi sau expune-le pe ale tale.
          </p>
        </div>
        {isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[15px] text-center">
            A apărut o eroare la încărcarea mașinilor. Vă rugăm să încercați din nou.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 box-border w-full pb-24">
      {/* 1) HEADER */}
      <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/network")}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 rounded-full shrink-0"
            aria-label="Înapoi"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold">Mașini</h1>
        </div>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Cumpără de la colegi sau expune-le pe ale tale.
        </p>
      </div>

      {/* 2) SEGMENTS */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSegment("colegi")}
          className={`flex-1 min-h-[44px] rounded-lg text-[15px] font-medium transition-colors ${
            activeSegment === "colegi"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          }`}
        >
          De la colegi ({browseListings?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveSegment("alemele")}
          className={`flex-1 min-h-[44px] rounded-lg text-[15px] font-medium transition-colors ${
            activeSegment === "alemele"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          }`}
        >
          Ale mele ({myTradeListings?.length ?? 0})
        </button>
      </div>

      <button
        onClick={() => setIsSelectModalOpen(true)}
        className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground text-[16px] font-semibold flex items-center justify-center gap-2 mt-3 mb-1"
      >
        <Plus className="w-5 h-5" />
        Expune o mașină
      </button>

      {/* 3) SEGMENT "DE LA COLEGI" */}
      {activeSegment === "colegi" && (
        <div className="space-y-4">
          {/* a) Filter Chips */}
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setAcceptsTradeFilter(prev => !prev)}
              className={`min-h-[36px] px-4 rounded-full text-[13px] font-medium transition-colors border shrink-0 ${
                acceptsTradeFilter
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground"
              }`}
            >
              Doar cu schimb
            </button>
          </div>

          {isLoadingBrowse ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[15px] text-muted-foreground">Se încarcă...</span>
            </div>
          ) : visibleListings.length === 0 ? (
            /* c) Empty State */
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[15px] text-foreground">Nu sunt mașini expuse de colegi acum.</p>
              {acceptsTradeFilter && (
                <p className="text-[13px] text-muted-foreground mt-1 font-normal">
                  Încearcă fără filtrul de schimb.
                </p>
              )}
            </div>
          ) : (
            /* b) Card List */
            <div className="flex flex-col gap-4">
              {visibleListings.map((listing) => {
                const displayPrice = listing.b2bPrice !== null ? listing.b2bPrice : listing.car.price;
                const hasDifferentB2bPrice = listing.b2bPrice !== null && listing.b2bPrice !== listing.car.price;

                const buyerNegs = negotiationsByTradeListingId[listing.id] || [];
                const negotiation = buyerNegs.find(n => n.role === "BUYER");

                let statusButtonProps = null;
                if (negotiation) {
                  const latestAmount = negotiation.latestProposal?.offeredPrice ?? 0;
                  if (negotiation.status === "ACCEPTED") {
                    statusButtonProps = {
                      label: "Acceptată",
                      className: "bg-success-light text-success hover:bg-success-light/80",
                    };
                  } else if (negotiation.status === "DECLINED" || negotiation.status === "CANCELLED") {
                    statusButtonProps = {
                      label: "Închisă",
                      className: "bg-muted text-muted-foreground hover:bg-muted/80",
                    };
                  } else {
                    // status is OPEN
                    if (negotiation.awaitingMyResponse) {
                      statusButtonProps = {
                        label: `Răspunde · ${formatEur(latestAmount)}`,
                        className: "bg-primary text-primary-foreground hover:bg-primary/90",
                      };
                    } else {
                      statusButtonProps = {
                        label: `Ai oferit ${formatEur(latestAmount)}`,
                        className: "bg-primary-light text-primary hover:bg-primary-light/80",
                      };
                    }
                  }
                }

                return (
                  <div
                    key={listing.id}
                    className="bg-card border border-border rounded-xl p-3 flex flex-col gap-3"
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      {listing.car.image ? (
                        <img
                          src={listing.car.image}
                          alt={listing.car.title}
                          className="w-20 h-16 rounded-lg object-cover shrink-0 bg-muted"
                          style={{ width: "80px", height: "64px" }}
                        />
                      ) : (
                        <div
                          className="w-20 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0"
                          style={{ width: "80px", height: "64px" }}
                        >
                          <Car className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}

                      {/* Right column content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        {/* Line 1: Prices */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-[17px] font-semibold text-foreground">
                            {formatEur(displayPrice ?? 0)}
                          </span>
                          {hasDifferentB2bPrice && (
                            <span className="text-[13px] text-muted-foreground line-through">
                              {formatEur(listing.car.price ?? 0)}
                            </span>
                          )}
                        </div>

                        {/* Line 2: Title */}
                        <h3 className="text-[15px] font-medium truncate text-foreground leading-snug">
                          {listing.car.title}
                        </h3>

                        {/* Line 3: Owner */}
                        <p className="text-[13px] text-muted-foreground truncate leading-normal">
                          {listing.owner?.name || "Dealer"}
                          {listing.owner?.city ? ` · ${listing.owner.city}` : ""}
                        </p>

                        {/* Line 4: Accepts trade badge */}
                        {listing.acceptsTrade && (
                          <div className="mt-1">
                            <span className="bg-primary-light text-primary text-[12px] font-medium rounded-full px-2 py-0.5 inline-block">
                              Acceptă schimb
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2">
                      {statusButtonProps ? (
                        <button
                          onClick={() => setNegotiationDetailId(negotiation.id)}
                          className={`flex-1 min-h-[44px] px-4 rounded-lg text-[13px] font-semibold transition-colors ${statusButtonProps.className}`}
                        >
                          {statusButtonProps.label}
                        </button>
                      ) : (
                        <button
                          onClick={() => setMakeOfferModalListing(listing)}
                          className="flex-1 min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
                        >
                          Fă ofertă
                        </button>
                      )}
                      {listing.owner?.contactPhone && (
                        <a
                          href={`tel:${listing.owner.contactPhone}`}
                          className="w-11 h-11 rounded-full bg-success-light text-success flex items-center justify-center hover:bg-success-light/80 shrink-0 transition-colors"
                          aria-label={`Sună pe ${listing.owner.name}`}
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4) SEGMENT "ALE MELE" */}
      {activeSegment === "alemele" && (
        <div className="space-y-4">
          {/* a) Slow Stock Hint */}
          {unexposedSlowStockCount > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
              <p className="text-[15px] text-foreground font-normal">
                Ai {roCount(unexposedSlowStockCount, "mașină", "mașini")} de peste 60 de zile în stoc.
              </p>
              <div className="flex justify-start">
                <button
                  onClick={() => setIsSelectModalOpen(true)}
                  className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
                >
                  Expune în rețea
                </button>
              </div>
            </div>
          )}



          {isLoadingMy ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[15px] text-muted-foreground">Se încarcă...</span>
            </div>
          ) : sortedMyExposed.length === 0 ? (
            /* d) Empty State */
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[15px] text-foreground font-normal">Nu ai nicio mașină expusă în rețea.</p>
            </div>
          ) : (
            /* c) Card List */
            <div className="flex flex-col gap-4">
              {sortedMyExposed.map((listing) => {
                const displayPrice = listing.b2bPrice !== null ? listing.b2bPrice : listing.car.price;
                const hasDifferentB2bPrice = listing.b2bPrice !== null && listing.b2bPrice !== listing.car.price;

                const myNegs = negotiationsByTradeListingId[listing.id] || [];
                const activeNeg = myNegs.find((n) => n.awaitingMyResponse) || myNegs[0];

                let line3Element = null;
                if (myNegs.length === 0) {
                  line3Element = (
                    <p className="text-[13px] text-muted-foreground truncate leading-normal">
                      Nicio ofertă încă
                    </p>
                  );
                } else {
                  const counterparty = activeNeg.counterparty?.name || "Dealer";
                  const amount = activeNeg.latestProposal?.offeredPrice ?? 0;
                  if (activeNeg.awaitingMyResponse) {
                    line3Element = (
                      <p className="text-[13px] text-warning font-medium truncate leading-normal">
                        {counterparty} oferă {formatEur(amount)}
                      </p>
                    );
                  } else {
                    line3Element = (
                      <p className="text-[13px] text-muted-foreground truncate leading-normal">
                        Ai cerut {formatEur(amount)} · {counterparty}
                      </p>
                    );
                  }
                }

                const isClosed = listing.status === "CLOSED";

                return (
                  <div
                    key={listing.id}
                    className={`bg-card border border-border rounded-xl p-3 flex flex-col gap-3 transition-opacity duration-200 ${
                      isClosed ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      {listing.car.image ? (
                        <img
                          src={listing.car.image}
                          alt={listing.car.title}
                          className="w-20 h-16 rounded-lg object-cover shrink-0 bg-muted"
                          style={{ width: "80px", height: "64px" }}
                        />
                      ) : (
                        <div
                          className="w-20 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0"
                          style={{ width: "80px", height: "64px" }}
                        >
                          <Car className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}

                      {/* Right column content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        {/* Line 1: Prices */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-[17px] font-semibold text-foreground">
                            {formatEur(displayPrice ?? 0)}
                          </span>
                          {hasDifferentB2bPrice && (
                            <span className="text-[13px] text-muted-foreground line-through">
                              {formatEur(listing.car.price ?? 0)}
                            </span>
                          )}
                        </div>

                        {/* Line 2: Title */}
                        <h3 className="text-[15px] font-medium truncate text-foreground leading-snug">
                          {listing.car.title}
                          {isClosed && (
                            <span className="text-muted-foreground font-normal"> · retrasă</span>
                          )}
                        </h3>

                        {/* Line 3: Negotiation State */}
                        {line3Element}

                        {/* Line 4: Accepts trade badge */}
                        {listing.acceptsTrade && (
                          <div className="mt-1">
                            <span className="bg-primary-light text-primary text-[12px] font-medium rounded-full px-2 py-0.5 inline-block">
                              Acceptă schimb
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2">
                      {myNegs.length > 0 && (
                        <button
                          onClick={() => setNegotiationDetailId(activeNeg.id)}
                          className={`min-h-[44px] px-4 rounded-lg text-[13px] font-semibold transition-colors ${
                            activeNeg.awaitingMyResponse
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-primary-light text-primary hover:bg-primary-light/80"
                          }`}
                        >
                          Vezi oferta
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setExposeModalListing(listing);
                          setExposeModalMode("edit");
                        }}
                        className="min-h-[44px] px-4 rounded-lg bg-card border border-border text-foreground text-[13px] font-semibold hover:bg-muted/50 transition-colors"
                      >
                        Editează
                      </button>

                      {listing.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleRetrage(listing.id, listing.car.title)}
                          className="text-[13px] text-muted-foreground min-h-[44px] font-semibold hover:text-foreground transition-colors px-2"
                        >
                          Retrage
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReExpose(listing.id)}
                          className="text-[13px] text-muted-foreground min-h-[44px] font-semibold hover:text-foreground transition-colors px-2"
                        >
                          Expune din nou
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
