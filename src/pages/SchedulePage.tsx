import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Loader2,
  ArrowLeft,
  Phone,
  Car,
  CalendarOff,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { getAppointments, Appointment, AppointmentType } from "@/services/api";
import { Button } from "@/components/ui/button";
import AppointmentEditSheet from "@/components/modals/AppointmentEditSheet";
import AppointmentWizard from "@/components/modals/AppointmentWizard";
import { roCount } from "@/lib/plural";
import { cn } from "@/lib/utils";

const VISIBLE_DAYS = 5;

const TYPE_LABELS: Record<AppointmentType, string> = {
  TEST_DRIVE: "Test-drive",
  VIEWING: "Vizionare",
  HANDOVER: "Predare",
  MEETING: "Întâlnire",
  OTHER: "Altele",
};

const TYPE_BADGE: Record<AppointmentType, string> = {
  TEST_DRIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  VIEWING: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  HANDOVER: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  MEETING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  OTHER: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Finalizată",
  CANCELLED: "Anulată",
};

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
};
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const dayLabel = (date: Date) => {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(date, today)) return "Azi";
  if (isSameDay(date, tomorrow)) return "Mâine";
  return format(date, "EEEE, d MMMM", { locale: ro });
};

const SchedulePage = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<any>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const changeTab = (t: "upcoming" | "past") => {
    setTab(t);
    setExpanded(false);
  };

  const { data = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: () => getAppointments(),
    refetchOnWindowFocus: false,
  });

  const startToday = startOfToday();

  const { upcoming, past } = useMemo(() => {
    const up: Appointment[] = [];
    const pa: Appointment[] = [];
    for (const a of data ?? []) {
      if (new Date(a.startAt) >= startToday) up.push(a);
      else pa.push(a);
    }
    up.sort((x, y) => new Date(x.startAt).getTime() - new Date(y.startAt).getTime());
    pa.sort((x, y) => new Date(y.startAt).getTime() - new Date(x.startAt).getTime());
    return { upcoming: up, past: pa };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const groups = useMemo(() => {
    const activeList = tab === "upcoming" ? upcoming : past;
    const map = new Map<string, Appointment[]>();
    for (const a of activeList) {
      const d = new Date(a.startAt);
      const key = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.values()).map((items) => ({
      date: new Date(items[0].startAt),
      items,
    }));
  }, [tab, upcoming, past]);

  const visibleGroups = expanded ? groups : groups.slice(0, VISIBLE_DAYS);
  const hiddenGroupCount = Math.max(0, groups.length - VISIBLE_DAYS);
  const hiddenApptCount = groups.slice(VISIBLE_DAYS).reduce((n, g) => n + g.items.length, 0);

  const openEdit = (a: Appointment) => {
    setEditInitial({
      id: a.id,
      title: a.title,
      type: a.type,
      startAt: a.startAt,
      endAt: a.endAt,
      clientName: a.clientName,
      clientPhone: a.clientPhone,
      listingId: a.listingId,
      notes: a.notes,
      status: a.status,
    });
    setEditOpen(true);
  };

  const activeList = tab === "upcoming" ? upcoming : past;
  const countText = `${upcoming.length} viitoare · ${roCount(data.length, "programare", "programări")}`;

  return (
    <div className="space-y-4 pb-20 min-w-0 w-full">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            aria-label="Înapoi la clienți"
            className="w-9 h-9 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-baseline gap-2 shrink-0">
            <h1 className="text-[17px] font-semibold text-foreground leading-none">
              Programări
            </h1>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {countText}
            </span>
          </div>
        </div>

        <Button
          onClick={() => setWizardOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[13px] h-9 px-3 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Programare nouă</span>
        </Button>
      </div>

      {/* Mobile Header (Band 1: back button · title over count · square action button) */}
      <div className="flex items-center gap-2 lg:hidden">
        <Link
          to="/customers"
          aria-label="Înapoi la clienți"
          className="w-11 h-11 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-medium text-foreground leading-tight truncate">
            Programări
          </h1>
          <p className="text-[12px] text-muted-foreground leading-tight truncate mt-0.5 tabular-nums">
            {countText}
          </p>
        </div>

        <Button
          variant="ghost"
          aria-label="Programare nouă"
          onClick={() => setWizardOpen(true)}
          className="w-11 h-11 p-0 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Segmented Control Tabs */}
      <div className="grid grid-cols-2 p-1 bg-muted/60 border border-border rounded-lg">
        <button
          type="button"
          onClick={() => changeTab("upcoming")}
          className={cn(
            "min-h-[44px] lg:min-h-[36px] flex items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-all cursor-pointer select-none",
            tab === "upcoming"
              ? "bg-card text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Următoarele</span>
          <span
            className={cn(
              "text-[11px] px-1.5 py-0.5 rounded-full font-medium tabular-nums",
              tab === "upcoming"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {upcoming.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => changeTab("past")}
          className={cn(
            "min-h-[44px] lg:min-h-[36px] flex items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-all cursor-pointer select-none",
            tab === "past"
              ? "bg-card text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Trecute</span>
          <span
            className={cn(
              "text-[11px] px-1.5 py-0.5 rounded-full font-medium tabular-nums",
              tab === "past"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {past.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : activeList.length === 0 ? (
        <div className="text-center py-16 px-4">
          <CalendarOff className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
          <p className="text-[15px] text-muted-foreground">
            {tab === "upcoming" ? "Nicio programare viitoare." : "Nicio programare trecută."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {visibleGroups.map((g, gi) => (
            <div key={gi} className="space-y-2.5">
              <div className="flex items-baseline justify-between px-1">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                  {dayLabel(g.date)}
                  {!isSameDay(g.date, startToday) && ` · ${format(g.date, "d MMMM", { locale: ro })}`}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {g.items.length}
                </span>
              </div>

              {g.items.map((a) => {
                const cancelled = a.status === "CANCELLED";
                return (
                  <div
                    key={a.id}
                    onClick={() => openEdit(a)}
                    className={cn(
                      "bg-card border border-border rounded-xl p-3.5 flex gap-3 cursor-pointer hover:bg-accent/40 transition-colors min-h-[48px]",
                      cancelled && "opacity-60"
                    )}
                  >
                    <div className="text-center min-w-[48px] shrink-0">
                      <p className="text-[17px] font-semibold text-foreground leading-tight">{hhmm(a.startAt)}</p>
                      <p className="text-[12px] text-muted-foreground">{hhmm(a.endAt)}</p>
                    </div>
                    <div className="w-px bg-border self-stretch" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", TYPE_BADGE[a.type])}>
                          {TYPE_LABELS[a.type]}
                        </span>
                        {a.status !== "SCHEDULED" && (
                          <span
                            className={cn(
                              "text-[11px] font-medium px-2 py-0.5 rounded-full",
                              a.status === "CANCELLED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                            )}
                          >
                            {STATUS_LABELS[a.status]}
                          </span>
                        )}
                      </div>
                      <p className={cn("text-[15px] font-medium text-foreground truncate", cancelled && "line-through")}>
                        {a.title}
                      </p>
                      {(a.clientName || a.clientPhone) && (
                        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-1">
                          {a.clientName && <span className="truncate">{a.clientName}</span>}
                          {a.clientPhone && (
                            <a
                              href={"tel:" + a.clientPhone}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-primary shrink-0 hover:underline min-h-[24px]"
                            >
                              <Phone className="w-3.5 h-3.5" /> {a.clientPhone}
                            </a>
                          )}
                        </div>
                      )}
                      {a.listing?.title && (
                        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-0.5">
                          <Car className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{a.listing.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {!expanded && hiddenGroupCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full min-h-[48px] rounded-xl border border-border bg-card text-[14px] font-medium text-foreground hover:bg-accent/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Arată mai multe ({hiddenApptCount}) <ChevronDown className="w-4 h-4" />
            </button>
          )}
          {expanded && groups.length > VISIBLE_DAYS && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="w-full min-h-[48px] rounded-xl border border-border bg-card text-[14px] font-medium text-muted-foreground hover:bg-accent/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Arată mai puțin <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <AppointmentEditSheet
        isOpen={editOpen}
        initial={editInitial}
        onClose={() => setEditOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["appointments"] })}
      />

      <AppointmentWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["appointments"] })}
      />
    </div>
  );
};

export default SchedulePage;
