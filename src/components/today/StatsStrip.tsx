import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { normalizeRoPhone } from "@/utils/phone";
import { differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { CARD, CARD_HEADER, CARD_LABEL_M } from "./cardRecipe";

interface StockCounts {
  available: number;
  reserved: number;
  incoming: number;
  sold: number;
  soldThisMonth: number;
}

interface Listing {
  id: string;
  createdAt: string;
  status: string;
}

interface Message {
  id: string;
  phone: string | null;
  status: string;
  reminderAt: string | null;
}

interface ChartDataPoint {
  date: string;
  views: number;
}

export default function StatsStrip() {
  const navigate = useNavigate();

  // Query 1: Stock counts
  const { data: stockCounts, isLoading: isCountsLoading } = useQuery<StockCounts>({
    queryKey: ["stock-counts"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stock-counts");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Query 2: Listings for dashboard
  const { data: listings, isLoading: isListingsLoading } = useQuery<Listing[]>({
    queryKey: ["listingsForDashboard"],
    queryFn: async () => {
      const response = await api.get("/listings");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Query 3: Messages
  const { data: messages, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await api.get("/messages");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Query 4: Views chart
  const { data: chartData, isLoading: isChartLoading } = useQuery<ChartDataPoint[]>({
    queryKey: ["views-chart"],
    queryFn: async () => {
      const response = await api.get("/dashboard/chart");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const isLoading = isCountsLoading || isListingsLoading || isMessagesLoading || isChartLoading;

  if (isLoading) {
    return (
      <>
        {/* Mobile Skeleton */}
        <div className={`${CARD} overflow-hidden w-full lg:hidden p-4 space-y-3`}>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Desktop Skeleton */}
        <div className={`${CARD} hidden lg:flex overflow-hidden w-full`}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-3.5 flex-1 min-w-0 flex flex-col justify-between lg:border-r lg:border-border lg:last:border-r-0 lg:border-b-0"
            >
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-10" />
            </div>
          ))}
        </div>
      </>
    );
  }

  // 1. Available count
  const availableCount = stockCounts?.available ?? 0;

  // 2. Stale count (> 45 days in stock)
  const now = new Date();
  const staleCount = (listings || []).filter(
    (l) => l.status === "AVAILABLE" && differenceInDays(now, new Date(l.createdAt)) > 45
  ).length;

  // 3. Callable people ("de sunat")
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const openLeadSet = (messages || []).filter((m) => {
    if (m.status === "NEW") return true;
    if (m.reminderAt && m.status !== "WON" && m.status !== "LOST") {
      return new Date(m.reminderAt) <= endOfToday;
    }
    return false;
  });
  const callableLeads = openLeadSet.filter((lead) => normalizeRoPhone(lead.phone) !== "");
  const callableCount = new Set(callableLeads.map((lead) => normalizeRoPhone(lead.phone))).size;

  // 4. Views in last 7 days
  const viewsLast7Days = (chartData || []).reduce((sum, d) => sum + (d.views || 0), 0);

  // 5. Sold this month
  const soldThisMonth = stockCounts?.soldThisMonth ?? 0;

  const desktopStats: {
    key: string;
    value: number;
    label: string;
    href?: string;
  }[] = [
    { key: "available", value: availableCount, label: "în stoc", href: "/listings?view=stoc" },
    { key: "stale", value: staleCount, label: "stau >45 zile" },
    { key: "callable", value: callableCount, label: "de sunat", href: "/messages?tab=action" },
    { key: "views", value: viewsLast7Days, label: "vizualizări · 7 zile" },
    { key: "soldThisMonth", value: soldThisMonth, label: "vândute luna asta", href: "/listings?view=vandute" },
  ];

  const getValueColor = (key: string, val: number) => {
    if (key === "stale") return "text-destructive";
    if (key === "soldThisMonth" && val === 0) return "text-muted-foreground";
    return "text-foreground";
  };

  return (
    <>
      {/* MOBILE BLOCK — Sumar Card */}
      <div className={`${CARD} overflow-hidden w-full lg:hidden`}>
        <div className={CARD_HEADER}>
          <span className={CARD_LABEL_M}>Sumar</span>
        </div>
        <div className="divide-y divide-border">
          {/* Row 1: În stoc (navigable) */}
          <button
            type="button"
            onClick={() => navigate("/listings?view=stoc")}
            className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between hover:bg-accent/5 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-[14px] text-foreground">În stoc</span>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium tabular-nums text-foreground">
                {availableCount}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </button>

          {/* Row 2: Vizite · 7 zile (non-navigable) */}
          <div className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between">
            <span className="text-[14px] text-foreground">Vizite · 7 zile</span>
            <span className="text-[14px] font-medium tabular-nums text-foreground">
              {viewsLast7Days}
            </span>
          </div>

          {/* Row 3: Vândute luna asta (navigable) */}
          <button
            type="button"
            onClick={() => navigate("/listings?view=vandute")}
            className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between hover:bg-accent/5 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-[14px] text-foreground">Vândute luna asta</span>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium tabular-nums text-foreground">
                {soldThisMonth}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </button>
        </div>
      </div>

      {/* DESKTOP BLOCK — Preserved 5-cell flex strip */}
      <div className={`${CARD} hidden lg:flex overflow-hidden w-full`}>
        {desktopStats.map((stat, i) => {
          const colorClass = getValueColor(stat.key, stat.value);
          const borderClasses = "lg:border-r lg:border-border lg:last:border-r-0 lg:border-b-0";

          if (stat.href) {
            return (
              <button
                key={stat.key}
                type="button"
                onClick={() => navigate(stat.href!)}
                className={`p-3.5 flex-1 min-w-0 flex flex-col justify-between text-left cursor-pointer hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors ${borderClasses}`}
              >
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground truncate block">
                  {stat.label}
                </span>
                <span className={`text-[19px] font-medium tabular-nums leading-none mt-1.5 ${colorClass}`}>
                  {stat.value}
                </span>
              </button>
            );
          }

          return (
            <div
              key={stat.key}
              className={`p-3.5 flex-1 min-w-0 flex flex-col justify-between ${borderClasses}`}
            >
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground truncate block">
                {stat.label}
              </span>
              <span className={`text-[19px] font-medium tabular-nums leading-none mt-1.5 ${colorClass}`}>
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
