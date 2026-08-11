import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
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
  const [step, setStep] = useState(1);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buyerType: "INDIVIDUAL",
      buyerName: "", buyerAddress: "", buyerPhone: "", buyerEmail: "",
      buyerCnp: "", buyerCiSeries: "", buyerCiNumber: "",
      buyerCui: "", buyerRegCom: "", buyerLegalRep: "",
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
      setStep(1);
      form.reset({
        buyerType: "INDIVIDUAL",
        buyerName: "", buyerAddress: "", buyerPhone: "", buyerEmail: "",
        buyerCnp: "", buyerCiSeries: "", buyerCiNumber: "",
        buyerCui: "", buyerRegCom: "", buyerLegalRep: "",
        salePrice: listing.price ?? 0,
        saleDate: todayStr,
        plateNumber: "",
        mileageAtSale: listing.mileage ?? 0,
        clauses: DEFAULT_CLAUSES,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing, isOpen]);

  const next1 = async () => {
    const ok = await form.trigger(["buyerName", "buyerEmail"]);
    if (ok) setStep(2);
  };
  const next2 = async () => {
    const ok = await form.trigger(["salePrice", "saleDate", "mileageAtSale"]);
    if (ok) setStep(3);
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  function onSubmit(values: ContractFormData) {
    onGenerate(values);
    onClose();
  }

  const stepTitle = step === 1 ? "Cumpărător" : step === 2 ? "Mașină și preț" : "Clauze contract";

  const inputCls = "bg-background border-input text-foreground min-h-[50px] text-[16px]";

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) { form.reset(); onClose(); } }}>
      <DrawerContent className="bg-background border-border max-h-[94vh]">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="text-[18px] font-semibold text-foreground">{stepTitle}</DrawerTitle>
          {listing?.title && (
            <p className="text-[13px] text-muted-foreground truncate">{listing.title}</p>
          )}
          <div className="space-y-1.5 pt-2">
            <div className="text-[13px] text-muted-foreground">Pasul {step} din 3</div>
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: (step / 3) * 100 + "%" }} />
            </div>
          </div>
        </DrawerHeader>

        <Form {...form}>
          <div className="px-4 overflow-y-auto flex-1 min-h-0">
            {step === 1 && (
              <div className="space-y-4 pb-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => form.setValue("buyerType", "INDIVIDUAL")}
                    className={"min-h-[52px] rounded-xl border text-[15px] font-medium transition-colors " + (buyerType === "INDIVIDUAL" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted")}
                  >
                    Persoană fizică
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue("buyerType", "COMPANY")}
                    className={"min-h-[52px] rounded-xl border text-[15px] font-medium transition-colors " + (buyerType === "COMPANY" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted")}
                  >
                    Persoană juridică
                  </button>
                </div>

                <FormField control={form.control} name="buyerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{buyerType === "COMPANY" ? "Denumire firmă" : "Nume cumpărător"}</FormLabel>
                    <FormControl><Input placeholder={buyerType === "COMPANY" ? "ex: Auto SRL" : "ex: Popescu Ion"} {...field} className={inputCls} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="buyerPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl><Input placeholder="07xx xxx xxx" {...field} className={inputCls} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="buyerEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="ex: client@email.com" {...field} className={inputCls} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="buyerAddress" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresă</FormLabel>
                    <FormControl><Input placeholder="ex: Str. Principală Nr. 1" {...field} className={inputCls} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {buyerType === "INDIVIDUAL" ? (
                  <div className="space-y-4 border border-border rounded-xl p-3 bg-muted/40">
                    <FormField control={form.control} name="buyerCnp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNP</FormLabel>
                        <FormControl><Input placeholder="CNP cumpărător" {...field} className={inputCls} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="buyerCiSeries" render={({ field }) => (
                        <FormItem>
                          <FormLabel>CI serie</FormLabel>
                          <FormControl><Input placeholder="ex: RX" {...field} className={inputCls} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="buyerCiNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>CI număr</FormLabel>
                          <FormControl><Input placeholder="ex: 123456" {...field} className={inputCls} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border border-border rounded-xl p-3 bg-muted/40">
                    <FormField control={form.control} name="buyerCui" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CUI / CIF</FormLabel>
                        <FormControl><Input placeholder="CUI" {...field} className={inputCls} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="buyerRegCom" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nr. Reg. Com.</FormLabel>
                        <FormControl><Input placeholder="ex: J40/123/2020" {...field} className={inputCls} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="buyerLegalRep" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reprezentant legal</FormLabel>
                        <FormControl><Input placeholder="Nume reprezentant" {...field} className={inputCls} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 pb-2">
                <FormField control={form.control} name="salePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preț vânzare (€)</FormLabel>
                    <FormControl><Input type="number" placeholder="ex: 12000" {...field} className={inputCls} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="saleDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data vânzării</FormLabel>
                    <FormControl><Input type="date" {...field} className={inputCls} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="plateNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nr. înmatriculare</FormLabel>
                    <FormControl><Input placeholder="ex: B-123-ABC" {...field} className={inputCls} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mileageAtSale" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Km la vânzare</FormLabel>
                    <FormControl><Input type="number" placeholder="ex: 150000" {...field} className={inputCls} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 pb-2">
                <FormField control={form.control} name="clauses" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clauze contractuale</FormLabel>
                    <FormControl><Textarea rows={7} placeholder="Clauze adiționale..." {...field} className="bg-background border-input text-foreground text-[16px] min-h-[160px]" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border mt-2">
            {step === 1 && (
              <Button type="button" className="w-full min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]" onClick={next1}>
                Înainte
              </Button>
            )}
            {step === 2 && (
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 min-h-[52px] bg-card border border-border text-foreground font-semibold text-[16px]" onClick={back}>Înapoi</Button>
                <Button type="button" className="flex-1 min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]" onClick={next2}>Înainte</Button>
              </div>
            )}
            {step === 3 && (
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 min-h-[52px] bg-card border border-border text-foreground font-semibold text-[16px]" onClick={back}>Înapoi</Button>
                <Button type="button" className="flex-1 min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]" onClick={form.handleSubmit(onSubmit)}>Generează contract</Button>
              </div>
            )}
          </div>
        </Form>
      </DrawerContent>
    </Drawer>
  );
};

export default GenerateContractModal;
