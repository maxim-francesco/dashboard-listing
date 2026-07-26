import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Loader2, MessageSquare, Car } from "lucide-react";
import { formatEur } from "@/lib/format";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { OfferFields } from "../trade/OfferFields";
import {
  getNegotiation,
  acceptNegotiation,
  declineNegotiation,
  counterNegotiation,
  cancelNegotiation
} from "@/services/api";
import { cn } from "@/lib/utils";

// Counter form schema (same as MakeOfferModal)
const counterFormSchema = z.object({
  kind: z.enum(["BUY", "EXCHANGE"]).default("BUY"),
  offeredPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
    z.number().nullable().optional()
  ),
  offeredListingId: z.string().nullable().optional(),
  note: z.string().max(1000, "Mesajul este prea lung.").optional().nullable(),
}).refine(
  (data) => {
    if (data.kind === "BUY") {
      return data.offeredPrice !== null && data.offeredPrice !== undefined && data.offeredPrice > 0;
    }
    return true;
  },
  {
    message: "Prețul oferit este obligatoriu și trebuie să fie mai mare decât 0.",
    path: ["offeredPrice"],
  }
).refine(
  (data) => {
    if (data.kind === "EXCHANGE") {
      return data.offeredListingId !== null && data.offeredListingId !== undefined && data.offeredListingId !== "";
    }
    return true;
  },
  {
    message: "Trebuie să selectați o mașină din inventar pentru schimb.",
    path: ["offeredListingId"],
  }
).refine(
  (data) => {
    if (data.kind === "EXCHANGE") {
      return data.offeredPrice !== null && data.offeredPrice !== undefined && data.offeredPrice >= 0;
    }
    return true;
  },
  {
    message: "Diferența cash nu poate fi negativă.",
    path: ["offeredPrice"],
  }
);

type CounterFormValues = z.infer<typeof counterFormSchema>;

interface NegotiationDetailModalProps {
  negotiationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConverse: (tradeListingId: string, counterpartyId: string) => void;
}

