import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
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
  const { data, isLoading } = useQuery({
    queryKey: ["weeklySummary"],
    queryFn: async () => {
      const response = await api.get("/dashboard/weekly-summary");
      return response.data as WeeklySummaryResponse;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // 1h
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setIsExpanded(false);
  }, [data?.text]);

  useEffect(() => {
    if (!isExpanded && textRef.current) {
      const checkOverflow = () => {
        if (textRef.current) {
          setIsOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight);
        }
      };
      // Short delay to ensure browser layout is updated
      const timer = setTimeout(checkOverflow, 50);
      window.addEventListener("resize", checkOverflow);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", checkOverflow);
      };
    }
  }, [data?.text, isExpanded]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-primary-light p-3.5 flex gap-2.5 items-start w-full">
        <Sparkles className="w-[18px] h-[18px] text-primary shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const textContent = data ? data.text : "Rezumatul nu este disponibil momentan.";

  return (
    <div className="rounded-xl bg-primary-light p-3.5 flex gap-2.5 items-start">
      <Sparkles className="w-[18px] h-[18px] text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p
          ref={textRef}
          className={`text-sm leading-relaxed text-foreground ${!isExpanded ? "line-clamp-2" : ""}`}
        >
          {textContent}
        </p>
        {data && isOverflowing && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[13px] text-primary mt-1 hover:text-primary-hover font-medium block cursor-pointer transition-colors"
          >
            {isExpanded ? "Mai puțin" : "Mai mult"}
          </button>
        )}
      </div>
    </div>
  );
};

export default WeeklySummaryCard;
