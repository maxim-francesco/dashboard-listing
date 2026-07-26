import { useQuery } from "@tanstack/react-query";
import { getTransportRunInterests, TransportInterest } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Phone, MessageSquare } from "lucide-react";
import { roCount } from "@/lib/plural";
import { Button } from "@/components/ui/button";

interface ViewInterestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: any | null;
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="bg-popover border-border text-foreground max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-semibold text-foreground text-left">Cine e interesat</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground text-left mt-1">
            {run?.fromCity} → {run?.toCity}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !interests || interests.length === 0 ? (
          <div className="text-[15px] text-muted-foreground text-center py-6">
            Încă nu s-a interesat nimeni.
          </div>
        ) : (
          <div className="border-t border-border divide-y divide-border">
            {interests.map((interest) => {
              const dealer = interest.dealer;
              const name = dealer?.name || "Dealer necunoscut";
              const hasPhone = !!dealer?.contactPhone;
              const cityText = dealer?.city ? ` · ${dealer.city}` : "";

              return (
                <div key={interest.id} className="py-3 flex items-center justify-between gap-4 text-left">
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-medium text-foreground truncate">
                      {name}
                    </div>
                    <div className="text-[13px] text-muted-foreground truncate mt-0.5">
                      {roCount(interest.seatsRequested, "loc", "locuri")}{cityText}
                    </div>
                    {interest.note && (
                      <div className="text-[13px] text-foreground mt-1">
                        «{interest.note}»
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasPhone && (
                      <a
                        href={`tel:${dealer.contactPhone}`}
                        className="w-11 h-11 rounded-full bg-success-light text-success flex items-center justify-center hover:opacity-90"
                        aria-label={`Sună pe ${name}`}
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                    {dealer?.id && onConverse && (
                      <button
                        type="button"
                        className="w-11 h-11 rounded-full bg-primary-light text-primary flex items-center justify-center hover:opacity-90"
                        onClick={() => {
                          onConverse({
                            otherBusinessId: dealer.id,
                            contextType: "TRANSPORT",
                            contextId: run?.id,
                          });
                          onClose();
                        }}
                        aria-label={`Scrie lui ${name}`}
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button 
            onClick={onClose} 
            className="w-full bg-card border border-border text-foreground hover:bg-accent min-h-[44px] text-[15px] font-semibold"
          >
            Închide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInterestsModal;
