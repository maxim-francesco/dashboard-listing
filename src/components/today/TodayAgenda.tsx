import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getAppointments, Appointment } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";

const TYPE_RAIL_COLORS: Record<string, string> = {
  TEST_DRIVE: "#378ADD",
  VIEWING: "#1D9E75",
  HANDOVER: "#7F77DD",
  MEETING: "#EF9F27",
  OTHER: "#6B7280",
};

const TYPE_LABELS: Record<string, string> = {
  TEST_DRIVE: "Test-drive",
  VIEWING: "Vizionare",
  HANDOVER: "Predare",
  MEETING: "Întâlnire",
  OTHER: "Altele",
};

export default function TodayAgenda() {
  const navigate = useNavigate();

  const start = startOfDay(new Date()).toISOString();
  const end = endOfDay(new Date()).toISOString();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments", "today"],
    queryFn: () => getAppointments({ start, end }),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="border-card-border bg-card">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between min-h-[64px] py-2 border-b border-border last:border-0 gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-8 w-[3px] rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-11 w-11 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const filtered = (appointments || [])
    .filter((appt) => appt.status !== "CANCELLED")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  if (filtered.length === 0) {
    return null;
  }

  return (
    <Card className="border-card-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">Programările de azi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {filtered.map((item) => {
          const timeStr = format(new Date(item.startAt), "HH:mm");
          const railColor = TYPE_RAIL_COLORS[item.type] || TYPE_RAIL_COLORS.OTHER;
          const typeLabel = TYPE_LABELS[item.type] || TYPE_LABELS.OTHER;
          const carTitle = item.listing?.title;
          const mainLine = carTitle ? `${typeLabel} · ${carTitle}` : typeLabel;

          const clientName = item.clientName || "Fără nume";
          const subLine = item.clientPhone ? `${clientName} · ${item.clientPhone}` : clientName;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between min-h-[64px] py-2 border-b border-border last:border-0 gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-base font-semibold text-foreground w-12 flex-shrink-0 text-left">
                  {timeStr}
                </span>
                <div
                  className="w-[3px] self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: railColor }}
                />
                <div className="flex-1 min-w-0 ml-1">
                  <div className="text-[15px] font-medium text-foreground truncate">
                    {mainLine}
                  </div>
                  <div className="text-[13px] text-muted-foreground truncate">
                    {subLine}
                  </div>
                </div>
              </div>
              {item.clientPhone && (
                <a
                  href={`tel:${item.clientPhone}`}
                  className="w-11 h-11 rounded-full bg-success text-success-foreground flex items-center justify-center flex-shrink-0 hover:opacity-90"
                  aria-label={`Suna pe ${clientName}`}
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          );
        })}

        <div className="pt-3 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-primary hover:text-primary-hover font-medium text-[14px] h-11 flex items-center justify-center"
            onClick={() => navigate("/calendar")}
          >
            Vezi calendarul
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
