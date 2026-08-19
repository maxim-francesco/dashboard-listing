import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Loader2, Car } from "lucide-react";
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
          <DialogTitle className="text-[17px] font-semibold text-foreground text-left">Fă o ofertă</DialogTitle>
          <DialogDescription>
            Trimite o ofertă de cumpărare sau schimb pentru această mașină.
          </DialogDescription>
        </DialogHeader>

        {/* Target Car Context Panel */}
        {listing.car && (
          <div className="flex gap-4 p-3 bg-muted/40 border border-border rounded-lg">
            <div className="w-[80px] h-[64px] shrink-0 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {listing.car.image ? (
                <img src={listing.car.image} alt={listing.car.title} className="w-full h-full object-cover" />
              ) : (
                <Car className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-baseline gap-2">
                <span className="text-[17px] font-semibold text-foreground">
                  {formatEur(listing.b2bPrice || listing.car.price)}
                </span>
                {listing.b2bPrice && listing.b2bPrice !== listing.car.price && (
                  <span className="text-[13px] text-muted-foreground line-through">
                    {formatEur(listing.car.price)}
                  </span>
                )}
              </div>
              <div className="text-[15px] text-foreground truncate mt-0.5">{listing.car.title}</div>
              {listing.owner?.name && (
                <div className="text-[13px] text-muted-foreground mt-0.5">
                  {listing.owner.name}
                </div>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <OfferFields
              control={form.control}
              register={form.register}
              kind={kind}
              setValue={form.setValue}
            />

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                className="flex-1 min-h-[44px] bg-card border border-border text-foreground hover:bg-accent text-[15px] font-semibold"
                onClick={onClose}
                disabled={proposalMutation.isPending}
              >
                Anulează
              </Button>
              <Button 
                type="submit" 
                className="flex-1 min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/95 text-[15px] font-semibold"
                disabled={proposalMutation.isPending}
              >
                {proposalMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Trimite oferta
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferModal;
