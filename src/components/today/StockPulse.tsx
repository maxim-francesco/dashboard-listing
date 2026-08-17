import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

interface StockCounts {
  available: number;
  reserved: number;
  incoming: number;
  sold: number;
  soldThisMonth: number;
}

export default function StockPulse() {
  const navigate = useNavigate();

  const { data: stockCounts, isLoading: isCountsLoading } = useQuery<StockCounts>({
    queryKey: ["stock-counts"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stock-counts");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (isCountsLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex-1 flex flex-col items-center space-y-2">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex-1 flex flex-col items-center space-y-2">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex-1 flex flex-col items-center space-y-2">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    );
  }

  const counts = stockCounts || { available: 0, reserved: 0, incoming: 0, sold: 0, soldThisMonth: 0 };

  const availableCount = counts.available;
  const reservedCount = counts.reserved;
  const incomingCount = counts.incoming;
  const soldThisMonth = counts.soldThisMonth;

  let salesText = "";
  if (soldThisMonth === 0) {
    salesText = "Nicio vânzare luna aceasta";
  } else if (soldThisMonth === 1) {
    salesText = "O vânzare luna aceasta";
  } else {
    salesText = `${soldThisMonth} vânzări luna aceasta`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mt-1 mb-2.5 px-0.5">
        <span className="text-[17px] font-semibold text-foreground">Stocul tău</span>
        <button
          onClick={() => navigate("/listings")}
          className="text-[13px] text-primary hover:text-primary-hover font-medium cursor-pointer"
        >
          Vezi mașinile
        </button>
      </div>
      
      <div className="bg-card border border-border rounded-xl p-3.5 flex items-center">
        <div className="flex-1 text-center">
          <span className={`text-[22px] font-medium leading-none block ${availableCount === 0 ? "text-muted-foreground" : "text-foreground"}`}>
            {availableCount}
          </span>
          <span className="text-xs text-muted-foreground mt-1 block">în stoc</span>
        </div>
        <div className="w-px h-[34px] bg-border shrink-0" />
        <div className="flex-1 text-center">
          <span className={`text-[22px] font-medium leading-none block ${reservedCount === 0 ? "text-muted-foreground" : "text-foreground"}`}>
            {reservedCount}
          </span>
          <span className="text-xs text-muted-foreground mt-1 block">rezervate</span>
        </div>
        <div className="w-px h-[34px] bg-border shrink-0" />
        <div className="flex-1 text-center">
          <span className={`text-[22px] font-medium leading-none block ${incomingCount === 0 ? "text-muted-foreground" : "text-foreground"}`}>
            {incomingCount}
          </span>
          <span className="text-xs text-muted-foreground mt-1 block">sosesc</span>
        </div>
      </div>

      <div className="text-[13px] text-muted-foreground mt-2 px-0.5">
        {salesText}
      </div>
    </div>
  );
}
