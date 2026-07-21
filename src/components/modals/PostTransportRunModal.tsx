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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    }
  }, [isOpen, form]);

  const kind = form.watch("kind");

  function handleSubmit(values: z.infer<typeof formSchema>) {
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
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="bg-popover border-border text-foreground max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Postează cursă transport</DialogTitle>
          <DialogDescription>
            Adaugă o nouă cursă de transport disponibilă pentru ceilalți dealeri din rețea.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            
            {/* Kind Control */}
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-foreground">Tip cursă</FormLabel>
                  <FormControl>
                    <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="OFFER">Ofer transport</TabsTrigger>
                        <TabsTrigger value="REQUEST">Caut transport</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country and City Plecare */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Țară plecare (opțional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input text-foreground h-10">
                          <SelectValue placeholder="Alege țara" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="none">Nespecificată</SelectItem>
                        {TRANSPORT_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fromCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oraș plecare</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Bologna" {...field} className="bg-background border-input text-foreground h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* To City */}
            <FormField
              control={form.control}
              name="toCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oraș sosire</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Cluj-Napoca" {...field} className="bg-background border-input text-foreground h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data plecării</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="bg-background border-input text-foreground h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departureDateEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plecare până la (opțional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="bg-background border-input text-foreground h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seats Total & Optional Price */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="seatsTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {kind === "OFFER" ? "Locuri mașini pe platformă" : "Câte mașini"}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="ex: 3" {...field} className="bg-background border-input text-foreground h-10" />
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
                    <FormItem>
                      <FormLabel>Preț per mașină (€ - opțional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 400" {...field} className="bg-background border-input text-foreground h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* OFFER fields: Transport type & Accepts Non-Running */}
            {kind === "OFFER" && (
              <div className="grid grid-cols-1 gap-4 border border-border/60 rounded-lg p-3 bg-muted/20">
                <FormField
                  control={form.control}
                  name="transportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip transport (opțional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-input text-foreground h-10">
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
                    <FormItem className="flex flex-row items-center justify-between rounded-md border border-border bg-background p-2 px-3 shadow-sm">
                      <FormLabel className="text-sm font-medium cursor-pointer">Accept mașini nefuncționale (troliu)</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note adiționale (opțional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="ex: Transport pe platformă 3 mașini, plecare dimineața..." {...field} className="bg-background border-input text-foreground min-h-[80px]" />
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
                Postează cursă
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PostTransportRunModal;
