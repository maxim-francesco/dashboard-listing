import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Check, ChevronsUpDown } from "lucide-react";

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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getActiveListings,
  AppointmentType,
  AppointmentPayload
} from "@/services/api";

const formSchema = z.object({
  title: z.string().min(1, "Titlul este obligatoriu."),
  type: z.enum(["TEST_DRIVE", "VIEWING", "HANDOVER", "MEETING", "OTHER"]),
  startTime: z.string().min(1, "Ora de început este obligatorie."),
  endTime: z.string().min(1, "Ora de sfârșit este obligatorie."),
  clientName: z.string().optional().or(z.literal("")),
  clientPhone: z.string().optional().or(z.literal("")),
  listingId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z.string().optional(),
});

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial: {
    id?: string;
    title?: string;
    type?: AppointmentType;
    startAt?: string;   // ISO string
    endAt?: string;     // ISO string
    clientName?: string | null;
    clientPhone?: string | null;
    listingId?: string | null;
    notes?: string | null;
    status?: string;
  } | null;
  onSaved: () => void;
}

const TYPE_LABELS: Record<AppointmentType, string> = {
  TEST_DRIVE: 'Test-drive',
  VIEWING: 'Vizionare',
  HANDOVER: 'Predare',
  MEETING: 'Întâlnire',
  OTHER: 'Altele',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programată',
  COMPLETED: 'Finalizată',
  CANCELLED: 'Anulată',
};

const toTimeValue = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const combineDateTime = (date: Date, timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
};

