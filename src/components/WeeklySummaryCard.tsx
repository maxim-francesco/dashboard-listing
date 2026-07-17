import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";

interface WeeklySummaryResponse {
  text: string;
  source: "ai" | "fallback";
  facts: {
    viewsThisWeek: number;
    viewsLastWeek: number;
    viewsDeltaPct: number | null;
    newLeadsThisWeek: number;
    uncontactedLeads: number;
    staleCount: number;
    topListing: { title: string; views: number; leads: number } | null;
  };
  generatedAt: string;
}

const WeeklySummaryCard = () => {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["weeklySummary"],
    queryFn: async () => {
      const response = await api.get("/dashboard/weekly-summary");
      return response.data as WeeklySummaryResponse;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // 1h — backendul oricum cache-uiește pe zi
  });

  const handleRefresh = async () => {
    try {
      const response = await api.get("/dashboard/weekly-summary?refresh=1");
      // scriem direct în cache-ul react-query pentru cheia curentă
      refetch();
      toast.success("Rezumat actualizat");
      return response.data;
    } catch (e) {
      toast.error("Nu am putut actualiza rezumatul");
    }
  };

  return (
    <Card className="border-card-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary-light">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          Rezumatul săptămânii
        </CardTitle>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          title="Actualizează rezumatul"
        >
          <RefreshCw
            className={`h-4 w-4 text-muted-foreground ${isFetching ? "animate-spin" : ""}`}
          />
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-2/3 rounded-md bg-muted animate-pulse" />
          </div>
        ) : data ? (
          <p className="text-sm text-foreground leading-relaxed">{data.text}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Rezumatul nu este disponibil momentan.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklySummaryCard;
