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
  buyerType: z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
  buyerName: z.string().min(2, "Numele/denumirea este obligatoriu."),
  buyerAddress: z.string().optional().or(z.literal("")),
  buyerPhone: z.string().optional().or(z.literal("")),
  buyerEmail: z.union([z.string().email("Email invalid."), z.literal(""), z.undefined()]),
  buyerCnp: z.string().optional().or(z.literal("")),
  buyerCiSeries: z.string().optional().or(z.literal("")),
  buyerCiNumber: z.string().optional().or(z.literal("")),
  buyerCui: z.string().optional().or(z.literal("")),
  buyerRegCom: z.string().optional().or(z.literal("")),
  buyerLegalRep: z.string().optional().or(z.literal("")),
  salePrice: z.coerce.number().min(0, "Preț invalid."),
  saleDate: z.string().min(1, "Data este obligatorie."),
  plateNumber: z.string().optional().or(z.literal("")),
  mileageAtSale: z.coerce.number().int().min(0).optional().or(z.nan().transform(() => undefined)),
  clauses: z.string().optional().or(z.literal("")),
});

export type ContractFormData = z.infer<typeof formSchema>;

interface GenerateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any | null;
  onGenerate: (data: ContractFormData) => void;
}

const DEFAULT_CLAUSES = "Vânzătorul declară că autovehiculul este proprietatea sa, liber de sarcini. Cumpărătorul declară că a verificat starea tehnică a autovehiculului. Predarea se face pe bază de proces-verbal.";

const GenerateContractModal = ({ isOpen, onClose, listing, onGenerate }: GenerateContractModalProps) => {
  const todayStr = new Date().toISOString().substring(0, 10);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buyerType: "INDIVIDUAL",
      buyerName: "",
      buyerAddress: "",
      buyerPhone: "",
      buyerEmail: "",
      buyerCnp: "",
      buyerCiSeries: "",
      buyerCiNumber: "",
      buyerCui: "",
      buyerRegCom: "",
      buyerLegalRep: "",
      salePrice: listing?.price ?? 0,
      saleDate: todayStr,
      plateNumber: "",
      mileageAtSale: listing?.mileage ?? 0,
      clauses: DEFAULT_CLAUSES,
    },
  });

  const buyerType = form.watch("buyerType");

  useEffect(() => {
    if (isOpen && listing) {
      form.reset({
        buyerType: "INDIVIDUAL",
        buyerName: "",
        buyerAddress: "",
        buyerPhone: "",
        buyerEmail: "",
        buyerCnp: "",
        buyerCiSeries: "",
        buyerCiNumber: "",
        buyerCui: "",
        buyerRegCom: "",
        buyerLegalRep: "",
        salePrice: listing.price ?? 0,
        saleDate: todayStr,
        plateNumber: "",
        mileageAtSale: listing.mileage ?? 0,
        clauses: DEFAULT_CLAUSES,
      });
    }
  }, [listing, isOpen, form, todayStr]);

  function onSubmit(values: ContractFormData) {
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
      <DialogContent className="bg-popover border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Generează contract de vânzare-cumpărare</DialogTitle>
          <DialogDescription>
            Introduceți datele contractului pentru vehiculul: <span className="font-semibold">{listing?.title}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 pt-2">
              <FormField
                control={form.control}
                name="buyerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip Cumpărător</FormLabel>
                    <FormControl>
                      <select 
                        {...field} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="INDIVIDUAL">Persoană Fizică (PF)</option>
                        <option value="COMPANY">Persoană Juridică (PJ)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buyerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nume / Denumire Cumpărător</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Popescu Ion / Auto SRL" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buyerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon Cumpărător</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: 07xxxxxxxx" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buyerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Cumpărător</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ex: cumparator@email.com" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buyerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresă Cumpărător</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Str. Principală Nr. 1" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {buyerType === "INDIVIDUAL" ? (
                <div className="grid grid-cols-3 gap-4 border p-3 rounded-lg bg-muted/40">
                  <FormField
                    control={form.control}
                    name="buyerCnp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNP</FormLabel>
                        <FormControl>
                          <Input placeholder="CNP cumpărător" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buyerCiSeries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CI Serie</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: RX" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buyerCiNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CI Număr</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: 123456" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 border p-3 rounded-lg bg-muted/40">
                  <FormField
                    control={form.control}
                    name="buyerCui"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CUI / CIF</FormLabel>
                        <FormControl>
                          <Input placeholder="CUI" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buyerRegCom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nr. Reg. Com.</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: J40/123/2020" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buyerLegalRep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reprezentant Legal</FormLabel>
                        <FormControl>
                          <Input placeholder="Nume reprezentant" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preț Vânzare (€)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 12000" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="saleDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Vânzare</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr. Înmatriculare</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: B-123-ABC" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mileageAtSale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Km la Vânzare</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 150000" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clauses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clauze Contractuale</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Clauze adiționale..." rows={4} {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Anulează
              </Button>
              <Button type="submit">
                Generează contract
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateContractModal;
