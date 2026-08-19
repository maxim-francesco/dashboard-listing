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
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  seatsRequested: z.coerce.number().int().min(1, "Minim un loc."),
  note: z.string().optional().or(z.literal("")),
});

interface TransportInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: any | null;
  onSubmit: (data: { seatsRequested: number; note?: string | null }) => void;
}

const TransportInterestModal = ({ isOpen, onClose, run, onSubmit }: TransportInterestModalProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      seatsRequested: 1,
      note: "",
    },
  });

  useEffect(() => {
    if (isOpen && run) {
      form.reset({
        seatsRequested: 1,
        note: "",
      });
    }
  }, [run, isOpen, form]);

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit({
      seatsRequested: values.seatsRequested,
      note: values.note?.trim() || null,
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-semibold text-foreground text-left">Sunt interesat de cursă</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground text-left">
            Exprimă interesul pentru cursa <span className="font-semibold text-foreground">{run?.fromCity} → {run?.toCity}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="seatsRequested"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[15px] font-medium text-foreground">Locuri solicitate</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 1" {...field} className="bg-background border-input text-foreground min-h-[48px] text-[16px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[15px] font-medium text-foreground">Note / Detalii suplimentare (opțional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Adaugă un mesaj pentru dealer..." {...field} className="bg-background border-input text-foreground min-h-[80px] text-[15px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 flex flex-row gap-3 sm:gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1 min-h-[48px] bg-card border border-border text-foreground font-semibold text-[15px]"
              >
                Anulează
              </Button>
              <Button type="submit" className="flex-1 min-h-[48px] bg-primary text-primary-foreground font-semibold text-[15px]">
                Trimite interes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TransportInterestModal;
