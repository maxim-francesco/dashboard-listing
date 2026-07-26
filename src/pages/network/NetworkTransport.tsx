import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Phone, Plus } from "lucide-react";
import {
  getTransportRuns,
  getMyTransportRuns,
  expressTransportInterest,
  createTransportRun,
  updateTransportRun,
  getNetworkSummary,
  getOrCreateConversation,
  TransportRun
} from "@/services/api";
import { roCount } from "@/lib/plural";
import { formatEur } from "@/lib/format";
import { relativeDay } from "@/lib/relativeTime";
import { TRANSPORT_TYPE_LABELS } from "@/lib/transportConstants";
import { toast } from "react-hot-toast";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";

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

  // In-memory set to track runs we've interested in this session (or got 409 already interested)
  const [interestedRunIds, setInterestedRunIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [interestModalRun, setInterestModalRun] = useState<TransportRun | null>(null);
  const [viewInterestsRun, setViewInterestsRun] = useState<TransportRun | null>(null);

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
    }
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
    }
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
    }
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
    }
  });

  // Parse unseen runs from network summary action items
  const unseenRunIds = new Set(
    networkSummary?.actionItems
      ?.filter((item: any) => item.type === "TRANSPORT_INTEREST")
      ?.map((item: any) => item.id) || []
  );

  // Sorting and filtering client-side
  const sortedRuns = useMemo(() => {
    if (!runs) return [];
    const filtered = kindFilter
      ? runs.filter(run => run.kind === kindFilter)
      : runs;
    return [...filtered].sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
  }, [runs, kindFilter]);

  const sortedMyRuns = myRuns
    ? [...myRuns].sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())
    : [];

  // Seen-marking close handler
  const handleCloseViewInterests = () => {
    setViewInterestsRun(null);
    queryClient.invalidateQueries({ queryKey: ["my-transport-runs"] });
    queryClient.invalidateQueries({ queryKey: ["transport-interests-count"] });
    queryClient.invalidateQueries({ queryKey: ["network-summary"] });
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
            <h1 className="text-[20px] font-semibold">Transport</h1>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Găsește curse sau anunță una de-a ta.
          </p>
        </div>
        {isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[15px] text-center">
            A apărut o eroare la încărcarea curselor de transport. Vă rugăm să încercați din nou.
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
          <h1 className="text-[20px] font-semibold">Transport</h1>
        </div>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Găsește curse sau anunță una de-a ta.
        </p>
      </div>

      {/* 2) SEGMENTS */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSegment("curse")}
          className={`flex-1 min-h-[44px] rounded-lg text-[15px] font-medium transition-colors ${
            activeSegment === "curse"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          }`}
        >
          Curse ({runs?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveSegment("alemele")}
          className={`flex-1 min-h-[44px] rounded-lg text-[15px] font-medium transition-colors ${
            activeSegment === "alemele"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          }`}
        >
          Ale mele ({myRuns?.length ?? 0})
        </button>
      </div>

      <button
        onClick={() => setIsPostModalOpen(true)}
        className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground text-[16px] font-semibold flex items-center justify-center gap-2 mt-3 mb-1"
      >
        <Plus className="w-5 h-5" />
        Anunță o cursă
      </button>

      {/* 3) SEGMENT "CURSE" (Browse) */}
      {activeSegment === "curse" && (
        <div className="space-y-4">
          {/* a) Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setKindFilter(undefined)}
              className={`min-h-[36px] px-4 rounded-full text-[13px] font-medium transition-colors border shrink-0 ${
                kindFilter === undefined
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground"
              }`}
            >
              Toate
            </button>
            <button
              onClick={() => setKindFilter("OFFER")}
              className={`min-h-[36px] px-4 rounded-full text-[13px] font-medium transition-colors border shrink-0 ${
                kindFilter === "OFFER"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground"
              }`}
            >
              Duce mașini
            </button>
            <button
              onClick={() => setKindFilter("REQUEST")}
              className={`min-h-[36px] px-4 rounded-full text-[13px] font-medium transition-colors border shrink-0 ${
                kindFilter === "REQUEST"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground"
              }`}
            >
              Caută transport
            </button>
          </div>

          {isLoadingRuns ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[15px] text-muted-foreground">Se încarcă...</span>
            </div>
          ) : sortedRuns.length === 0 ? (
            /* c) Empty */
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[15px] text-foreground">Nu sunt curse disponibile acum.</p>
              {kindFilter !== undefined && (
                <p className="text-[13px] text-muted-foreground mt-1">Încearcă «Toate».</p>
              )}
            </div>
          ) : (
            /* b) List */
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex flex-col">
                {sortedRuns.map((run, idx) => {
                  const relDay = relativeDay(run.departureDate);
                  const isWarning = relDay === "azi" || relDay === "mâine";

                  return (
                    <div
                      key={run.id}
                      className={`flex items-center justify-between px-4 py-3 gap-3 min-h-[64px] ${
                        idx > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      {/* Left Info Column */}
                      <div className="flex-1 min-w-0">
                        {/* Line 1 */}
                        <div className="text-[15px] font-medium truncate text-foreground">
                          {run.fromCity} → {run.toCity}
                        </div>
                        {/* Line 2 */}
                        <div className="text-[13px] text-muted-foreground truncate mt-0.5">
                          pleacă{" "}
                          <span className={isWarning ? "text-warning font-medium" : ""}>
                            {relDay}
                          </span>
                          {run.pricePerCar !== null && ` · ${formatEur(run.pricePerCar)}/mașină`}
                        </div>
                        {/* Line 3 */}
                        <div className="text-[13px] text-muted-foreground truncate mt-0.5">
                          {run.owner?.name || "Dealer"}
                          {run.transportType && ` · ${TRANSPORT_TYPE_LABELS[run.transportType]}`}
                        </div>
                      </div>

                      {/* Right Action Button / Status */}
                      {run.myInterest === true || interestedRunIds.has(run.id) ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[13px] text-success font-medium">Interes trimis</span>
                          {run.owner?.contactPhone && (
                            <a
                              href={`tel:${run.owner.contactPhone}`}
                              className="w-11 h-11 rounded-full bg-success-light text-success flex items-center justify-center shrink-0"
                              aria-label={`Sună pe ${run.owner.name}`}
                            >
                              <Phone className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setInterestModalRun(run)}
                          className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 shrink-0"
                        >
                          Mă interesează
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4) SEGMENT "ALE MELE" */}
      {activeSegment === "alemele" && (
        <div className="space-y-4">

          {isLoadingMyRuns ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[15px] text-muted-foreground">Se încarcă...</span>
            </div>
          ) : sortedMyRuns.length === 0 ? (
            /* c) Empty */
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[15px] text-foreground">Nu ai nicio cursă anunțată.</p>
            </div>
          ) : (
            /* b) List of my runs */
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex flex-col">
                {sortedMyRuns.map((run, idx) => {
                  const relDay = relativeDay(run.departureDate);
                  const isWarning = relDay === "azi" || relDay === "mâine";
                  const hasUnseen = unseenRunIds.has(run.id);

                  return (
                    <div
                      key={run.id}
                      className={`flex flex-col px-4 py-3 gap-2 ${
                        idx > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 min-h-[64px]">
                        {/* Left Info Column */}
                        <div className="flex-1 min-w-0">
                          {/* Line 1 */}
                          <div className="text-[15px] font-medium truncate text-foreground">
                            {run.fromCity} → {run.toCity}
                          </div>
                          {/* Line 2 */}
                          <div className="text-[13px] text-muted-foreground truncate mt-0.5">
                            pleacă{" "}
                            <span className={isWarning ? "text-warning font-medium" : ""}>
                              {relDay}
                            </span>
                            {run.pricePerCar !== null && ` · ${formatEur(run.pricePerCar)}/mașină`}
                          </div>
                          {/* Line 3 */}
                          <div className="text-[13px] text-muted-foreground truncate mt-0.5">
                            {roCount(run.seatsTotal, "loc", "locuri")}
                            {run.status === "CLOSED" && (
                              <span className="text-muted-foreground"> · închisă</span>
                            )}
                          </div>
                        </div>

                        {/* Right Interest Trigger */}
                        <div className="shrink-0 flex items-center">
                          {(run.interestCount ?? 0) > 0 ? (
                            <button
                              onClick={() => setViewInterestsRun(run)}
                              className="relative min-h-[44px] px-4 rounded-lg bg-primary-light text-primary text-[13px] font-medium hover:bg-primary-light/80"
                            >
                              {roCount(run.interestCount ?? 0, "interesat", "interesați")}
                              {hasUnseen && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[13px] text-muted-foreground">
                              Niciun interes încă
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Închide cursa button below the row */}
                      {run.status === "OPEN" && (
                        <div className="flex justify-start">
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Închizi cursa ${run.fromCity} → ${run.toCity}?`
                                )
                              ) {
                                closeRunMutation.mutate(run.id);
                              }
                            }}
                            className="text-[13px] text-muted-foreground min-h-[44px] font-medium hover:text-foreground"
                          >
                            Închide cursa
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Transport Run Modal */}
      <PostTransportRunModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={(data) => createRunMutation.mutate(data)}
      />

      {/* Transport Interest Modal */}
      <TransportInterestModal
        isOpen={interestModalRun !== null}
        onClose={() => setInterestModalRun(null)}
        run={interestModalRun}
        onSubmit={(data) =>
          expressInterestMutation.mutate({
            runId: interestModalRun!.id,
            seatsRequested: data.seatsRequested,
            note: data.note
          })
        }
      />

      {/* View Interests Modal */}
      <ViewInterestsModal
        isOpen={viewInterestsRun !== null}
        onClose={handleCloseViewInterests}
        run={viewInterestsRun}
        onConverse={(payload) => converseMutation.mutate(payload)}
      />
    </div>
  );
}
