import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

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
import { OfferFields } from "../trade/OfferFields";
import { createProposal, TradeListing } from "@/services/api";

const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>;

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: TradeListing | null;
  onCreated: (negotiation: any) => void;
  onExisting: (negotiationId: string) => void;
}

const MakeOfferModal = ({ isOpen, onClose, listing, onCreated, onExisting }: MakeOfferModalProps) => {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kind: "BUY",
      offeredPrice: null,
      offeredListingId: "",
      note: "",
    },
  });

  const kind = form.watch("kind");

  useEffect(() => {
    if (isOpen && listing) {
      form.reset({
        kind: "BUY",
        offeredPrice: null,
        offeredListingId: "",
        note: "",
      });
    }
  }, [listing, isOpen, form]);

  const proposalMutation = useMutation({
    mutationFn: createProposal,
    onSuccess: (data) => {
      toast.success("Ofertă trimisă.");
      queryClient.invalidateQueries({ queryKey: ["negotiations"] });
      queryClient.invalidateQueries({ queryKey: ["pending-proposals-count"] });
      queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
      queryClient.invalidateQueries({ queryKey: ["my-trade"] });
      onCreated(data);
      onClose();
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        toast.error("Ai deja o negociere pentru această mașină.");
        const existingNegId = err.response.data.negotiationId;
        if (existingNegId) {
          onExisting(existingNegId);
        }
        onClose();
      } else {
        toast.error(err.response?.data?.message || "Nu s-a putut trimite oferta.");
      }
    }
  });

  const handleSubmit = (values: FormValues) => {
    if (!listing) return;

    const payload = {
      tradeListingId: listing.id,
      kind: values.kind,
      offeredPrice: values.kind === "BUY" 
        ? values.offeredPrice 
        : (values.offeredPrice ?? 0),
      offeredListingId: values.kind === "EXCHANGE" 
        ? (values.offeredListingId || null) 
        : null,
      note: values.note && values.note.trim() !== "" ? values.note : null,
    };

    proposalMutation.mutate(payload);
  };

  if (!listing) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="bg-popover border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Fă o ofertă B2B</DialogTitle>
          <DialogDescription>
            Propune o tranzacție sau un schimb pentru acest vehicul din rețea.
          </DialogDescription>
        </DialogHeader>

        {/* Target Car Context Panel */}
        <div className="bg-muted/40 border border-border p-3 rounded-lg text-xs space-y-1">
          <div className="font-bold text-foreground">{listing.car.title}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground mt-0.5">
            <span>Preț public: <strong>{listing.car.price ? `${listing.car.price.toLocaleString()} €` : "—"}</strong></span>
            {listing.b2bPrice && (
              <span className="text-emerald-600 font-semibold">Preț B2B: {listing.b2bPrice.toLocaleString()} €</span>
            )}
            <span>Dealer: <strong>{listing.owner?.name || "Necunoscut"}</strong></span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <OfferFields
              control={form.control}
              register={form.register}
              kind={kind}
              setValue={form.setValue}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={proposalMutation.isPending}
              >
                Anulează
              </Button>
              <Button type="submit" disabled={proposalMutation.isPending}>
                {proposalMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Trimite oferta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferModal;