const MiniCarCard = ({ car }: { car: any }) => {
  if (!car) return null;
  return (
    <div className="flex gap-3 bg-muted/40 border border-border p-2 rounded-md mt-1.5 max-w-sm text-left">
      <div className="w-16 h-12 shrink-0 bg-muted rounded-md overflow-hidden flex items-center justify-center">
        {car.image ? (
          <img src={car.image} alt={car.title} className="w-full h-full object-cover" />
        ) : (
          <Car className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-foreground leading-snug">
          {formatEur(car.price)}
        </div>
        <div className="text-[13px] text-foreground truncate">{car.title}</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">
          {[
            car.year,
            car.mileage !== null && car.mileage !== undefined
              ? `${Intl.NumberFormat("ro-RO").format(car.mileage)} km`
              : null
          ].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
};

const NegotiationDetailModal = ({ negotiationId, isOpen, onClose, onConverse }: NegotiationDetailModalProps) => {
  const queryClient = useQueryClient();
  const [showCounterForm, setShowCounterForm] = useState(false);

  const { data: negotiation, isLoading } = useQuery({
    queryKey: ["negotiation", negotiationId],
    queryFn: () => getNegotiation(negotiationId!),
    enabled: !!negotiationId && isOpen,
    refetchInterval: 8000,
  });

  const counterForm = useForm<CounterFormValues>({
    resolver: zodResolver(counterFormSchema),
    defaultValues: {
      kind: "BUY",
      offeredPrice: null,
      offeredListingId: "",
      note: "",
    },
  });

  // Reset form when changing state
  useEffect(() => {
    if (!showCounterForm) {
      counterForm.reset({
        kind: "BUY",
        offeredPrice: null,
        offeredListingId: "",
        note: "",
      });
    }
  }, [showCounterForm, counterForm]);

  const acceptMutation = useMutation({
    mutationFn: () => acceptNegotiation(negotiationId!),
    onSuccess: () => {
      toast.success("Negociere acceptată.");
      queryClient.invalidateQueries({ queryKey: ["negotiation", negotiationId] });
      queryClient.invalidateQueries({ queryKey: ["negotiations"] });
      queryClient.invalidateQueries({ queryKey: ["pending-proposals-count"] });
      queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
      queryClient.invalidateQueries({ queryKey: ["my-trade"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Nu s-a putut accepta oferta.");
    }
  });

  const declineMutation = useMutation({
    mutationFn: () => declineNegotiation(negotiationId!),
    onSuccess: () => {
      toast.success("Ofertă refuzată.");
      queryClient.invalidateQueries({ queryKey: ["negotiation", negotiationId] });
      queryClient.invalidateQueries({ queryKey: ["negotiations"] });
      queryClient.invalidateQueries({ queryKey: ["pending-proposals-count"] });
      queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
      queryClient.invalidateQueries({ queryKey: ["my-trade"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Nu s-a putut refuza oferta.");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelNegotiation(negotiationId!),
    onSuccess: () => {
      toast.success("Negociere anulată.");
      queryClient.invalidateQueries({ queryKey: ["negotiation", negotiationId] });
      queryClient.invalidateQueries({ queryKey: ["negotiations"] });
      queryClient.invalidateQueries({ queryKey: ["pending-proposals-count"] });
      queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
      queryClient.invalidateQueries({ queryKey: ["my-trade"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Nu s-a putut anula negocierea.");
    }
  });

  const counterMutation = useMutation({
    mutationFn: (payload: any) => counterNegotiation(negotiationId!, payload),
    onSuccess: () => {
      toast.success("Contraofertă trimisă.");
      setShowCounterForm(false);
      queryClient.invalidateQueries({ queryKey: ["negotiation", negotiationId] });
      queryClient.invalidateQueries({ queryKey: ["negotiations"] });
      queryClient.invalidateQueries({ queryKey: ["pending-proposals-count"] });
      queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
      queryClient.invalidateQueries({ queryKey: ["my-trade"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Nu s-a putut trimite contraoferta.");
    }
  });

  const handleCounterSubmit = (values: CounterFormValues) => {
    const payload = {
      kind: values.kind,
      offeredPrice: values.kind === "BUY" 
        ? values.offeredPrice 
        : (values.offeredPrice ?? 0),
      offeredListingId: values.kind === "EXCHANGE" 
        ? (values.offeredListingId || null) 
        : null,
      note: values.note && values.note.trim() !== "" ? values.note : null,
    };
    counterMutation.mutate(payload);
  };



  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setShowCounterForm(false);
        onClose();
      }
    }}>
      <DialogContent className="bg-popover border-border max-w-lg max-h-[85vh] overflow-y-auto">
        {isLoading && !negotiation ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !negotiation ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Negocierea nu a fost găsită.
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-[17px] font-semibold text-foreground truncate text-left">
                {negotiation.car?.title || "Negociere"}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground text-left mt-1">
                {(() => {
                  const roleText = negotiation.role === "SELLER" ? "Tu vinzi" : "Tu cumperi";
                  const partnerName = negotiation.counterparty?.name || "";
                  let stateText = "";
                  if (negotiation.status !== "OPEN") {
                    if (negotiation.status === "ACCEPTED") stateText = " · acceptată";
                    else if (negotiation.status === "DECLINED") stateText = " · refuzată";
                    else if (negotiation.status === "CANCELLED") stateText = " · anulată";
                  }
                  return `${roleText} · ${partnerName}${stateText}`;
                })()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Target Car Context panel */}
              {negotiation.car && (
                <div className="flex gap-4 p-3 bg-muted/40 border border-border rounded-lg">
                  <div className="w-[80px] h-[64px] shrink-0 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    {negotiation.car.image ? (
                      <img src={negotiation.car.image} alt={negotiation.car.title} className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-[17px] font-semibold text-foreground leading-snug">
                      {formatEur(negotiation.car.price)}
                    </div>
                    <div className="text-[15px] text-foreground truncate mt-0.5">{negotiation.car.title}</div>
                    <div className="text-[13px] text-muted-foreground mt-0.5">
                      {[
                        negotiation.car.year,
                        negotiation.car.mileage !== null && negotiation.car.mileage !== undefined
                          ? `${Intl.NumberFormat("ro-RO").format(negotiation.car.mileage)} km`
                          : null
                      ].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              )}

              {/* Proposal History */}
              <div className="space-y-3">
                <h4 className="text-[15px] font-semibold text-foreground text-left">Ce s-a oferit</h4>
                <div className="border-t border-border divide-y divide-border">
                  {[...negotiation.proposals]
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((proposal) => {
                      const dateStr = format(new Date(proposal.createdAt), "d MMM, HH:mm", { locale: ro });
                      const isLatest = proposal.status === "PENDING";
                      const name = proposal.proposer?.name || "Dealer";
                      const proposalText = proposal.fromMe
                        ? (isLatest ? "Tu oferi" : "Tu ai oferit")
                        : (isLatest ? `${name} oferă` : `${name} a oferit`);
                      const isExchange = proposal.kind === "EXCHANGE";

                      return (
                        <div key={proposal.id} className="py-3 text-left">
                          <div className="text-[15px] text-foreground">
                            {proposalText} {formatEur(proposal.offeredPrice || 0)}
                            {isExchange && " (schimb)"}
                          </div>
                          {isExchange && proposal.offeredCar && (
                            <MiniCarCard car={proposal.offeredCar} />
                          )}
                          <div className="text-[13px] text-muted-foreground mt-0.5">
                            {dateStr}
                            {proposal.status === "SUPERSEDED" && " · depășită"}
                          </div>
                          {proposal.note && (
                            <div className="mt-1 text-[13px] text-foreground">
                              «{proposal.note}»
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* ACCEPTED Success Banner */}
              {negotiation.status === "ACCEPTED" && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4 rounded-lg text-sm text-center font-semibold">
                  Ofertă acceptată. Continuați detaliile pe chat.
                </div>
              )}
            </div>

            {/* Actions Block */}
            <div className="pt-4 border-t border-border space-y-2">
              {negotiation.status === "OPEN" && showCounterForm ? (
                <Form {...counterForm}>
                  <form onSubmit={counterForm.handleSubmit(handleCounterSubmit)} className="space-y-4">
                    <h5 className="font-semibold text-sm text-foreground text-left">Propune o contraofertă</h5>
                    <OfferFields
                      control={counterForm.control}
                      register={counterForm.register}
                      kind={counterForm.watch("kind")}
                      setValue={counterForm.setValue}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="flex-1 min-h-[44px] bg-card border border-border text-foreground hover:bg-accent"
                        onClick={() => setShowCounterForm(false)}
                        disabled={counterMutation.isPending}
                      >
                        Anulează
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/95"
                        disabled={counterMutation.isPending}
                      >
                        {counterMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Trimite
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-2">
                  {negotiation.status === "OPEN" && (
                    <>
                      {negotiation.awaitingMyResponse ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            className="bg-success text-success-foreground hover:bg-success/90 min-h-[44px] flex-1 font-semibold text-[15px]"
                            onClick={() => {
                              if (window.confirm("Accepți? Mașina se blochează la schimb.")) {
                                acceptMutation.mutate();
                              }
                            }}
                            disabled={acceptMutation.isPending || declineMutation.isPending || cancelMutation.isPending}
                          >
                            {acceptMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                            Acceptă
                          </Button>
                          <Button
                            type="button"
                            className="bg-card border border-border text-foreground hover:bg-accent min-h-[44px] flex-1 font-semibold text-[15px]"
                            onClick={() => {
                              const latest = negotiation.latestProposal;
                              counterForm.reset({
                                kind: latest?.kind || "BUY",
                                offeredPrice: latest?.kind === "BUY" ? latest.offeredPrice : 0,
                                offeredListingId: "",
                                note: ""
                              });
                              setShowCounterForm(true);
                            }}
                            disabled={acceptMutation.isPending || declineMutation.isPending || cancelMutation.isPending}
                          >
                            Contraofertă
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic text-center py-2 bg-muted/20 rounded border border-border/50">
                          Aștepți răspunsul lui {negotiation.counterparty?.name || "dealerului"}.
                        </p>
                      )}
                    </>
                  )}

                  {/* Refuză button if OPEN and awaiting my response */}
                  {negotiation.status === "OPEN" && negotiation.awaitingMyResponse && (
                    <Button
                      type="button"
                      className="w-full bg-card border border-border text-destructive hover:bg-destructive/10 min-h-[44px] font-semibold text-[15px]"
                      onClick={() => {
                        if (window.confirm("Ești sigur că vrei să refuzi această ofertă?")) {
                          declineMutation.mutate();
                        }
                      }}
                      disabled={acceptMutation.isPending || declineMutation.isPending || cancelMutation.isPending}
                    >
                      {declineMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                      Refuză
                    </Button>
                  )}

                  {/* Scrie-i (Conversează) button */}
                  <Button
                    type="button"
                    className="w-full bg-card border border-border text-foreground hover:bg-accent min-h-[44px] flex items-center justify-center gap-1.5 font-semibold text-[15px]"
                    onClick={() => {
                      onConverse(negotiation.tradeListingId, negotiation.counterparty?.id || "");
                      onClose();
                    }}
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Scrie-i
                  </Button>

                  {/* Renunță (cancel) button if OPEN */}
                  {negotiation.status === "OPEN" && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-[13px] text-muted-foreground hover:text-rose-600 hover:bg-rose-50/50 min-h-[44px] font-semibold"
                      onClick={() => {
                        if (window.confirm("Ești sigur că vrei să renunți la această negociere?")) {
                          cancelMutation.mutate();
                        }
                      }}
                      disabled={acceptMutation.isPending || declineMutation.isPending || cancelMutation.isPending}
                    >
                      {cancelMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                      Renunță
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NegotiationDetailModal;
