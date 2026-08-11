import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Loader2, Check, Car, ChevronRight, ChevronDown, Trash2, Calendar as CalendarIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  updateAppointment,
  deleteAppointment,
  getActiveListings,
  AppointmentType,
} from "@/services/api";

interface EditInitial {
  id?: string;
  title?: string;
  type?: AppointmentType;
  startAt?: string;
  endAt?: string;
  clientName?: string | null;
  clientPhone?: string | null;
  listingId?: string | null;
  notes?: string | null;
  status?: string;
}

interface AppointmentEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: EditInitial | null;
}

type StatusVal = "SCHEDULED" | "COMPLETED" | "CANCELLED";

const STATUS_OPTIONS: { value: StatusVal; label: string }[] = [
  { value: "SCHEDULED", label: "Programată" },
  { value: "COMPLETED", label: "Finalizată" },
  { value: "CANCELLED", label: "Anulată" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const toTime = (iso?: string) => {
  if (!iso) return "10:00";
  const d = new Date(iso);
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
};
const addOneHour = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours((h || 0) + 1, m || 0, 0, 0);
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
};
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 9; h <= 18; h++) {
    out.push(pad(h) + ":00");
    if (h < 18) out.push(pad(h) + ":30");
  }
  return out;
})();

const AppointmentEditSheet = ({ isOpen, onClose, onSaved, initial }: AppointmentEditSheetProps) => {
  const [status, setStatus] = useState<StatusVal>("SCHEDULED");
  const [title, setTitle] = useState("");
  const [dateObj, setDateObj] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [listingId, setListingId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [whenOpen, setWhenOpen] = useState(false);
  const [carOpen, setCarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && initial) {
      setStatus((initial.status as StatusVal) || "SCHEDULED");
      setTitle(initial.title || "");
      setDateObj(initial.startAt ? new Date(initial.startAt) : new Date());
      setStartTime(toTime(initial.startAt));
      setEndTime(toTime(initial.endAt));
      setListingId(initial.listingId || "");
      setNotes(initial.notes || "");
      setWhenOpen(false);
      setCarOpen(false);
      setSubmitting(false);
      setDeleting(false);
    }
  }, [isOpen, initial]);

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

  const readableWhen = useMemo(() => {
    if (!dateObj) return "";
    try {
      return format(dateObj, "EEEE, d MMM", { locale: ro }) + " · " + startTime + "–" + endTime;
    } catch {
      return startTime + "–" + endTime;
    }
  }, [dateObj, startTime, endTime]);

  const handleStartTime = (v: string) => {
    setStartTime(v);
    if (v) setEndTime(addOneHour(v));
  };

  const canSave = !!dateObj && !!startTime && !!endTime && endTime > startTime && title.trim().length > 0;

  const handleSave = async () => {
    if (!initial?.id || !dateObj || !canSave || submitting) return;
    try {
      setSubmitting(true);
      const y = dateObj.getFullYear();
      const mo = dateObj.getMonth();
      const da = dateObj.getDate();
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startAt = new Date(y, mo, da, sh, sm, 0, 0).toISOString();
      const endAt = new Date(y, mo, da, eh, em, 0, 0).toISOString();
      await updateAppointment(initial.id, {
        title: title.trim(),
        startAt,
        endAt,
        listingId: listingId || null,
        notes: notes.trim() || null,
        status,
      });
      toast.success("Programare actualizată.");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "A apărut o eroare la salvare.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initial?.id || deleting) return;
    if (!window.confirm("Sigur ștergi această programare?")) return;
    try {
      setDeleting(true);
      await deleteAppointment(initial.id);
      toast.success("Programare ștearsă.");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Nu s-a putut șterge programarea.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="bg-background border-border max-h-[94vh]">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="text-[18px] font-semibold text-foreground">Editează programarea</DrawerTitle>
          {(initial?.clientName || initial?.title) && (
            <p className="text-[13px] text-muted-foreground">{initial?.title || initial?.clientName}</p>
          )}
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1 min-h-0 space-y-4 pb-2">

          <div>
            <label className="text-[13px] text-muted-foreground block mb-2">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((s) => {
                const selected = status === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={
                      "py-3 px-1 rounded-xl border text-[14px] font-medium transition-colors " +
                      (selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted")
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] text-muted-foreground block">Titlu</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titlu programare"
              className="bg-background border-input text-foreground min-h-[52px] text-[16px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] text-muted-foreground block">Ziua & ora</label>
            <button
              type="button"
              onClick={() => setWhenOpen((v) => !v)}
              className="w-full min-h-[52px] px-4 flex items-center gap-3 rounded-xl border border-border-strong bg-background text-foreground"
            >
              <CalendarIcon className="w-5 h-5 shrink-0 text-primary" />
              <span className="flex-1 text-left text-[15px] font-medium capitalize truncate">{readableWhen}</span>
              <ChevronDown className={"w-5 h-5 shrink-0 text-muted-foreground transition-transform " + (whenOpen ? "rotate-180" : "")} />
            </button>
            {whenOpen && (
              <div className="space-y-3 pt-1">
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
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const selected = startTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleStartTime(slot)}
                        className={
                          "min-h-[44px] rounded-lg border text-[15px] font-medium transition-colors " +
                          (selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:bg-muted")
                        }
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[13px] text-muted-foreground pl-0.5">Se termină la {endTime}.</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] text-muted-foreground block">Mașina (opțional)</label>
            {!carOpen ? (
              <button
                type="button"
                onClick={() => setCarOpen(true)}
                className="w-full min-h-[52px] px-4 flex items-center gap-3 rounded-xl border border-border bg-background text-foreground"
              >
                {selectedCar ? (
                  <>
                    {selectedCar.imageUrl ? (
                      <img src={selectedCar.imageUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">foto</div>
                    )}
                    <span className="flex-1 text-left text-[15px] truncate">{selectedCar.title}</span>
                  </>
                ) : (
                  <>
                    <Car className="w-5 h-5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-left text-[15px] text-muted-foreground">Alege mașina</span>
                  </>
                )}
                <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" />
              </button>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Command>
                  <CommandInput placeholder="Caută mașina..." className="h-11 text-[15px]" />
                  <CommandList className="max-h-56 overflow-y-auto">
                    <CommandEmpty>Nicio mașină găsită.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="fara masina"
                        onSelect={() => { setListingId(""); setCarOpen(false); }}
                        className="flex items-center justify-between cursor-pointer py-2.5"
                      >
                        <span className="text-[15px] font-medium">— fără mașină —</span>
                        {listingId === "" && <Check className="h-4 w-4 text-primary" />}
                      </CommandItem>
                      {cars.map((car: any) => (
                        <CommandItem
                          key={car.id}
                          value={car.title}
                          onSelect={() => { setListingId(car.id); setCarOpen(false); }}
                          className="flex items-center justify-between cursor-pointer py-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {car.imageUrl ? (
                              <img src={car.imageUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">foto</div>
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
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] text-muted-foreground block">Observații (opțional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalii suplimentare..."
              className="bg-background border-input text-foreground min-h-[80px] text-[16px]"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border mt-2 flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || submitting}
            className="flex-1 min-h-[52px] rounded-xl border border-border bg-card text-destructive font-semibold text-[16px] flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Șterge
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || submitting || deleting}
            className="flex-[2] min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Salvează
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AppointmentEditSheet;
