import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import api from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CARD, CARD_HEADER, CARD_LABEL, CARD_LABEL_M } from "@/components/today/cardRecipe";

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
  const { data, isLoading } = useQuery({
    queryKey: ["weeklySummary"],
    queryFn: async () => {
      const response = await api.get("/dashboard/weekly-summary");
      return response.data as WeeklySummaryResponse;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // 1h
  });

  if (isLoading) {
    return (
      <div className={`${CARD} overflow-hidden w-full`}>
        <div className={CARD_HEADER}>
          <Sparkles className="w-[15px] h-[15px] text-primary shrink-0" />
          <span className={`${CARD_LABEL_M} lg:hidden`}>Rezumatul săptămânii</span>
          <span className={`${CARD_LABEL} hidden lg:block`}>Rezumatul săptămânii</span>
        </div>
        <div className="px-4 py-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  const textContent = data ? data.text : "Rezumatul nu este disponibil momentan.";

  return (
    <div className={`${CARD} overflow-hidden w-full`}>
      <div className={CARD_HEADER}>
        <Sparkles className="w-[15px] h-[15px] text-primary shrink-0" />
        <span className={`${CARD_LABEL_M} lg:hidden`}>Rezumatul săptămânii</span>
        <span className={`${CARD_LABEL} hidden lg:block`}>Rezumatul săptămânii</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-[13px] leading-relaxed text-foreground">
          {textContent}
        </p>
      </div>
    </div>
  );
};

export default WeeklySummaryCard;
