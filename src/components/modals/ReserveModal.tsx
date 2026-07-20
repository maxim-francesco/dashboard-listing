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
  depositAmount: z.coerce.number().min(0, "Avansul nu poate fi negativ."),
  reservationDays: z.coerce.number().int().min(1, "Minim o zi.").max(365, "Maxim 365 de zile.").default(7),
});

interface ReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any | null;
  onSubmit: (data: {
    clientName: string;
    clientPhone: string;
    depositAmount: number;
    reservationDays: number;
  }) => void;
}

const ReserveModal = ({ isOpen, onClose, listing, onSubmit }: ReserveModalProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      depositAmount: 0,
      reservationDays: 7,
    },
  });

  useEffect(() => {
    if (isOpen && listing) {
      form.reset({
        clientName: '',
        clientPhone: '',
        depositAmount: 0,
        reservationDays: 7,
      });
    }
  }, [listing, isOpen, form]);

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
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
          <DialogTitle className="text-foreground">Rezervă mașina</DialogTitle>
          <DialogDescription>
            Introduceți datele rezervării pentru vehiculul: <span className="font-semibold">{listing?.title}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
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
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avans (€)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 500" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reservationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zile rezervare</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="7" {...field} className="bg-background" />
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
                Rezervă
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReserveModal;
