import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { CARD, CARD_HEADER, CARD_LABEL, CARD_LABEL_M, CARD_COUNT } from "./cardRecipe";

interface ChartDataPoint {
  date: string;
  views: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const date = new Date(dataPoint.date + "T00:00:00");
    const dayLong = format(date, "EEEE", { locale: ro }).toLowerCase();
    return (
      <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-[13px] shadow-sm">
        <span className="text-foreground">
          {dayLong} · {dataPoint.views} vizualizări
        </span>
      </div>
    );
  }
  return null;
};

export default function ViewsChart() {
  const { data: chartData = [], isLoading: isChartLoading } = useQuery<ChartDataPoint[]>({
    queryKey: ["views-chart"],
    queryFn: async () => {
      const response = await api.get("/dashboard/chart");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const { data: weeklySummaryData } = useQuery<any>({
    queryKey: ["weeklySummary"],
    queryFn: async () => {
      const response = await api.get("/dashboard/weekly-summary");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // 1h
  });

  if (isChartLoading) {
    return null;
  }

  const hasPositiveValue = chartData && chartData.length > 0 && chartData.some((d) => d.views > 0);
  if (!hasPositiveValue) {
    return null;
  }

  const viewsDeltaPct = weeklySummaryData?.facts?.viewsDeltaPct;
  const showTrend = typeof viewsDeltaPct === "number" && viewsDeltaPct !== 0;

  const totalViews = chartData.reduce((sum, d) => sum + d.views, 0);

  return (
    <div className={`${CARD} overflow-hidden w-full`}>
      {/* Header inside card using cardRecipe */}
      <div className={CARD_HEADER}>
        <span className={`${CARD_LABEL_M} lg:hidden`}>Vizualizări · 7 zile</span>
        <span className={`${CARD_LABEL} hidden lg:block`}>Vizualizări · 7 zile</span>
        <span className={CARD_COUNT}>
          {totalViews}
          {showTrend && (
            <>
              {" · "}
              <span
                className={
                  viewsDeltaPct > 0 ? "text-success" : "text-destructive"
                }
              >
                {viewsDeltaPct > 0 ? "+" : "−"}
                {Math.abs(viewsDeltaPct)}%
              </span>
            </>
          )}
        </span>
      </div>

      {/* Body with padding */}
      <div className="p-3.5">
        {/* Chart */}
        <div className="h-[120px] lg:h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.15)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Day-label row under chart */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {chartData.map((d) => {
            const date = new Date(d.date + "T00:00:00");
            const dayLabel = format(date, "eee", { locale: ro }).replace(/\./g, "").toLowerCase();
            return (
              <div key={d.date} className="text-[11px] text-muted-foreground">
                {dayLabel}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
