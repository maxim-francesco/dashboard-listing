import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  clientName: z.string().min(2, "Numele clientului este obligatoriu."),
  clientPhone: z.string().min(6, "Număr de telefon invalid."),
  offerPrice: z.coerce.number().positive("Prețul trebuie să fie pozitiv."),
  validityDays: z.coerce.number().int().positive().max(90).default(5),
});

interface GenerateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any | null;        // to prefill price + show title
  onGenerate: (data: {
    clientName: string;
    clientPhone: string;
    offerPrice: number;
    validityDays: number;
  }) => void;                 // parent (Listings) performs PDF + WhatsApp
}

const GenerateOfferModal = ({ isOpen, onClose, listing, onGenerate }: GenerateOfferModalProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      offerPrice: listing?.price ?? '',
      validityDays: 5,
    },
  });

  useEffect(() => {
    if (isOpen && listing) {
      form.reset({
        clientName: '',
        clientPhone: '',
        offerPrice: listing.price ?? '',
        validityDays: 5,
      });
    }
  }, [listing, isOpen, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onGenerate(values);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Generează ofertă</DialogTitle>
          <DialogDescription>
            Introduceți datele ofertei pentru vehiculul: <span className="font-semibold">{listing?.title}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nume client</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Popescu Ion" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon client</FormLabel>
                  <FormControl>
                    <Input placeholder="07xx xxx xxx" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offerPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preț ofertă (€)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 14500" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validityDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valabilitate (zile)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Anulează
              </Button>
              <Button type="submit">
                Generează oferta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateOfferModal;