const AppointmentModal = ({ isOpen, onClose, mode, initial, onSaved }: AppointmentModalProps) => {
  const [carPickerOpen, setCarPickerOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "OTHER",
      startTime: "10:00",
      endTime: "11:00",
      clientName: "",
      clientPhone: "",
      listingId: "",
      notes: "",
      status: "SCHEDULED",
    }
  });

  const { data: listingsData = [] } = useQuery({
    queryKey: ['listings-for-appointments'],
    queryFn: getActiveListings,
    refetchOnWindowFocus: false,
    enabled: isOpen,
  });

  const cars = useMemo(() => {
    const list = Array.isArray(listingsData) ? listingsData : ((listingsData as any)?.listings ?? (listingsData as any)?.data ?? []);
    return list.map((item: any) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.images?.[0]?.url ?? null,
    }));
  }, [listingsData]);

  const carsById = useMemo(() => {
    const m: Record<string, { title: string; imageUrl: string | null }> = {};
    cars.forEach((c) => {
      m[c.id] = { title: c.title, imageUrl: c.imageUrl };
    });
    return m;
  }, [cars]);

  const baseDate = useMemo(() => {
    return initial?.startAt ? new Date(initial.startAt) : new Date();
  }, [initial?.startAt]);

  const readableDate = useMemo(() => {
    return new Intl.DateTimeFormat('ro-RO', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(baseDate);
  }, [baseDate]);

  const selectedListingId = form.watch('listingId');
  const selectedCar = selectedListingId ? carsById[selectedListingId] : null;

  useEffect(() => {
    if (isOpen && initial) {
      let startVal = toTimeValue(initial.startAt);
      let endVal = toTimeValue(initial.endAt);

      if (startVal === "00:00" && endVal === "00:00") {
        startVal = "10:00";
        endVal = "11:00";
      } else if (initial.startAt) {
        const startDateObj = new Date(initial.startAt);
        const endDateObj = initial.endAt ? new Date(initial.endAt) : null;
        if (!endDateObj || (endDateObj.getTime() - startDateObj.getTime() <= 30 * 60 * 1000)) {
          const defaultEndObj = new Date(startDateObj.getTime() + 60 * 60 * 1000);
          endVal = toTimeValue(defaultEndObj.toISOString());
        }
      }

      form.reset({
        title: initial.title || "",
        type: initial.type || "OTHER",
        startTime: startVal || "10:00",
        endTime: endVal || "11:00",
        clientName: initial.clientName || "",
        clientPhone: initial.clientPhone || "",
        listingId: initial.listingId || "",
        notes: initial.notes || "",
        status: initial.status || "SCHEDULED",
      });
    } else if (isOpen) {
      form.reset({
        title: "",
        type: "OTHER",
        startTime: "10:00",
        endTime: "11:00",
        clientName: "",
        clientPhone: "",
        listingId: "",
        notes: "",
        status: "SCHEDULED",
      });
    }
  }, [isOpen, initial, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const startAt = combineDateTime(baseDate, values.startTime);
      const endAt = combineDateTime(baseDate, values.endTime);

      if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
        toast.error("Ora de sfârșit trebuie să fie după ora de început.");
        return;
      }

      const payload: AppointmentPayload = {
        title: values.title,
        type: values.type,
        startAt,
        endAt,
        clientName: values.clientName || null,
        clientPhone: values.clientPhone || null,
        listingId: values.listingId || null,
        notes: values.notes || null,
      };

      if (mode === 'create') {
        await createAppointment(payload);
        toast.success("Programare creată.");
      } else {
        if (!initial?.id) throw new Error("ID-ul programării lipsește.");
        await updateAppointment(initial.id, {
          ...payload,
          status: values.status,
        });
        toast.success("Programare actualizată.");
      }
      onSaved();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "A apărut o eroare la salvarea programării.");
    }
  };

  const handleDelete = async () => {
    if (!initial?.id) return;
    if (!window.confirm("Sigur doriți să ștergeți această programare?")) return;

    try {
      await deleteAppointment(initial.id);
      toast.success("Programare ștearsă.");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Nu s-a putut șterge programarea.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="bg-popover border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === 'create' ? "Programare nouă" : "Editează programarea"}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? "Creați o nouă programare în calendarul parcului auto." 
              : "Editați detaliile sau statusul acestei programări."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 pt-2">
              
              {/* Date Banner (Read-only) */}
              <div className="p-3 bg-muted rounded-md border border-border flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Programare pentru:</span>
                <span className="text-foreground font-semibold text-sm capitalize">{readableDate}</span>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titlu programare</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Test-drive client Popescu" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip programare</FormLabel>
                      <FormControl>
                        <select 
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                        >
                          {Object.entries(TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mode === 'edit' && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <select 
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                          >
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ora început</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ora sfârșit</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="listingId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Mașină (opțional)</FormLabel>
                    <Popover open={carPickerOpen} onOpenChange={setCarPickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={carPickerOpen}
                            className="w-full justify-between bg-background border-input text-foreground h-10 px-3 font-normal"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {selectedCar ? (
                                <>
                                  {selectedCar.imageUrl ? (
                                    <img
                                      src={selectedCar.imageUrl}
                                      alt=""
                                      className="w-6 h-6 rounded object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground flex-shrink-0">
                                      Fără foto
                                    </div>
                                  )}
                                  <span className="truncate">{selectedCar.title}</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">Selectează mașina (opțional)</span>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border" align="start">
                        <Command>
                          <CommandInput placeholder="Caută mașina..." className="h-9" />
                          <CommandEmpty>Nicio mașină găsită.</CommandEmpty>
                          <CommandList className="max-h-60 overflow-y-auto">
                            <CommandGroup>
                              <CommandItem
                                value="fara masina"
                                onSelect={() => {
                                  form.setValue("listingId", "");
                                  setCarPickerOpen(false);
                                }}
                                className="flex items-center justify-between cursor-pointer"
                              >
                                <span className="text-sm font-medium">— fără mașină —</span>
                                {selectedListingId === "" && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </CommandItem>
                              
                              {cars.map((car) => (
                                <CommandItem
                                  key={car.id}
                                  value={car.title}
                                  onSelect={() => {
                                    form.setValue("listingId", car.id);
                                    setCarPickerOpen(false);
                                  }}
                                  className="flex items-center justify-between cursor-pointer py-2"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {car.imageUrl ? (
                                      <img
                                        src={car.imageUrl}
                                        alt=""
                                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground flex-shrink-0">
                                        Fără foto
                                      </div>
                                    )}
                                    <span className="truncate text-sm">{car.title}</span>
                                  </div>
                                  {selectedListingId === car.id && (
                                    <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nume client (opțional)</FormLabel>
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
                      <FormLabel>Telefon client (opțional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: 0722000000" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observații (opțional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalii suplimentare despre programare..." 
                        {...field} 
                        className="bg-background min-h-[80px]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <DialogFooter className="flex justify-between items-center w-full pt-4">
              {mode === 'edit' ? (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="mr-auto"
                >
                  Șterge
                </Button>
              ) : (
                <div className="flex-1" />
              )}
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Anulează
                </Button>
                <Button type="submit">
                  {mode === 'create' ? "Creează" : "Salvează"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
