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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const handoverSchema = z.object({
  handoverDate: z.string().min(1, "Data de predare este obligatorie."),
  handoverMileage: z.coerce.number().optional(),
  itemCarteIdentitate: z.boolean().default(true),
  itemTalon: z.boolean().default(true),
  itemCheiRezerva: z.boolean().default(true),
  itemRoataRezerva: z.boolean().default(true),
  itemSetCauciucuri: z.boolean().default(true),
  handoverNotes: z.string().optional(),
});

export type HandoverFormData = z.infer<typeof handoverSchema>;

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: { id: string; contractNumber: number } | null;
  onSubmit: (data: HandoverFormData) => void;
}

const HandoverModal = ({ isOpen, onClose, contract, onSubmit }: HandoverModalProps) => {
  const form = useForm<HandoverFormData>({
    resolver: zodResolver(handoverSchema),
    defaultValues: {
      handoverDate: new Date().toISOString().split("T")[0],
      handoverMileage: undefined,
      itemCarteIdentitate: true,
      itemTalon: true,
      itemCheiRezerva: true,
      itemRoataRezerva: true,
      itemSetCauciucuri: true,
      handoverNotes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        handoverDate: new Date().toISOString().split("T")[0],
        handoverMileage: undefined,
        itemCarteIdentitate: true,
        itemTalon: true,
        itemCheiRezerva: true,
        itemRoataRezerva: true,
        itemSetCauciucuri: true,
        handoverNotes: "",
      });
    }
  }, [isOpen, contract, form]);

  const handleSubmit = (values: HandoverFormData) => {
    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Proces-verbal de predare-primire</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Generare PV pentru Contractul #{contract?.contractNumber ?? "---"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="handoverDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Dată predare</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-background border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="handoverMileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Km la predare</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-background border-border text-foreground" placeholder="e.g. 145000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel className="text-foreground font-semibold">Predate la primire</FormLabel>
              <div className="space-y-2 border rounded-md p-3 bg-background border-border">
                <FormField
                  control={form.control}
                  name="itemCarteIdentitate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-input"
                        />
                      </FormControl>
                      <FormLabel className="text-foreground cursor-pointer font-normal">
                        Carte de identitate (CIV)
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemTalon"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-input"
                        />
                      </FormControl>
                      <FormLabel className="text-foreground cursor-pointer font-normal">
                        Talon / Certificat de înmatriculare
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemCheiRezerva"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-input"
                        />
                      </FormControl>
                      <FormLabel className="text-foreground cursor-pointer font-normal">
                        Chei rezervă / Suplimentare
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemRoataRezerva"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-input"
                        />
                      </FormControl>
                      <FormLabel className="text-foreground cursor-pointer font-normal">
                        Roată rezervă / Kit pană
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemSetCauciucuri"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-input"
                        />
                      </FormControl>
                      <FormLabel className="text-foreground cursor-pointer font-normal">
                        Set cauciucuri suplimentar
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="handoverNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Observații / Stare constatată</FormLabel>
                  <FormControl>
                    <Textarea
                      className="bg-background border-border text-foreground min-h-[80px]"
                      placeholder="Mențiuni despre starea optică, tehnică sau alte accesorii predate..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground hover:bg-accent">
                Anulează
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground">
                Generează PV
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default HandoverModal;
