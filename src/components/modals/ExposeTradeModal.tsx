import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SlowStockItem, TradeListing } from "@/services/api";

const formSchema = z.object({
  b2bPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
    z.number().min(0, "Prețul nu poate fi negativ").nullable().optional()
  ),
  acceptsTrade: z.boolean().default(false),
  note: z.string().max(1000, "Nota este prea lungă.").optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExposeTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: SlowStockItem | TradeListing | null;
  mode: "create" | "edit";
  onSubmit: (data: FormValues) => void;
}

const ExposeTradeModal = ({ isOpen, onClose, listing, mode, onSubmit }: ExposeTradeModalProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      b2bPrice: null,
      acceptsTrade: false,
      note: "",
    },
  });

  useEffect(() => {
    if (isOpen && listing) {
      if (mode === "edit") {
        const tradeListing = listing as TradeListing;
        form.reset({
          b2bPrice: tradeListing.b2bPrice ?? null,
          acceptsTrade: tradeListing.acceptsTrade ?? false,
          note: tradeListing.note ?? "",
        });
      } else {
        form.reset({
          b2bPrice: null,
          acceptsTrade: false,
          note: "",
        });
      }
    }
  }, [listing, isOpen, mode, form]);

  function handleSubmit(values: FormValues) {
    onSubmit(values);
    onClose();
  }

  const title = mode === "edit" ? "Editează expunerea auto" : "Expune mașina în rețea";
  
  // Safe accessor helper for title
  const getListingTitle = () => {
    if (!listing) return "";
    if ("car" in listing && listing.car) {
      return listing.car.title;
    }
    return (listing as SlowStockItem).title || "";
  };

  const desc = mode === "edit" 
    ? `Actualizează detaliile pentru vehiculul expus: ${getListingTitle()}`
    : `Configurează detaliile de expunere în rețeaua B2B pentru vehiculul: ${getListingTitle()}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="bg-popover border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pt-2">
            <FormField
              control={form.control}
              name="b2bPrice"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[15px] font-medium text-foreground">Preț B2B (€)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="ex: 15000" 
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="bg-background min-h-[48px] text-[16px]" 
                    />
                  </FormControl>
                  <span className="text-[13px] text-muted-foreground block mt-1">
                    Lasă gol ca să folosești prețul public
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptsTrade"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-[15px] font-medium text-foreground cursor-pointer">
                      Accept schimb cu altă mașină
                    </FormLabel>
                    <span className="text-[13px] text-muted-foreground block">
                      Accept și schimb, nu doar bani
                    </span>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[15px] font-medium text-foreground">Notă / Detalii schimb</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adaugă mențiuni despre mașină, starea ei, sau ce fel de schimburi te interesează..." 
                      className="bg-background min-h-[100px] text-[16px] resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t border-border mt-6 flex flex-row gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1 min-h-[52px] bg-card border border-border text-foreground font-semibold text-[16px]"
              >
                Anulează
              </Button>
              <Button 
                type="submit"
                className="flex-1 min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]"
              >
                {mode === "edit" ? "Salvează" : "Expune"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExposeTradeModal;
