import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useMutationState } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRANSPORT_COUNTRIES, TRANSPORT_TYPE_LABELS } from "@/lib/transportConstants";

const formSchema = z.object({
  kind: z.enum(["OFFER", "REQUEST"]),
  fromCountry: z.string().optional().or(z.literal("")),
  fromCity: z.string().min(2, "Orașul de plecare este obligatoriu."),
  toCity: z.string().min(2, "Orașul de sosire este obligatoriu."),
  departureDate: z.string().min(1, "Data plecării este obligatorie."),
  departureDateEnd: z.string().optional().or(z.literal("")),
  seatsTotal: z.coerce.number().int().min(1, "Minim 1 loc."),
  pricePerCar: z.coerce.number().min(0, "Prețul nu poate fi negativ.").nullable().optional().or(z.literal("")),
  transportType: z.enum(["PLATFORM_OPEN", "ENCLOSED", "TARP"]).optional().or(z.literal("")).or(z.literal("none")),
  acceptsNonRunning: z.boolean().default(false),
  notes: z.string().optional().or(z.literal("")),
});

interface PostTransportRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    kind: 'OFFER' | 'REQUEST';
    fromCountry?: string | null;
    fromCity: string;
    toCity: string;
    departureDate: string;
    departureDateEnd?: string | null;
    seatsTotal: number;
    pricePerCar?: number | null;
    transportType?: string | null;
    acceptsNonRunning?: boolean;
    notes?: string | null;
  }) => void;
}

