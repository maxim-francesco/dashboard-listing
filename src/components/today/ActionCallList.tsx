import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizePhone } from "@/lib/phone";
import { Phone, User } from "lucide-react";

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

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "Cerere generală",
  STOCK: "Din stoc",
  ORDER: "Comandă",
  BUYBACK: "Buy-back",
};

const getInitials = (name?: string | null) => {
  if (!name) return null;
  const cleanName = name.trim();
  if (!cleanName) return null;
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const rom = (n: number, one: string, many: string) =>
  n === 1 ? `${n} ${one}` : n >= 20 ? `${n} de ${many}` : `${n} ${many}`;


export default function ActionCallList() {
  const navigate = useNavigate();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await api.get("/messages");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="border-border bg-card shadow-sm rounded-[14px]">
        <div className="p-4 pb-3 flex items-baseline gap-1.5">
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-3 gap-3 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-11 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const openLeadSet = (messages || []).filter((m) => {
    if (m.status === "NEW") return true;
    if (m.reminderAt && m.status !== "WON" && m.status !== "LOST") {
      return new Date(m.reminderAt) <= endOfToday;
    }
    return false;
  });

  const callableLeads = openLeadSet.filter((lead) => normalizePhone(lead.phone) !== null);
  const unreachableCount = openLeadSet.length - callableLeads.length;

  const sorted = [...callableLeads].sort((a, b) => {
    const aReminder = a.reminderAt ? new Date(a.reminderAt).getTime() : null;
    const bReminder = b.reminderAt ? new Date(b.reminderAt).getTime() : null;

    if (aReminder !== null && bReminder !== null) {
      return aReminder - bReminder;
    }
    if (aReminder !== null) return -1;
    if (bReminder !== null) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const distinctCount = new Set(callableLeads.map((lead) => normalizePhone(lead.phone))).size;

  if (distinctCount === 0 && unreachableCount === 0) {
    return null;
  }

  const displayItems = sorted.slice(0, 3);
  const countLabel = rom(distinctCount, "persoană de sunat", "persoane de sunat").substring(String(distinctCount).length + 1);

  return (
    <div>
      <div className="text-[17px] font-semibold text-foreground mt-1 mb-2.5 px-0.5">
        De sunat
      </div>
      <Card className="border-border bg-card shadow-sm rounded-[14px]">
        <div className="p-4 pb-3 flex items-baseline gap-1.5">
          <span className="text-[34px] font-medium leading-none">{distinctCount}</span>
          <span className="text-[15px] text-muted-foreground">{countLabel}</span>
        </div>
        <div>
          {displayItems.map((item, index) => {
            const initials = getInitials(item.name);
            const isOverdue = !!(item.reminderAt && new Date(item.reminderAt) < now && item.status !== "WON" && item.status !== "LOST");
            const subText = item.listing?.title || TYPE_LABELS[item.type] || "";
            
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 gap-3 ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <div
                  onClick={() => navigate("/messages")}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                    {initials ? initials : <User className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-foreground truncate">
                      {item.name || "Fără nume"}
                    </div>
                    <div className={`text-[13px] truncate ${isOverdue ? "text-warning" : "text-muted-foreground"}`}>
                      {subText}
                      {isOverdue && " · reminder depășit"}
                    </div>
                  </div>
                </div>
                {item.phone && (
                  <a
                    href={`tel:${item.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-11 h-11 rounded-full bg-success-light text-success flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-colors"
                    aria-label={`Suna pe ${item.name || "client"}`}
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                )}
              </div>
            );
          })}

          {sorted.length > 3 && (
            <button
              onClick={() => navigate("/messages")}
              className="w-full text-primary hover:text-primary-hover font-medium text-[14px] py-3 text-center border-t border-border transition-colors block cursor-pointer"
            >
              Vezi toate
            </button>
          )}

          {unreachableCount > 0 && (
            <button
              onClick={() => navigate("/messages")}
              className="w-full text-[13px] text-muted-foreground font-medium py-3 text-center border-t border-border transition-colors block cursor-pointer min-h-[44px]"
            >
              {rom(unreachableCount, "mesaj fără telefon", "mesaje fără telefon")}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
