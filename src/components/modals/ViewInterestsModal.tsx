import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTransportRunInterests, TransportInterest, TransportRun } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Phone, MessageSquare } from "lucide-react";
import { roCount } from "@/lib/plural";
import { relativeTime } from "@/lib/relativeTime";
import { Button } from "@/components/ui/button";
import { CARD } from "@/components/today/cardRecipe";
import { cn } from "@/lib/utils";

interface ViewInterestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: TransportRun | null;
  onConverse?: (payload: {
    otherBusinessId: string;
    contextType: "GENERAL" | "TRANSPORT";
    contextId: string | null;
  }) => void;
}

const ViewInterestsModal = ({ isOpen, onClose, run, onConverse }: ViewInterestsModalProps) => {
  const { data: interests, isLoading } = useQuery<TransportInterest[]>({
    queryKey: ["transport-run-interests", run?.id],
    queryFn: () => getTransportRunInterests(run!.id),
    enabled: isOpen && !!run?.id,
  });

  const totalSeatsRequested =
    interests?.reduce((acc, i) => acc + (i.seatsRequested || 0), 0) ?? 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-left pb-1">
          <DialogTitle className="text-[17px] font-semibold text-foreground text-left">
            Cine e interesat
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground text-left mt-0.5 space-y-0.5">
            <span className="block text-foreground font-medium">
              {run?.fromCity} → {run?.toCity}
            </span>
            {run && (
              <span className="block tabular-nums">
                {roCount(totalSeatsRequested, "loc solicitat", "locuri solicitate")} · {run.seatsAvailable} din {run.seatsTotal} locuri libere
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !interests || interests.length === 0 ? (
          <div className={cn(CARD, "p-6 text-center")}>
            <p className="text-[13px] text-muted-foreground">
              Încă nu s-a interesat nimeni de această cursă.
            </p>
          </div>
        ) : (
          <div className={cn(CARD, "overflow-hidden")}>
            {interests.map((interest, idx) => {
              const dealer = interest.dealer;
              const name = dealer?.name || "Dealer necunoscut";
              const hasPhone = !!dealer?.contactPhone;
              const isUnseen = !interest.isSeen;

              return (
                <Fragment key={interest.id}>
                  {idx > 0 && <div className="border-t border-border/40 ml-4" />}
                  <div className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left select-none gap-3">
                    <div className="flex-1 min-w-0 pr-1">
                      {/* Line 1: Dealer name (with unseen dot) + Requested seats */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-[15px] font-medium text-foreground truncate">
                            {name}
                          </span>
                          {isUnseen && (
                            <span
                              aria-label="Nou"
                              className="w-2 h-2 rounded-full bg-destructive shrink-0"
                            />
                          )}
                        </div>
                        <span className="text-[15px] font-semibold text-foreground tabular-nums text-right shrink-0">
                          {roCount(interest.seatsRequested, "loc", "locuri")}
                        </span>
                      </div>

                      {/* Line 2: Relative time + Note (truncated, no guillemets) */}
                      <div className="text-[12px] text-muted-foreground truncate mt-0.5 flex items-center gap-1.5">
                        <span className="shrink-0 tabular-nums">
                          {relativeTime(interest.createdAt)}
                        </span>
                        {dealer?.city && (
                          <span className="shrink-0">· {dealer.city}</span>
                        )}
                        {interest.note && (
                          <>
                            <span className="shrink-0">·</span>
                            <span className="truncate">{interest.note}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {hasPhone && (
                        <a
                          href={`tel:${dealer.contactPhone}`}
                          className="w-11 h-11 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors min-h-[44px] min-w-[44px]"
                          aria-label={`Sună pe ${name}`}
                        >
                          <Phone className="w-5 h-5 text-foreground" />
                        </a>
                      )}
                      {dealer?.id && onConverse && (
                        <button
                          type="button"
                          className="w-11 h-11 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors min-h-[44px] min-w-[44px]"
                          onClick={() => {
                            onConverse({
                              otherBusinessId: dealer.id,
                              contextType: "TRANSPORT",
                              contextId: run?.id || null,
                            });
                            onClose();
                          }}
                          aria-label={`Scrie lui ${name}`}
                        >
                          <MessageSquare className="w-5 h-5 text-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full bg-card border border-border text-foreground hover:bg-muted min-h-[48px] text-[15px] font-semibold"
          >
            Închide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInterestsModal;
