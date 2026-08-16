import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { formatEur } from "@/lib/format";

interface ReservationNoticeProps {
  reservation: {
    clientName: string;
    depositAmount: number;
    expiresAt: string;
  };
}

export default function ReservationNotice({ reservation }: ReservationNoticeProps) {
  return (
    <div className="border border-border rounded-[var(--radius)] p-3 text-[13px] text-foreground bg-card select-none">
      <div>Rezervată de {reservation.clientName}</div>
      <div className="text-muted-foreground mt-0.5">
        {formatEur(reservation.depositAmount)} avans · expiră {format(new Date(reservation.expiresAt), "dd MMM yyyy", { locale: ro })}
      </div>
    </div>
  );
}
