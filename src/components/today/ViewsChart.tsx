import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

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
    <div>
      {/* Label OUTSIDE the panel */}
      <div className="flex items-baseline justify-between mt-1 mb-2.5 px-0.5">
        <span className="text-[17px] font-semibold text-foreground">
          Vizualizări în ultimele 7 zile
        </span>
        {showTrend && (
          <span
            className={`text-[13px] shrink-0 ${
              viewsDeltaPct > 0 ? "text-success" : "text-destructive"
            }`}
          >
            {viewsDeltaPct > 0 ? "+" : "−"}
            {Math.abs(viewsDeltaPct)}% față de săptămâna trecută
          </span>
        )}
      </div>

      {/* Panel */}
      <div className="bg-card border border-border rounded-xl p-3.5">
        {/* (a) A total row at the top */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[28px] font-medium leading-none">{totalViews}</span>
          <span className="text-[13px] text-muted-foreground">vizualizări</span>
        </div>

        {/* (b) The chart */}
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

        {/* (c) A day-label row under the chart */}
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
