import { useQuery } from "@tanstack/react-query";
import api, { getAppointments, Appointment, getReservations, ReservationItem } from "@/services/api";
import { startOfDay, endOfDay } from "date-fns";
import { Check } from "lucide-react";

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: "GENERAL" | "STOCK" | "ORDER" | "BUYBACK";
  status: "NEW" | "CONTACTED" | "VIEWING" | "OFFER" | "WON" | "LOST";
  lostReason: string | null;
  reminderAt: string | null;
  listingId: string | null;
  listing?: {
    id: string;
    title: string;
  };
}

export default function AllClearCard() {
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await api.get("/messages");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const start = startOfDay(new Date()).toISOString();
  const end = endOfDay(new Date()).toISOString();

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["appointments", "today"],
    queryFn: () => getAppointments({ start, end }),
    refetchOnWindowFocus: false,
  });

  const { data: reservations, isLoading: isLoadingReservations } = useQuery<ReservationItem[]>({
    queryKey: ["reservationsForDashboard"],
    queryFn: getReservations,
    refetchOnWindowFocus: false,
  });

  if (isLoadingMessages || isLoadingAppointments || isLoadingReservations) {
    return null;
  }

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  threeDaysFromNow.setHours(23, 59, 59, 999);

  const activeExpiring = (reservations || []).filter((r) => {
    if (r.status !== "ACTIVE") return false;
    const expiry = new Date(r.expiresAt);
    return expiry <= threeDaysFromNow;
  });

  if (activeExpiring.length > 0) {
    return null;
  }

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const filteredMessages = (messages || []).filter((m) => {
    if (m.status === "NEW") return true;
    if (m.reminderAt && m.status !== "WON" && m.status !== "LOST") {
      return new Date(m.reminderAt) <= endOfToday;
    }
    return false;
  });

  const filteredAppointments = (appointments || [])
    .filter((appt) => appt.status !== "CANCELLED");

  if (filteredMessages.length === 0 && filteredAppointments.length === 0) {
    return (
      <div className="bg-success-light rounded-xl p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-success flex items-center justify-center text-success-foreground flex-shrink-0">
          <Check className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-medium text-success">Ești la zi</h3>
          <p className="text-sm text-success">Nimeni de sunat, nicio programare azi.</p>
        </div>
      </div>
    );
  }

  return null;
}
