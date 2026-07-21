import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Loader2, MessageSquare } from "lucide-react";

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
    <div className="flex gap-3 bg-muted/40 border border-border p-2 rounded-md mt-1.5 max-w-sm">
      <div className="w-16 h-12 shrink-0 bg-muted rounded overflow-hidden">
        {car.image ? (
          <img src={car.image} alt={car.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-[8px] italic">Fără foto</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-xs">
        <div className="font-bold truncate text-foreground">{car.title}</div>
        <div className="text-muted-foreground mt-0.5">
          {car.year ? `${car.year} · ` : ""}{car.mileage ? `${car.mileage.toLocaleString()} km` : ""}
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

  const getRoleClass = (role: string) => {
    return role === "SELLER" 
      ? "bg-purple-500/10 text-purple-600 hover:bg-purple-500/10 border-purple-500/20" 
      : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 border-blue-500/20";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN": return "În negociere";
      case "ACCEPTED": return "Acceptată";
      case "DECLINED": return "Refuzată";
      case "CANCELLED": return "Anulată";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-amber-500/20";
      case "ACCEPTED": return "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20";
      case "DECLINED": return "bg-rose-500/10 text-rose-600 hover:bg-rose-50/10 border-rose-500/20";
      case "CANCELLED": return "bg-slate-500/10 text-slate-600 hover:bg-slate-500/10 border-slate-500/20";
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getProposalStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Curentă";
      case "SUPERSEDED": return "Depășită";
      case "ACCEPTED": return "Acceptată";
      case "DECLINED": return "Refuzată";
      default: return status;
    }
  };

  const getProposalStatusClass = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "SUPERSEDED": return "bg-muted text-muted-foreground border-border";
      case "ACCEPTED": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "DECLINED": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
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
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <DialogTitle className="text-foreground flex items-center gap-2">
                  Detaliu Negociere
                </DialogTitle>
                <div className="flex items-center gap-1.5">
                  <Badge className={cn("text-[10px] font-bold px-2 py-0.5", getRoleClass(negotiation.role))}>
                    {negotiation.role === "SELLER" ? "Vânzător" : "Cumpărător"}
                  </Badge>
                  <Badge className={cn("text-[10px] font-bold px-2 py-0.5", getStatusClass(negotiation.status))}>
                    {getStatusLabel(negotiation.status)}
                  </Badge>
                </div>
              </div>
              <DialogDescription className="text-left">
                Negociere cu {negotiation.counterparty?.name || "Dealer rețea"}{" "}
                {negotiation.counterparty?.city ? `(${negotiation.counterparty.city})` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Target Car Context panel */}
              {negotiation.car && (
                <div className="flex gap-4 p-3 bg-muted/40 border border-border rounded-lg">
                  <div className="w-20 h-16 shrink-0 bg-muted rounded overflow-hidden relative">
                    {negotiation.car.image ? (
                      <img src={negotiation.car.image} alt={negotiation.car.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] italic">
                        Fără imagine
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-bold text-foreground text-sm truncate leading-snug">{negotiation.car.title}</div>
                    <p className="text-muted-foreground mt-0.5">
                      {negotiation.car.year ? `${negotiation.car.year} · ` : ""}{negotiation.car.mileage ? `${negotiation.car.mileage.toLocaleString()} km` : ""}
                    </p>
                    <p className="text-foreground mt-1.5 font-semibold">
                      Preț listă: {negotiation.car.price ? `${negotiation.car.price.toLocaleString()} €` : "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Proposal History (Timeline, oldest -> newest) */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-foreground">Istoric Propuneri</h4>
                <div className="relative border-l border-border pl-4 ml-2 space-y-4">
                  {[...negotiation.proposals]
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((proposal) => {
                      const dateStr = format(new Date(proposal.createdAt), "d MMM yyyy, HH:mm", { locale: ro });
                      return (
                        <div key={proposal.id} className="relative">
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border bg-background",
                            proposal.status === "PENDING" ? "border-blue-500 bg-blue-500" : "border-muted-foreground/30 bg-muted/50"
                          )} />

                          <div className="bg-card border border-border/80 p-3 rounded-lg space-y-2 shadow-sm text-xs text-left">
                            <div className="flex justify-between items-start gap-2 flex-wrap">
                              <span className="font-bold text-foreground">
                                {proposal.fromMe ? "Tu" : (proposal.proposer?.name || "Dealer")}
                              </span>
                              <div className="flex items-center gap-1">
                                <Badge className="text-[9px] font-semibold bg-muted/60 text-muted-foreground hover:bg-muted/60 px-1.5 py-0 border-none">
                                  {proposal.kind === "BUY" ? "Cumpărare" : "Schimb"}
                                </Badge>
                                <Badge className={cn("text-[9px] font-bold px-1.5 py-0", getProposalStatusClass(proposal.status))}>
                                  {getProposalStatusLabel(proposal.status)}
                                </Badge>
                              </div>
                            </div>

                            <div className="text-foreground font-medium">
                              {proposal.kind === "BUY" ? (
                                <span>Ofertă preț: <strong>{formatPrice(proposal.offeredPrice || 0)}</strong></span>
                              ) : (
                                <div className="space-y-1">
                                  <div>
                                    Oferă la schimb: <strong>{proposal.offeredCar?.title || "Schimb"}</strong>
                                    {proposal.offeredPrice && proposal.offeredPrice > 0 
                                      ? ` + ${formatPrice(proposal.offeredPrice)}` 
                                      : ""}
                                  </div>
                                  <MiniCarCard car={proposal.offeredCar} />
                                </div>
                              )}
                            </div>

                            {proposal.note && (
                              <div className="bg-muted/20 border border-border/40 p-2 rounded text-[11px] text-muted-foreground italic">
                                "{proposal.note}"
                              </div>
                            )}

                            <div className="text-[10px] text-muted-foreground text-right">
                              {dateStr}
                            </div>
                          </div>
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

              {/* Action Buttons or Inline Form (only when status is OPEN) */}
              {negotiation.status === "OPEN" && (
                <div className="pt-4 border-t border-border space-y-4">
                  {showCounterForm ? (
                    <Form {...counterForm}>
                      <form onSubmit={counterForm.handleSubmit(handleCounterSubmit)} className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border">
                        <h5 className="font-semibold text-sm text-foreground text-left">Propune o contraofertă</h5>
                        <OfferFields
                          control={counterForm.control}
                          register={counterForm.register}
                          kind={counterForm.watch("kind")}
                          setValue={counterForm.setValue}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCounterForm(false)}
                            disabled={counterMutation.isPending}
                          >
                            Anulează
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={counterMutation.isPending}
                          >
                            {counterMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                            Trimite
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-3">
                      {negotiation.awaitingMyResponse ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 text-xs font-semibold"
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
                            variant="destructive"
                            className="flex-1 text-xs font-semibold"
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
                          <Button
                            variant="outline"
                            className="flex-1 text-xs font-semibold text-foreground"
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
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-semibold text-muted-foreground hover:text-rose-600 hover:bg-rose-50/50"
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
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 flex flex-row items-center justify-between gap-2 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border shadow-sm"
                onClick={() => {
                  onConverse(negotiation.tradeListingId, negotiation.counterparty?.id || "");
                  onClose();
                }}
              >
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                Conversează
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="text-xs text-foreground"
                onClick={onClose}
              >
                Închide
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NegotiationDetailModal;
