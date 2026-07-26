import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { differenceInDays } from "date-fns";
import { Car } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  createdAt: string;
  status: string;
  images?: { url: string }[];
}

interface StockCounts {
  available: number;
  reserved: number;
  incoming: number;
  sold: number;
  soldThisMonth: number;
}

export default function StockPulse() {
  const navigate = useNavigate();

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["listingsForDashboard"],
    queryFn: async () => {
      const response = await api.get("/listings");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const { data: stockCounts, isLoading: isCountsLoading } = useQuery<StockCounts>({
    queryKey: ["stock-counts"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stock-counts");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading || isCountsLoading) {
    return (
      <div className="space-y-4">
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
        <div className="pt-2">
          <Skeleton className="h-4 w-32 mb-2" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const items = listings || [];
  const counts = stockCounts || { available: 0, reserved: 0, incoming: 0, sold: 0, soldThisMonth: 0 };

  const availableCount = counts.available;
  const reservedCount = counts.reserved;
  const incomingCount = counts.incoming;
  const soldThisMonth = counts.soldThisMonth;

  const now = new Date();
  const slowListings = items
    .filter((l) => l.status === "AVAILABLE" && differenceInDays(now, new Date(l.createdAt)) > 45)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 3);

  let salesText = "";
  if (soldThisMonth === 0) {
    salesText = "Nicio vânzare luna aceasta";
  } else if (soldThisMonth === 1) {
    salesText = "O vânzare luna aceasta";
  } else {
    salesText = `${soldThisMonth} vânzări luna aceasta`;
  }

  return (
    <div className="space-y-4">
      {/* SECTION A: Stock Metrics */}
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

      {/* SECTION B: Slow-moving stock */}
      {items.length > 0 && (
        <div className="pt-2">
          <h3 className="text-[17px] font-semibold text-foreground mt-1 mb-2.5 px-0.5">Stau de mult în stoc</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {slowListings.length === 0 ? (
              <p className="text-[13px] text-muted-foreground italic px-3.5 py-3">
                Nicio mașină nu stă de peste 45 de zile.
              </p>
            ) : (
              <div className="divide-y-0">
                {slowListings.map((listing, idx) => {
                  const days = differenceInDays(now, new Date(listing.createdAt));
                  return (
                    <div
                      key={listing.id}
                      onClick={() => navigate(`/listings/${listing.id}/edit`)}
                      className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors hover:text-primary ${
                        idx > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0].url}
                          alt={listing.title}
                          className="w-[44px] h-[34px] rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-[44px] h-[34px] rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Car className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="flex-1 min-w-0 truncate text-[15px] font-medium text-foreground">
                        {listing.title}
                      </span>
                      <span className={`text-[13px] shrink-0 ${days >= 90 ? "text-destructive" : "text-warning"}`}>
                        {days} zile
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
