import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { ro } from "date-fns/locale";
import { Loader2, ArrowLeft, Phone, Car, CalendarOff, CalendarClock, ChevronDown, ChevronUp } from "lucide-react";
import { getAppointments, Appointment, AppointmentType } from "@/services/api";
import AppointmentEditSheet from "@/components/modals/AppointmentEditSheet";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<any>(null);

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
    setModalInitial({
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
    setModalOpen(true);
  };

  const activeList = tab === "upcoming" ? upcoming : past;

  return (
    <div className="space-y-4 pb-24">
      <button
        onClick={() => navigate("/customers")}
        className="flex items-center gap-2 text-[14px] text-muted-foreground h-11"
      >
        <ArrowLeft className="w-4 h-4" /> Înapoi la clienți
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarClock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">Calendar</h1>
          <p className="text-[13px] text-muted-foreground">Ce ai programat</p>
        </div>
      </div>

      <div className="flex gap-1.5 p-1 bg-muted rounded-xl">
        <button
          onClick={() => changeTab("upcoming")}
          className={
            "flex-1 py-2.5 rounded-lg text-[14px] font-medium transition-colors " +
            (tab === "upcoming" ? "bg-card text-foreground border border-border" : "text-muted-foreground")
          }
        >
          Următoarele ({upcoming.length})
        </button>
        <button
          onClick={() => changeTab("past")}
          className={
            "flex-1 py-2.5 rounded-lg text-[14px] font-medium transition-colors " +
            (tab === "past" ? "bg-card text-foreground border border-border" : "text-muted-foreground")
          }
        >
          Trecute ({past.length})
        </button>
      </div>

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
              <div className="flex items-center gap-2 px-0.5">
                <span className="text-[14px] font-medium text-foreground capitalize">{dayLabel(g.date)}</span>
                {!isSameDay(g.date, startToday) && (
                  <span className="text-[13px] text-muted-foreground capitalize">
                    · {format(g.date, "d MMM", { locale: ro })}
                  </span>
                )}
                <span className="ml-auto text-[12px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {g.items.length}
                </span>
              </div>

              {g.items.map((a) => {
                const cancelled = a.status === "CANCELLED";
                return (
                  <div
                    key={a.id}
                    onClick={() => openEdit(a)}
                    className={
                      "bg-card border border-border rounded-xl p-3.5 flex gap-3 cursor-pointer hover:bg-accent/40 transition-colors " +
                      (cancelled ? "opacity-60" : "")
                    }
                  >
                    <div className="text-center min-w-[48px]">
                      <p className="text-[17px] font-semibold text-foreground leading-tight">{hhmm(a.startAt)}</p>
                      <p className="text-[12px] text-muted-foreground">{hhmm(a.endAt)}</p>
                    </div>
                    <div className="w-px bg-border self-stretch" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={"text-[11px] font-medium px-2 py-0.5 rounded-full " + TYPE_BADGE[a.type]}>
                          {TYPE_LABELS[a.type]}
                        </span>
                        {a.status !== "SCHEDULED" && (
                          <span
                            className={
                              "text-[11px] font-medium px-2 py-0.5 rounded-full " +
                              (a.status === "CANCELLED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300")
                            }
                          >
                            {STATUS_LABELS[a.status]}
                          </span>
                        )}
                      </div>
                      <p className={"text-[15px] font-medium text-foreground truncate " + (cancelled ? "line-through" : "")}>
                        {a.title}
                      </p>
                      {(a.clientName || a.clientPhone) && (
                        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-1">
                          {a.clientName && <span className="truncate">{a.clientName}</span>}
                          {a.clientPhone && (
                            <a href={"tel:" + a.clientPhone} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-primary shrink-0">
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
              onClick={() => setExpanded(true)}
              className="w-full min-h-[48px] rounded-xl border border-border bg-card text-[14px] font-medium text-foreground hover:bg-accent/40 transition-colors flex items-center justify-center gap-1.5"
            >
              Arată mai multe ({hiddenApptCount}) <ChevronDown className="w-4 h-4" />
            </button>
          )}
          {expanded && groups.length > VISIBLE_DAYS && (
            <button
              onClick={() => setExpanded(false)}
              className="w-full min-h-[48px] rounded-xl border border-border bg-card text-[14px] font-medium text-muted-foreground hover:bg-accent/40 transition-colors flex items-center justify-center gap-1.5"
            >
              Arată mai puțin <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <AppointmentEditSheet
        isOpen={modalOpen}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["appointments"] })}
      />
    </div>
  );
};

export default SchedulePage;
