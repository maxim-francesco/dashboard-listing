
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { ro } from 'date-fns/locale';

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { markListingAsSold } from "@/services/api";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

const formSchema = z.object({
  sellingPrice: z.coerce.number().positive({ message: "Prețul trebuie să fie un număr pozitiv." }),
  dateSold: z.date({
    required_error: "Data vânzării este obligatorie.",
  }),
});

interface MarkAsSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

const MarkAsSoldModal = ({ isOpen, onClose, listingId, listingTitle }: MarkAsSoldModalProps) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellingPrice: '',
      dateSold: new Date(),
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => markListingAsSold(listingId, values),
    onSuccess: () => {
      toast.success(`Anunțul "${listingTitle}" a fost marcat ca vândut!`);
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['soldListings'] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast.error("A apărut o eroare. Vă rugăm să încercați din nou.");
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values);
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
          <DialogTitle className="text-foreground">Marchează ca Vândut: {listingTitle}</DialogTitle>
          <DialogDescription>
            Introdu prețul final de vânzare și data la care s-a efectuat tranzacția.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prețul Final de Vânzare (€)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 15000" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateSold"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Vânzării</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ro })
                          ) : (
                            <span>Alege o dată</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    disabled={isPending}
                >
                    Anulează
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmă Vânzarea
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAsSoldModal;
