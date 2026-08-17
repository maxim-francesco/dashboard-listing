import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar-dark.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppointments, Appointment, AppointmentType } from '@/services/api';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import AppointmentModal from '@/components/modals/AppointmentModal';

const locales = {
  ro,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const TYPE_COLORS: Record<AppointmentType, string> = {
  TEST_DRIVE: '#378ADD',
  VIEWING: '#1D9E75',
  HANDOVER: '#7F77DD',
  MEETING: '#EF9F27',
  OTHER: '#888780',
};

const TYPE_LABELS: Record<AppointmentType, string> = {
  TEST_DRIVE: 'Test-drive',
  VIEWING: 'Vizionare',
  HANDOVER: 'Predare',
  MEETING: 'Întâlnire',
  OTHER: 'Altele',
};

const EventContent = ({ event }: any) => {
  const d = event.start instanceof Date ? event.start : new Date(event.start);
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return (
    <span style={{ fontSize: '12px', lineHeight: 1.2 }}>
      <strong style={{ fontWeight: 600 }}>{hh}:{mm}</strong> {event.title}
    </span>
  );
};

const CalendarPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalInitial, setModalInitial] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: () => getAppointments(),
    refetchOnWindowFocus: false,
  });

  const events = useMemo(() => {
    return (data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      start: new Date(a.startAt),
      end: new Date(a.endAt),
      resource: a,
    }));
  }, [data]);

  const eventPropGetter = (event: any) => {
    const type = event.resource.type as AppointmentType;
    const isCancelled = event.resource.status === 'CANCELLED';
    return {
      style: {
        backgroundColor: TYPE_COLORS[type] || '#888780',
        border: 'none',
        color: '#fff',
        fontSize: '12px',
        opacity: isCancelled ? 0.5 : 1,
      },
    };
  };

  const messages = {
    allDay: 'Toată ziua',
    previous: 'Înapoi',
    next: 'Înainte',
    today: 'Astăzi',
    month: 'Lună',
    week: 'Săptămână',
    day: 'Zi',
    agenda: 'Agendă',
    date: 'Dată',
    time: 'Oră',
    event: 'Eveniment',
    noEventsInRange: 'Nicio programare în acest interval.',
    showMore: (total: number) => `+ încă ${total}`,
  };

  const handleSelectEvent = (event: any) => {
    const a = event.resource as Appointment;
    setModalMode('edit');
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

  const handleSelectSlot = (slot: { start: Date; end: Date }) => {
    setModalMode('create');
    setModalInitial({
      startAt: slot.start.toISOString(),
      endAt: slot.end.toISOString(),
      type: 'OTHER',
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-2">Programările parcului.</p>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 items-center bg-card p-3 rounded-lg border border-card-border">
          <span className="text-xs font-semibold text-muted-foreground mr-1 uppercase tracking-wider">Legendă:</span>
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5 text-sm">
              <span 
                className="w-3.5 h-3.5 rounded-full inline-block" 
                style={{ backgroundColor: TYPE_COLORS[type as AppointmentType] }}
              />
              <span className="text-foreground font-medium text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-card-border bg-card">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground mt-2">Se încarcă programările...</p>
            </div>
          ) : (
            <div className="text-foreground" style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                defaultView={Views.MONTH}
                defaultDate={new Date()}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                eventPropGetter={eventPropGetter}
                messages={messages}
                culture="ro"
                selectable
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                components={{ event: EventContent }}
                className="rounded-lg shadow-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentModal
        isOpen={modalOpen}
        mode={modalMode}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
      />
    </div>
  );
};

export default CalendarPage;
