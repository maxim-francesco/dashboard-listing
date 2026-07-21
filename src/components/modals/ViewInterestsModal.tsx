import { useQuery } from "@tanstack/react-query";
import { getTransportRunInterests, TransportInterest } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Phone, Mail, MapPin } from "lucide-react";
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
          <DialogTitle className="text-foreground">Interese Cursă</DialogTitle>
          <DialogDescription>
            Dealers interesați de cursa: <span className="font-semibold">{run?.fromCity} → {run?.toCity}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !interests || interests.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground italic text-sm">
            Niciun dealer nu și-a exprimat interesul pentru această cursă încă.
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {interests.map((interest) => {
              const dealer = interest.dealer;
              const hasPhone = !!dealer?.contactPhone;
              const hasEmail = !!dealer?.contactEmail;

              return (
                <div key={interest.id} className="border border-border rounded-lg p-4 bg-background space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{dealer?.name || "Dealer necunoscut"}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{dealer?.city || "Oraș nespecificat"}</span>
                      </div>
                    </div>
                    <div className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">
                      {interest.seatsRequested} {interest.seatsRequested === 1 ? "loc" : "locuri"}
                    </div>
                  </div>

                  {interest.note && (
                    <p className="text-sm text-foreground bg-muted p-2 rounded italic">
                      "{interest.note}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                      {hasPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a href={`tel:${dealer.contactPhone}`} className="hover:underline text-primary">
                            {dealer.contactPhone}
                          </a>
                        </div>
                      )}
                      {hasEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a href={`mailto:${dealer.contactEmail}`} className="hover:underline text-primary">
                            {dealer.contactEmail}
                          </a>
                        </div>
                      )}
                    </div>

                    {dealer?.id && onConverse && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold h-8"
                        onClick={() => {
                          onConverse({
                            otherBusinessId: dealer.id,
                            contextType: "TRANSPORT",
                            contextId: run?.id,
                          });
                          onClose();
                        }}
                      >
                        Conversează
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="outline">
            Închide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInterestsModal;
