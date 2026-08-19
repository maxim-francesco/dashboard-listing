import { useState, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Plus,
  SlidersHorizontal,
  Truck,
  Check,
} from "lucide-react";
import {
  getTransportRuns,
  getMyTransportRuns,
  expressTransportInterest,
  createTransportRun,
  updateTransportRun,
  getNetworkSummary,
  getOrCreateConversation,
  TransportRun,
} from "@/services/api";
import { roCount } from "@/lib/plural";
import { formatEur } from "@/lib/format";
import { relativeDay } from "@/lib/relativeTime";
import { TRANSPORT_TYPE_LABELS, countryLabel } from "@/lib/transportConstants";
import { toast } from "react-hot-toast";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";
import NetworkHeader from "@/components/network/NetworkHeader";
import { CARD } from "@/components/today/cardRecipe";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import PostTransportRunModal from "@/components/modals/PostTransportRunModal";
import TransportInterestModal from "@/components/modals/TransportInterestModal";
import ViewInterestsModal from "@/components/modals/ViewInterestsModal";

export default function NetworkTransport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Segment: "curse" (Browse) | "alemele" (Mine)
  const [activeSegment, setActiveSegment] = useState<"curse" | "alemele">("curse");

  // Filter for Browse: undefined (Toate) | "OFFER" | "REQUEST"
  const [kindFilter, setKindFilter] = useState<"OFFER" | "REQUEST" | undefined>(undefined);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // In-memory set to track runs we've interested in this session (or got 409 already interested)
  const [interestedRunIds, setInterestedRunIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [interestModalRun, setInterestModalRun] = useState<TransportRun | null>(null);
  const [viewInterestsRun, setViewInterestsRun] = useState<TransportRun | null>(null);
  const [selectedDetailRun, setSelectedDetailRun] = useState<TransportRun | null>(null);
  const [runToClose, setRunToClose] = useState<TransportRun | null>(null);

  // Queries
  const { data: runs, isLoading: isLoadingRuns, isError, error } = useQuery<TransportRun[]>({
    queryKey: ["transport-runs"],
    queryFn: () => getTransportRuns({}),
  });

  const { data: myRuns, isLoading: isLoadingMyRuns } = useQuery<TransportRun[]>({
    queryKey: ["my-transport-runs"],
    queryFn: getMyTransportRuns,
  });

  const { data: networkSummary } = useQuery({
    queryKey: ["network-summary"],
    queryFn: getNetworkSummary,
  });

  // Converse mutation for ViewInterestsModal
  const converseMutation = useMutation({
    mutationFn: (payload: { otherBusinessId: string; contextType: "GENERAL" | "TRANSPORT"; contextId: string | null }) =>
      getOrCreateConversation(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/network/messages/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la inițierea conversației.");
    },
  });

  // Express interest mutation
  const expressInterestMutation = useMutation({
    mutationFn: ({ runId, seatsRequested, note }: { runId: string; seatsRequested: number; note?: string | null }) =>
      expressTransportInterest(runId, { seatsRequested, note }),
    onSuccess: (_, variables) => {
      toast.success("Interes trimis. Sună dealerul.");
      setInterestedRunIds((prev) => {
        const next = new Set(prev);
        next.add(variables.runId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["transport-runs"] });
    },
    onError: (err: any, variables) => {
      if (err.response?.status === 409) {
        setInterestedRunIds((prev) => {
          const next = new Set(prev);
          next.add(variables.runId);
          return next;
        });
      } else {
        toast.error(err.response?.data?.message || "Eroare la trimiterea interesului.");
      }
    },
  });

  // Post run mutation
  const createRunMutation = useMutation({
    mutationFn: createTransportRun,
    onSuccess: () => {
      toast.success("Cursa a fost postată cu succes.");
      queryClient.invalidateQueries({ queryKey: ["my-transport-runs"] });
      queryClient.invalidateQueries({ queryKey: ["transport-runs"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la crearea cursei.");
    },
  });

  // Close run mutation
  const closeRunMutation = useMutation({
    mutationFn: (runId: string) => updateTransportRun(runId, { status: "CLOSED" }),
    onSuccess: () => {
      toast.success("Cursa a fost închisă.");
      queryClient.invalidateQueries({ queryKey: ["my-transport-runs"] });
      queryClient.invalidateQueries({ queryKey: ["transport-runs"] });
      queryClient.invalidateQueries({ queryKey: ["transport-interests-count"] });
      queryClient.invalidateQueries({ queryKey: ["network-summary"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la închiderea cursei.");
    },
  });

  // Parse unseen runs from network summary action items
  const unseenRunIds = useMemo(() => {
    return new Set(
      networkSummary?.actionItems
        ?.filter((item: any) => item.type === "TRANSPORT_INTEREST")
        ?.map((item: any) => item.id) || []
    );
  }, [networkSummary]);

  // Sorting and filtering client-side
  const sortedRuns = useMemo(() => {
    if (!runs) return [];
    const filtered = kindFilter
      ? runs.filter((run) => run.kind === kindFilter)
      : runs;
    return [...filtered].sort(
      (a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
    );
  }, [runs, kindFilter]);

  const sortedMyRuns = useMemo(() => {
    if (!myRuns) return [];
    return [...myRuns].sort(
      (a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
    );
  }, [myRuns]);

  // Seen-marking close handler
  const handleCloseViewInterests = () => {
    setViewInterestsRun(null);
    queryClient.invalidateQueries({ queryKey: ["my-transport-runs"] });
    queryClient.invalidateQueries({ queryKey: ["transport-interests-count"] });
    queryClient.invalidateQueries({ queryKey: ["network-summary"] });
  };

  const totalRunsCount = runs?.length ?? 0;
  const myRunsCount = myRuns?.length ?? 0;

  const countText =
    activeSegment === "curse"
      ? kindFilter !== undefined
        ? `${roCount(sortedRuns.length, "cursă găsită", "curse găsite")} din ${totalRunsCount}`
        : roCount(totalRunsCount, "cursă disponibilă", "curse disponibile")
      : roCount(myRunsCount, "cursă proprie", "curse proprii");

  const headerActions = (
    <div className="flex items-center gap-2">
      {activeSegment === "curse" && (
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          aria-label="Filtrează cursele"
          className={cn(
            "relative w-11 h-11 lg:w-9 lg:h-9 border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0",
            kindFilter !== undefined ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
          )}
        >
          <SlidersHorizontal className="w-5 h-5 lg:w-4 lg:h-4" />
          {kindFilter !== undefined && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
      )}
      <button
        type="button"
        onClick={() => setIsPostModalOpen(true)}
        aria-label="Anunță o cursă"
        className="w-11 h-11 lg:w-9 lg:h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 shrink-0 transition-colors min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0"
      >
        <Plus className="w-5 h-5 lg:w-4 lg:h-4" />
      </button>
    </div>
  );

  const segmentControl = (
    <div className="grid grid-cols-2 p-1 bg-muted rounded-lg w-full gap-1">
      <button
        type="button"
        onClick={() => setActiveSegment("curse")}
        className={cn(
          "h-11 min-h-[44px] rounded-md text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
          activeSegment === "curse"
            ? "bg-card text-foreground shadow-sm font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>Curse</span>
        <span className="text-[12px] tabular-nums text-muted-foreground">({totalRunsCount})</span>
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
        <span className="text-[12px] tabular-nums text-muted-foreground">({myRunsCount})</span>
      </button>
    </div>
  );

  if (isLoadingRuns && isLoadingMyRuns) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <NetworkHeader
          title="Transport"
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
          title="Transport"
          countText="Eroare"
          backHref="/network"
          backAriaLabel="Înapoi la rețea"
        />
        {isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[13px] text-center">
            A apărut o eroare la încărcarea curselor de transport. Vă rugăm să încercați din nou.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 box-border w-full pb-24">
      {/* HEADER WITH COLLAPSED CHROME & SEGMENTED VIEW SWITCH */}
      <NetworkHeader
        title="Transport"
        countText={countText}
        backHref="/network"
        backAriaLabel="Înapoi la rețea"
        actions={headerActions}
      >
        {segmentControl}
      </NetworkHeader>

      {/* SEGMENT 1: CURSE (BROWSE RUNS) */}
      {activeSegment === "curse" && (
        <div className="space-y-1.5">
          {/* Section Label */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                {kindFilter === "OFFER"
                  ? "Curse cu locuri libere"
                  : kindFilter === "REQUEST"
                  ? "Cereri de transport"
                  : "Toate cursele"}
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
              {sortedRuns.length}
            </span>
          </div>

          {/* List or Empty State */}
          {isLoadingRuns ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[13px] text-muted-foreground">Se încarcă...</span>
            </div>
          ) : sortedRuns.length === 0 ? (
            <div className={cn(CARD, "p-6 text-center space-y-3")}>
              <p className="text-[13px] text-muted-foreground">
                {kindFilter !== undefined
                  ? "Nicio cursă nu corespunde filtrului selectat."
                  : "Nu sunt curse de transport disponibile în rețea în acest moment."}
              </p>
              {kindFilter !== undefined && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setKindFilter(undefined)}
                    className="text-primary text-[13px] font-medium hover:underline min-h-[44px] px-3 flex items-center justify-center"
                  >
                    Resetează filtrul
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={cn(CARD, "overflow-hidden")}>
              {sortedRuns.map((run, idx) => {
                const relDay = relativeDay(run.departureDate);
                const isWarning = relDay === "azi" || relDay === "mâine";
                const isInterested = run.myInterest === true || interestedRunIds.has(run.id);

                let verdictText = "";
                if (run.pricePerCar !== null) {
                  verdictText = formatEur(run.pricePerCar);
                } else if (run.kind === "REQUEST") {
                  verdictText = "Cerere";
                } else {
                  verdictText = "Ofertă";
                }

                const seatsText =
                  run.seatsAvailable === 0
                    ? "0 locuri"
                    : `${run.seatsAvailable}/${run.seatsTotal} locuri`;

                return (
                  <Fragment key={run.id}>
                    {idx > 0 && <div className="border-t border-border/40 ml-4" />}
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left select-none gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailRun(run)}
                        className="flex-1 min-w-0 pr-1 text-left focus:outline-none"
                      >
                        {/* Line 1: Route + Verdict */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[15px] font-medium text-foreground truncate flex-1 min-w-0">
                            {run.fromCity} → {run.toCity}
                          </span>
                          <span className="text-[15px] font-semibold text-foreground tabular-nums text-right shrink-0">
                            {verdictText}
                          </span>
                        </div>
                        {/* Line 2: Secondary metadata */}
                        <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                          <span>pleacă </span>
                          <span className={isWarning ? "text-warning font-medium" : ""}>
                            {relDay}
                          </span>
                          <span className="tabular-nums"> · {seatsText}</span>
                          <span> · {run.owner?.name || "Dealer"}</span>
                          {run.transportType && (
                            <span> · {TRANSPORT_TYPE_LABELS[run.transportType]}</span>
                          )}
                          {run.acceptsNonRunning && <span> · Troliu</span>}
                        </div>
                      </button>

                      {/* Right interactive button */}
                      <div className="shrink-0 flex items-center">
                        {isInterested ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-success font-medium">Interes trimis</span>
                            {run.owner?.contactPhone && (
                              <a
                                href={`tel:${run.owner.contactPhone}`}
                                className="w-11 h-11 rounded-full bg-success-light text-success flex items-center justify-center hover:opacity-90 shrink-0 min-h-[44px] min-w-[44px] transition-opacity"
                                aria-label={`Sună pe ${run.owner.name}`}
                              >
                                <Phone className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setInterestModalRun(run)}
                            className="min-h-[44px] px-3.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 shrink-0 transition-colors"
                          >
                            Mă interesează
                          </button>
                        )}
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SEGMENT 2: ALE MELE (MY RUNS) */}
      {activeSegment === "alemele" && (
        <div className="space-y-1.5">
          {/* Section Label */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                Cursele mele anunțate
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
              {sortedMyRuns.length}
            </span>
          </div>

          {/* List or Empty State */}
          {isLoadingMyRuns ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[13px] text-muted-foreground">Se încarcă...</span>
            </div>
          ) : sortedMyRuns.length === 0 ? (
            <div className={cn(CARD, "p-6 text-center space-y-3")}>
              <p className="text-[13px] text-muted-foreground">
                Nu ai nicio cursă anunțată în acest moment.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(true)}
                  className="text-primary text-[13px] font-medium hover:underline min-h-[44px] px-3 flex items-center justify-center"
                >
                  Anunță o cursă
                </button>
              </div>
            </div>
          ) : (
            <div className={cn(CARD, "overflow-hidden")}>
              {sortedMyRuns.map((run, idx) => {
                const relDay = relativeDay(run.departureDate);
                const isWarning = relDay === "azi" || relDay === "mâine";
                const hasUnseen = unseenRunIds.has(run.id);
                const interestCount = run.interestCount ?? 0;

                let verdictText = "";
                if (run.status === "CLOSED") {
                  verdictText = "Închisă";
                } else if (run.pricePerCar !== null) {
                  verdictText = formatEur(run.pricePerCar);
                } else if (run.kind === "REQUEST") {
                  verdictText = "Cerere";
                } else {
                  verdictText = "Ofertă";
                }

                const seatsText =
                  run.status === "CLOSED"
                    ? "închisă"
                    : `${run.seatsAvailable}/${run.seatsTotal} locuri libere`;

                return (
                  <Fragment key={run.id}>
                    {idx > 0 && <div className="border-t border-border/40 ml-4" />}
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left select-none gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailRun(run)}
                        className="flex-1 min-w-0 pr-1 text-left focus:outline-none"
                      >
                        {/* Line 1: Route + Price/Status */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[15px] font-medium text-foreground truncate flex-1 min-w-0">
                            {run.fromCity} → {run.toCity}
                          </span>
                          <span
                            className={cn(
                              "text-[15px] font-semibold tabular-nums text-right shrink-0",
                              run.status === "CLOSED"
                                ? "text-muted-foreground font-normal text-[13px]"
                                : "text-foreground"
                            )}
                          >
                            {verdictText}
                          </span>
                        </div>
                        {/* Line 2: Secondary metadata */}
                        <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                          <span>pleacă </span>
                          <span className={isWarning ? "text-warning font-medium" : ""}>
                            {relDay}
                          </span>
                          <span className="tabular-nums"> · {seatsText}</span>
                          {run.transportType && (
                            <span> · {TRANSPORT_TYPE_LABELS[run.transportType]}</span>
                          )}
                          {run.acceptsNonRunning && <span> · Troliu</span>}
                        </div>
                      </button>

                      {/* Right Action: Interest Count Button / Indicator */}
                      <div className="shrink-0 flex items-center">
                        {interestCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setViewInterestsRun(run)}
                            className="relative min-h-[44px] px-3.5 rounded-lg bg-primary-light text-primary text-[13px] font-medium hover:bg-primary-light/80 flex items-center gap-1.5 tabular-nums transition-colors"
                          >
                            <span>{roCount(interestCount, "interesat", "interesați")}</span>
                            {hasUnseen && (
                              <span className="w-2 h-2 rounded-full bg-destructive" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[12px] text-muted-foreground tabular-nums pr-1">
                            0 interesați
                          </span>
                        )}
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FILTER BOTTOM SHEET (FOR BROWSE RUNS) */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-border text-foreground rounded-t-2xl px-4 py-5 max-h-[80vh]">
          <SheetHeader className="text-left pb-3 border-b border-border">
            <SheetTitle className="text-[17px] font-semibold text-foreground">Filtrează cursele</SheetTitle>
            <SheetDescription className="text-[13px] text-muted-foreground">
              Afișează doar ofertele cu locuri libere sau cererile de transport
            </SheetDescription>
          </SheetHeader>
          <div className="py-3 flex flex-col gap-2">
            {[
              { id: undefined, label: "Toate cursele" },
              { id: "OFFER", label: "Duce mașini (oferte cu locuri)" },
              { id: "REQUEST", label: "Caută transport (cereri)" },
            ].map((opt) => (
              <button
                key={String(opt.id)}
                type="button"
                onClick={() => {
                  setKindFilter(opt.id as any);
                  setIsFilterSheetOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-4 min-h-[48px] rounded-lg transition-colors text-left",
                  kindFilter === opt.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/50 hover:bg-muted text-foreground font-medium"
                )}
              >
                <span className="text-[15px]">{opt.label}</span>
                {kindFilter === opt.id && <Check className="w-5 h-5 shrink-0" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* RUN DETAIL BOTTOM SHEET (FOR FULL UNTRUNCATED CITIES & 480-CHAR NOTES) */}
      <Sheet
        open={!!selectedDetailRun}
        onOpenChange={(open) => !open && setSelectedDetailRun(null)}
      >
        <SheetContent
          side="bottom"
          className="bg-card border-border text-foreground rounded-t-2xl px-4 py-5 max-h-[85vh] overflow-y-auto"
        >
          {selectedDetailRun && (
            <div className="space-y-4">
              <SheetHeader className="text-left pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {selectedDetailRun.kind === "OFFER" ? "Duce mașini" : "Caută transport"}
                  </span>
                  {selectedDetailRun.status === "CLOSED" && (
                    <span className="text-[12px] font-medium px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                      Închisă
                    </span>
                  )}
                </div>
                <SheetTitle className="text-[19px] font-semibold text-foreground mt-1 break-words">
                  {selectedDetailRun.fromCity} → {selectedDetailRun.toCity}
                </SheetTitle>
                <SheetDescription className="text-[13px] text-muted-foreground">
                  Plecare:{" "}
                  {new Date(selectedDetailRun.departureDate).toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {selectedDetailRun.departureDateEnd &&
                    ` · Retur: ${new Date(selectedDetailRun.departureDateEnd).toLocaleDateString(
                      "ro-RO",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}`}
                </SheetDescription>
              </SheetHeader>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Locuri</div>
                  <div className="text-[15px] font-semibold text-foreground mt-0.5 tabular-nums">
                    {selectedDetailRun.seatsAvailable} libere / {selectedDetailRun.seatsTotal} total
                  </div>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Preț / mașină</div>
                  <div className="text-[15px] font-semibold text-foreground mt-0.5 tabular-nums">
                    {selectedDetailRun.pricePerCar !== null
                      ? formatEur(selectedDetailRun.pricePerCar)
                      : "Nedeclarat"}
                  </div>
                </div>
              </div>

              {/* Additional Specs */}
              <div className="p-3 bg-muted/30 rounded-lg border border-border/40 space-y-1.5 text-[13px]">
                {selectedDetailRun.transportType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip transport:</span>
                    <span className="font-medium text-foreground">
                      {TRANSPORT_TYPE_LABELS[selectedDetailRun.transportType]}
                    </span>
                  </div>
                )}
                {selectedDetailRun.fromCountry && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Țară:</span>
                    <span className="font-medium text-foreground">
                      {countryLabel(selectedDetailRun.fromCountry)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acceptă nefuncționale (troliu):</span>
                  <span className="font-medium text-foreground">
                    {selectedDetailRun.acceptsNonRunning ? "Da" : "Nu"}
                  </span>
                </div>
                {selectedDetailRun.owner && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dealer:</span>
                    <span className="font-medium text-foreground">
                      {selectedDetailRun.owner.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes section (handles 480-character text gracefully) */}
              {selectedDetailRun.notes && (
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    Notă cursă
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg text-[13px] text-foreground leading-relaxed whitespace-pre-line break-words">
                    {selectedDetailRun.notes}
                  </div>
                </div>
              )}

              {/* Actions in Sheet */}
              <div className="pt-2 flex flex-col gap-2">
                {/* If browse run */}
                {activeSegment === "curse" && (
                  <>
                    {selectedDetailRun.myInterest === true ||
                    interestedRunIds.has(selectedDetailRun.id) ? (
                      <div className="flex gap-2">
                        <div className="flex-1 min-h-[44px] rounded-lg bg-success-light text-success flex items-center justify-center font-medium text-[13px]">
                          Interes deja trimis
                        </div>
                        {selectedDetailRun.owner?.contactPhone && (
                          <a
                            href={`tel:${selectedDetailRun.owner.contactPhone}`}
                            className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2 font-medium text-[13px]"
                          >
                            <Phone className="w-4 h-4" />
                            Sună dealerul
                          </a>
                        )}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => {
                          const run = selectedDetailRun;
                          setSelectedDetailRun(null);
                          setInterestModalRun(run);
                        }}
                        className="w-full min-h-[48px] bg-primary text-primary-foreground font-semibold text-[15px]"
                      >
                        Mă interesează această cursă
                      </Button>
                    )}
                  </>
                )}

                {/* If my run */}
                {activeSegment === "alemele" && (
                  <div className="flex flex-col gap-2">
                    {(selectedDetailRun.interestCount ?? 0) > 0 && (
                      <Button
                        type="button"
                        onClick={() => {
                          const run = selectedDetailRun;
                          setSelectedDetailRun(null);
                          setViewInterestsRun(run);
                        }}
                        className="w-full min-h-[44px] bg-primary text-primary-foreground font-semibold text-[15px]"
                      >
                        Vezi{" "}
                        {roCount(
                          selectedDetailRun.interestCount ?? 0,
                          "dealer interesat",
                          "dealeri interesați"
                        )}
                      </Button>
                    )}
                    {selectedDetailRun.status === "OPEN" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const run = selectedDetailRun;
                          setSelectedDetailRun(null);
                          setRunToClose(run);
                        }}
                        className="w-full min-h-[44px] bg-card border border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold text-[15px]"
                      >
                        Închide cursa
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDetailRun(null)}
                  className="w-full min-h-[44px] bg-card border border-border text-foreground font-medium text-[14px]"
                >
                  Închide
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* DESTRUCTIVE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={!!runToClose} onOpenChange={(open) => !open && setRunToClose(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground max-w-sm rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[17px] font-semibold text-foreground">
              Închizi cursa?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground">
              Ești sigur că vrei să închizi cursa {runToClose?.fromCity} → {runToClose?.toCity}? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="min-h-[44px] bg-card border border-border text-foreground font-medium">
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (runToClose) {
                  closeRunMutation.mutate(runToClose.id);
                  setRunToClose(null);
                }
              }}
              className="min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium"
            >
              Închide cursa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* POST TRANSPORT RUN MODAL */}
      <PostTransportRunModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={(data) => createRunMutation.mutate(data)}
      />

      {/* TRANSPORT INTEREST MODAL */}
      <TransportInterestModal
        isOpen={interestModalRun !== null}
        onClose={() => setInterestModalRun(null)}
        run={interestModalRun}
        onSubmit={(data) =>
          expressInterestMutation.mutate({
            runId: interestModalRun!.id,
            seatsRequested: data.seatsRequested,
            note: data.note,
          })
        }
      />

      {/* VIEW INTERESTS MODAL */}
      <ViewInterestsModal
        isOpen={viewInterestsRun !== null}
        onClose={handleCloseViewInterests}
        run={viewInterestsRun}
        onConverse={(payload) => converseMutation.mutate(payload)}
      />
    </div>
  );
}
