import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getReservations, ReservationItem } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { differenceInCalendarDays, isToday, isTomorrow } from "date-fns";

export default function ExpiringAlerts() {
  const navigate = useNavigate();

  const { data: reservations, isLoading } = useQuery<ReservationItem[]>({
    queryKey: ["reservationsForDashboard"],
    queryFn: getReservations,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[48px] w-full rounded-lg" />
      </div>
    );
  }

  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  threeDaysFromNow.setHours(23, 59, 59, 999);

  const activeExpiring = (reservations || []).filter((r) => {
    if (r.status !== "ACTIVE") return false;
    const expiry = new Date(r.expiresAt);
    return expiry <= threeDaysFromNow;
  });

  if (activeExpiring.length === 0) {
    return null;
  }

  const getAlertText = (name: string, expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    if (expiryDate < now) {
      return `Rezervarea lui ${name} a expirat`;
    }
    if (isToday(expiryDate)) {
      return `Rezervarea lui ${name} expiră azi`;
    }
    if (isTomorrow(expiryDate)) {
      return `Rezervarea lui ${name} expiră mâine`;
    }
    const diffDays = differenceInCalendarDays(expiryDate, now);
    return `Rezervarea lui ${name} expiră în ${diffDays} zile`;
  };

  return (
    <div className="space-y-3">
      {activeExpiring.map((item) => {
        const text = getAlertText(item.clientName, item.expiresAt);
        const carTitle = item.listing?.title;
        const fullMessage = carTitle ? `${text} · ${carTitle}` : text;

        return (
          <div
            key={item.id}
            onClick={() => navigate("/reservations")}
            className="rounded-lg bg-warning-light p-3 flex items-center gap-3 cursor-pointer min-h-[44px] transition-colors hover:opacity-95"
          >
            <Clock className="h-5 w-5 text-warning flex-shrink-0" />
            <span className="text-[14px] text-warning font-medium">
              {fullMessage}
            </span>
          </div>
        );
      })}
    </div>
  );
}
