import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Loader2, Check, Car, Eye, Key, Users, CalendarClock, ChevronRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  createAppointment,
  getActiveListings,
  AppointmentType,
  AppointmentPayload,
} from "@/services/api";

interface AppointmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  customerName?: string | null;
  customerPhone?: string | null;
}

const TYPE_LABELS: Record<AppointmentType, string> = {
  TEST_DRIVE: "Test-drive",
  VIEWING: "Vizionare",
  HANDOVER: "Predare",
  MEETING: "Întâlnire",
  OTHER: "Altele",
};

const TYPE_ICONS: Record<AppointmentType, any> = {
  TEST_DRIVE: Car,
  VIEWING: Eye,
  HANDOVER: Key,
  MEETING: Users,
  OTHER: CalendarClock,
};

const TYPE_ORDER: AppointmentType[] = ["TEST_DRIVE", "VIEWING", "HANDOVER", "MEETING", "OTHER"];

// Types that involve a specific car -> show the car-picker step.
const CAR_TYPES: AppointmentType[] = ["TEST_DRIVE", "VIEWING", "HANDOVER"];

const pad = (n: number) => String(n).padStart(2, "0");

const addOneHour = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours((h || 0) + 1, m || 0, 0, 0);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Time slots 09:00 -> 18:00, every 30 min.
const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 9; h <= 18; h++) {
    out.push(`${pad(h)}:00`);
    if (h < 18) out.push(`${pad(h)}:30`);
  }
  return out;
})();

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const AppointmentWizard = ({ isOpen, onClose, onSaved, customerName, customerPhone }: AppointmentWizardProps) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<AppointmentType>("TEST_DRIVE");
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [dateObj, setDateObj] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [listingId, setListingId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const suggestTitle = (t: AppointmentType) =>
    `${TYPE_LABELS[t]}${customerName ? " — " + customerName : ""}`;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setType("TEST_DRIVE");
      setTitle(suggestTitle("TEST_DRIVE"));
      setTitleEdited(false);
      setDateObj(new Date());
      setStartTime("10:00");
      setEndTime("11:00");
      setListingId("");
      setNotes("");
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const { data: listingsData = [] } = useQuery({
    queryKey: ["listings-for-appointments"],
    queryFn: getActiveListings,
    enabled: isOpen,
    refetchOnWindowFocus: false,
  });

  const cars = useMemo(() => {
    const list = Array.isArray(listingsData)
      ? listingsData
      : ((listingsData as any)?.listings ?? (listingsData as any)?.data ?? []);
    return list.map((item: any) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.images?.[0]?.url ?? null,
    }));
  }, [listingsData]);

  const selectedCar = listingId ? (cars.find((c: any) => c.id === listingId) ?? null) : null;

  const showCarStep = CAR_TYPES.includes(type);
  // Dynamic step model:
  //  with car:    1=type, 2=car, 3=when, 4=confirm  (total 4)
  //  without car: 1=type, 2=when, 3=confirm          (total 3)
  const totalSteps = showCarStep ? 4 : 3;
  const whenStep = showCarStep ? 3 : 2;
  const confirmStep = showCarStep ? 4 : 3;
  const carStep = 2;

  const handlePickType = (t: AppointmentType) => {
    setType(t);
    if (!titleEdited) setTitle(suggestTitle(t));
  };

  const handleStartTimeChange = (v: string) => {
    setStartTime(v);
    if (v) setEndTime(addOneHour(v));
  };

  const step1Valid = title.trim().length > 0;
  const whenValid = !!dateObj && !!startTime && !!endTime && endTime > startTime;

  const readableDate = useMemo(() => {
    if (!dateObj) return "";
    try {
      return format(dateObj, "EEEE, d MMMM yyyy", { locale: ro });
    } catch {
      return "";
    }
  }, [dateObj]);

  const getTitle = () => {
    if (step === 1) return "Ce fel de programare?";
    if (showCarStep && step === carStep) return "La ce mașină?";
    if (step === whenStep) return "Când?";
    return "Confirmă programarea";
  };

  const goNextFromType = () => setStep(2);
  const goNextFromCar = () => setStep(whenStep);
  const goNextFromWhen = () => setStep(confirmStep);
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!whenValid || !dateObj || submitting) return;
    try {
      setSubmitting(true);
      const y = dateObj.getFullYear();
      const mo = dateObj.getMonth();
      const da = dateObj.getDate();
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startAt = new Date(y, mo, da, sh, sm, 0, 0).toISOString();
      const endAt = new Date(y, mo, da, eh, em, 0, 0).toISOString();
      const payload: AppointmentPayload = {
        title: title.trim(),
        type,
        startAt,
        endAt,
        clientName: customerName || null,
        clientPhone: customerPhone || null,
        listingId: listingId || null,
        notes: notes.trim() || null,
      };
      await createAppointment(payload);
      toast.success("Programare creată.");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "A apărut o eroare la salvarea programării.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="bg-background border-border max-h-[94vh]">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="text-[18px] font-semibold text-foreground">{getTitle()}</DrawerTitle>
          <div className="space-y-1.5 pt-2">
            <div className="text-[13px] text-muted-foreground">Pasul {step} din {totalSteps}</div>
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1 min-h-0">
          {/* STEP 1: TYPE + TITLE */}
          {step === 1 && (
            <div className="space-y-4 pb-2">
              <div className="flex flex-col gap-2.5">
                {TYPE_ORDER.map((t) => {
                  const Icon = TYPE_ICONS[t];
                  const selected = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handlePickType(t)}
                      className={`w-full min-h-[56px] px-4 flex items-center gap-3 rounded-xl border text-[16px] font-medium transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-6 h-6 shrink-0" />
                      <span className="flex-1 text-left">{TYPE_LABELS[t]}</span>
                      {selected && <Check className="w-5 h-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-1.5">
                <label className="text-[15px] font-medium text-foreground">Titlu programare</label>
                <Input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setTitleEdited(true); }}
                  placeholder="ex: Test-drive client Popescu"
                  className="bg-background border-input text-foreground min-h-[52px] text-[16px]"
                />
              </div>
            </div>
          )}

          {/* STEP: CAR (only for car types) */}
          {showCarStep && step === carStep && (
            <div className="space-y-4 pb-2">
              <div className="rounded-xl border border-border overflow-hidden">
                <Command>
                  <CommandInput placeholder="Caută mașina..." className="h-11 text-[15px]" />
                  <CommandList className="max-h-72 overflow-y-auto">
                    <CommandEmpty>Nicio mașină găsită.</CommandEmpty>
                    <CommandGroup>
                      {cars.map((car: any) => (
                        <CommandItem
                          key={car.id}
                          value={car.title}
                          onSelect={() => setListingId(car.id)}
                          className="flex items-center justify-between cursor-pointer py-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {car.imageUrl ? (
                              <img src={car.imageUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">foto</div>
                            )}
                            <span className="truncate text-[15px]">{car.title}</span>
                          </div>
                          {listingId === car.id && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
              {selectedCar && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary">
                  {selectedCar.imageUrl ? (
                    <img src={selectedCar.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">foto</div>
                  )}
                  <span className="text-[15px] font-medium truncate">{selectedCar.title}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP: WHEN */}
          {step === whenStep && (
            <div className="space-y-4 pb-2">
              <div className="rounded-xl border border-border flex justify-center">
                <Calendar
                  mode="single"
                  selected={dateObj}
                  onSelect={setDateObj}
                  disabled={(d: Date) => d < startOfToday()}
                  initialFocus
                  locale={ro}
                />
              </div>
              {readableDate && (
                <p className="text-[14px] text-foreground font-medium capitalize pl-0.5">{readableDate}</p>
              )}
              <div className="space-y-1.5">
                <label className="text-[15px] font-medium text-foreground">Ora de început</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const selected = startTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleStartTimeChange(slot)}
                        className={`min-h-[44px] rounded-lg border text-[15px] font-medium transition-colors ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {startTime && (
                  <p className="text-[13px] text-muted-foreground pl-0.5">Se termină la {endTime} · poți schimba din pasul următor</p>
                )}
              </div>
            </div>
          )}

          {/* STEP: CONFIRM */}
          {step === confirmStep && (
            <div className="space-y-4 pb-2">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-[15px]">
                  {(customerName || "?").trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-foreground truncate">{customerName || "Client"}</p>
                  {customerPhone && <p className="text-[13px] text-muted-foreground truncate">{customerPhone}</p>}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary/10 text-primary text-[14px] font-medium capitalize">
                {title.trim() || TYPE_LABELS[type]} · {readableDate}, {startTime}
              </div>

              {selectedCar && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  {selectedCar.imageUrl ? (
                    <img src={selectedCar.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">foto</div>
                  )}
                  <span className="text-[15px] font-medium text-foreground truncate">{selectedCar.title}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[15px] font-medium text-foreground">Ora început</label>
                  <div className="min-h-[48px] px-3 flex items-center rounded-lg border border-border bg-card text-[16px] text-foreground">{startTime}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[15px] font-medium text-foreground">Ora sfârșit</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="min-h-[48px] w-full px-3 rounded-lg border border-input bg-background text-[16px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {TIME_SLOTS.filter((s) => s > startTime).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[15px] font-medium text-foreground">Observații (opțional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalii suplimentare despre programare..."
                  className="bg-background border-input text-foreground min-h-[80px] text-[16px]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border mt-2">
          {step === 1 && (
            <Button
              type="button"
              className="w-full min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]"
              disabled={!step1Valid}
              onClick={goNextFromType}
            >
              Înainte
            </Button>
          )}

          {showCarStep && step === carStep && (
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 min-h-[52px] bg-card border border-border text-foreground font-semibold text-[16px]" onClick={goBack}>
                Înapoi
              </Button>
              <Button type="button" className="flex-1 min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]" onClick={goNextFromCar}>
                {selectedCar ? "Înainte" : "Continuă fără mașină"}
              </Button>
            </div>
          )}

          {step === whenStep && (
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 min-h-[52px] bg-card border border-border text-foreground font-semibold text-[16px]" onClick={goBack}>
                Înapoi
              </Button>
              <Button type="button" className="flex-1 min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]" disabled={!whenValid} onClick={goNextFromWhen}>
                Înainte
              </Button>
            </div>
          )}

          {step === confirmStep && (
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 min-h-[52px] bg-card border border-border text-foreground font-semibold text-[16px]" disabled={submitting} onClick={goBack}>
                Înapoi
              </Button>
              <Button type="button" className="flex-1 min-h-[52px] bg-primary text-primary-foreground font-semibold text-[16px]" disabled={submitting} onClick={handleSubmit}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Creează programarea
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AppointmentWizard;