const PostTransportRunModal = ({ isOpen, onClose, onSubmit }: PostTransportRunModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [directionChosen, setDirectionChosen] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kind: "OFFER",
      fromCountry: "",
      fromCity: "",
      toCity: "",
      departureDate: "",
      departureDateEnd: "",
      seatsTotal: 1,
      pricePerCar: "",
      transportType: "",
      acceptsNonRunning: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        kind: "OFFER",
        fromCountry: "",
        fromCity: "",
        toCity: "",
        departureDate: "",
        departureDateEnd: "",
        seatsTotal: 1,
        pricePerCar: "",
        transportType: "",
        acceptsNonRunning: false,
        notes: "",
      });
      setStep(1);
      setDirectionChosen(false);
      setLastSubmitTime(null);
    }
  }, [isOpen, form]);

  const kind = form.watch("kind");
  const fromCityVal = form.watch("fromCity");
  const toCityVal = form.watch("toCity");
  const departureDateVal = form.watch("departureDate");
  const isStep2Valid = !!(fromCityVal && toCityVal && departureDateVal);

  // Monitor active mutation from react-query
  const transportMutations = useMutationState({
    select: (mutation) => ({
      status: mutation.state.status,
      variables: mutation.state.variables as any,
      error: mutation.state.error as any,
      submittedAt: mutation.state.submittedAt,
    }),
  });

  const matchedMutations = transportMutations.filter(m => 
    m.variables && 
    typeof m.variables === "object" && 
    "fromCity" in m.variables && 
    "toCity" in m.variables
  );

  const activeMutation = matchedMutations.length > 0 
    ? matchedMutations[matchedMutations.length - 1] 
    : null;

  const isPending = activeMutation?.status === "pending";

  const serverError = (lastSubmitTime && activeMutation && activeMutation.submittedAt >= lastSubmitTime && activeMutation.status === "error")
    ? ((activeMutation.error as any)?.response?.data?.message || (activeMutation.error as any)?.message || "A apărut o eroare la salvare.")
    : null;

  useEffect(() => {
    if (lastSubmitTime && activeMutation && activeMutation.submittedAt >= lastSubmitTime && activeMutation.status === "success") {
      onClose();
    }
  }, [activeMutation, lastSubmitTime, onClose]);

  function handleSubmit(values: z.infer<typeof formSchema>) {
    setLastSubmitTime(Date.now());
    const isOffer = values.kind === "OFFER";
    onSubmit({
      kind: values.kind,
      fromCountry: values.fromCountry && values.fromCountry !== "none" ? values.fromCountry : null,
      fromCity: values.fromCity.trim(),
      toCity: values.toCity.trim(),
      departureDate: new Date(values.departureDate).toISOString(),
      departureDateEnd: values.departureDateEnd ? new Date(values.departureDateEnd).toISOString() : null,
      seatsTotal: values.seatsTotal,
      pricePerCar: isOffer && values.pricePerCar !== "" && values.pricePerCar !== null ? Number(values.pricePerCar) : null,
      transportType: isOffer && values.transportType && values.transportType !== "none" && values.transportType !== "" ? values.transportType : null,
      acceptsNonRunning: isOffer ? !!values.acceptsNonRunning : false,
      notes: values.notes?.trim() || null,
    });
  }

  const getTitle = () => {
    if (step === 1) return "Ce vrei să faci?";
    if (step === 2) return "De unde și când?";
    return "Detalii cursă";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="bg-popover border-border text-foreground max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{getTitle()}</DialogTitle>
          {step === 1 && (
            <DialogDescription>
              Adaugă o nouă cursă de transport disponibilă pentru ceilalți dealeri din rețea.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* STEP INDICATOR */}
        <div className="space-y-1.5 py-1">
          <div className="text-[13px] text-muted-foreground">
            Pasul {step} din 3
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            
            {/* STEP 1: Direction Choice */}
            <div className={step === 1 ? "space-y-4" : "hidden"}>
              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <Button
                        type="button"
                        className={`w-full min-h-[56px] text-[16px] font-semibold justify-center items-center rounded-lg transition-colors ${
                          field.value === "OFFER" && directionChosen
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-card border border-border text-foreground hover:bg-muted"
                        }`}
                        onClick={() => {
                          field.onChange("OFFER");
                          setDirectionChosen(true);
                        }}
                      >
                        Duc mașini
                      </Button>
                      <Button
                        type="button"
                        className={`w-full min-h-[56px] text-[16px] font-semibold justify-center items-center rounded-lg transition-colors ${
                          field.value === "REQUEST" && directionChosen
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-card border border-border text-foreground hover:bg-muted"
                        }`}
                        onClick={() => {
                          field.onChange("REQUEST");
                          setDirectionChosen(true);
                        }}
                      >
                        Caut transport
                      </Button>
                    </div>
                    <p className="text-[13px] text-muted-foreground text-center">
                      Alege dacă oferi loc de transport sau cauți pe cineva să-ți ducă mașinile.
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* STEP 2: Route */}
            <div className={step === 2 ? "space-y-4" : "hidden"}>
              <FormField
                control={form.control}
                name="fromCity"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[15px] font-medium text-foreground">Oraș plecare</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Bologna" {...field} className="bg-background border-input text-foreground min-h-[48px] text-[16px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toCity"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[15px] font-medium text-foreground">Oraș sosire</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Cluj-Napoca" {...field} className="bg-background border-input text-foreground min-h-[48px] text-[16px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[15px] font-medium text-foreground">Data plecării</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="bg-background border-input text-foreground min-h-[48px] text-[16px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Keep other route fields in DOM but hidden */}
              <div className="hidden">
                <FormField
                  control={form.control}
                  name="fromCountry"
                  render={({ field }) => (
                    <Input {...field} />
                  )}
                />
                <FormField
                  control={form.control}
                  name="departureDateEnd"
                  render={({ field }) => (
                    <Input {...field} />
                  )}
                />
              </div>
            </div>

            {/* STEP 3: Remaining Details */}
            <div className={step === 3 ? "space-y-4" : "hidden"}>
              <FormField
                control={form.control}
                name="seatsTotal"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[15px] font-medium text-foreground">Locuri disponibile</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="ex: 3" {...field} className="bg-background border-input text-foreground min-h-[48px] text-[16px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {kind === "OFFER" && (
                <FormField
                  control={form.control}
                  name="pricePerCar"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[15px] font-medium text-foreground">Preț per mașină (opțional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 400" {...field} className="bg-background border-input text-foreground min-h-[48px] text-[16px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {kind === "OFFER" && (
                <>
                  <FormField
                    control={form.control}
                    name="transportType"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[15px] font-medium text-foreground">Tip transport</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-input text-foreground min-h-[48px] text-[16px]">
                              <SelectValue placeholder="Alege tipul" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="none">Nespecificat</SelectItem>
                            <SelectItem value="PLATFORM_OPEN">{TRANSPORT_TYPE_LABELS.PLATFORM_OPEN}</SelectItem>
                            <SelectItem value="ENCLOSED">{TRANSPORT_TYPE_LABELS.ENCLOSED}</SelectItem>
                            <SelectItem value="TARP">{TRANSPORT_TYPE_LABELS.TARP}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptsNonRunning"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border border-border bg-background p-3 shadow-sm">
                        <FormLabel className="text-[15px] font-medium text-foreground cursor-pointer">Accept mașini nefuncționale (troliu)</FormLabel>
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
                </>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[15px] font-medium text-foreground">Notă (opțional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="ex: Transport pe platformă 3 mașini, plecare dimineața..." {...field} className="bg-background border-input text-foreground min-h-[80px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError && (
                <div className="text-destructive text-sm font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  {serverError}
                </div>
              )}
            </div>

            {/* NAVIGATION FOOTER */}
            <div className="pt-4 border-t border-border mt-6">
              {step === 1 && (
                <Button
                  type="button"
                  className="w-full min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]"
                  disabled={!directionChosen}
                  onClick={() => setStep(2)}
                >
                  Înainte
                </Button>
              )}

              {step === 2 && (
                <div className="flex gap-3 flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 min-h-[52px] bg-card border border-border text-foreground font-semibold text-[16px]"
                    onClick={() => setStep(1)}
                  >
                    Înapoi
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]"
                    disabled={!isStep2Valid}
                    onClick={async () => {
                      const isValid = await form.trigger(["fromCity", "toCity", "departureDate"]);
                      if (isValid) {
                        setStep(3);
                      }
                    }}
                  >
                    Înainte
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="flex gap-3 flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 min-h-[52px] bg-card border border-border text-foreground font-semibold text-[16px]"
                    disabled={isPending}
                    onClick={() => setStep(2)}
                  >
                    Înapoi
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]"
                    disabled={isPending}
                  >
                    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Publică cursa
                  </Button>
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PostTransportRunModal;
