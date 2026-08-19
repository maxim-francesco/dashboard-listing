import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface LeadReminderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentReminderAt: string | null;
  onSaveReminder: (isoString: string) => void;
  onClearReminder: () => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

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

export function LeadReminderSheet({
  isOpen,
  onClose,
  currentReminderAt,
  onSaveReminder,
  onClearReminder,
}: LeadReminderSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("10:00");

  useEffect(() => {
    if (isOpen) {
      if (currentReminderAt) {
        const d = new Date(currentReminderAt);
        setSelectedDate(d);
        setSelectedTime(pad(d.getHours()) + ":" + pad(d.getMinutes()));
      } else {
        setSelectedDate(new Date());
        setSelectedTime("10:00");
      }
    }
  }, [isOpen, currentReminderAt]);

  const readableSummary = useMemo(() => {
    if (!selectedDate) return "Alege data";
    try {
      return (
        format(selectedDate, "EEEE, d MMMM", { locale: ro }) +
        " la ora " +
        selectedTime
      );
    } catch {
      return selectedTime;
    }
  }, [selectedDate, selectedTime]);

  const handleSave = () => {
    if (!selectedDate) return;
    const y = selectedDate.getFullYear();
    const mo = selectedDate.getMonth();
    const da = selectedDate.getDate();
    const [sh, sm] = selectedTime.split(":").map(Number);
    const iso = new Date(y, mo, da, sh || 10, sm || 0, 0, 0).toISOString();
    onSaveReminder(iso);
    onClose();
  };

  const handleClear = () => {
    onClearReminder();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="bg-card border-border rounded-t-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto [&>button.absolute]:hidden"
      >
        <SheetHeader>
          <SheetTitle className="text-[17px] font-semibold text-foreground text-left">
            Recontactare (Reminder)
          </SheetTitle>
          <SheetDescription className="text-[13px] text-muted-foreground text-left">
            Setează data și ora când vrei să recontactezi clientul
          </SheetDescription>
        </SheetHeader>

        {/* Selected date / time preview */}
        <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              Programat pentru
            </div>
            <div className="text-[14px] font-medium text-foreground capitalize mt-0.5">
              {readableSummary}
            </div>
          </div>
        </div>

        {/* Calendar Picker */}
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
            Alege ziua
          </div>
          <div className="rounded-xl border border-border bg-card flex justify-center p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(d: Date) => d < startOfToday()}
              initialFocus
              locale={ro}
            />
          </div>
        </div>

        {/* Time Slots Grid */}
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
            Alege ora
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={cn(
                    "min-h-[44px] rounded-lg border text-[13px] font-medium transition-colors select-none cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions bar */}
        <div className="pt-2 border-t border-border flex gap-2.5">
          {currentReminderAt && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="flex-1 min-h-[44px] border-destructive text-destructive hover:bg-destructive/10 text-[13px] font-semibold rounded-lg"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Șterge
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={!selectedDate}
            className="flex-[2] min-h-[44px] bg-primary text-primary-foreground font-semibold text-[13px] rounded-lg"
          >
            Salvează reminder
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
