import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { differenceInDays } from "date-fns";
import { Car } from "lucide-react";
import { CARD, CARD_HEADER, CARD_LABEL, CARD_LABEL_M, CARD_COUNT } from "./cardRecipe";

export const SLOW_LISTING_COLS = {
  thumbnail: "w-16 shrink-0",
  title: "flex-1 min-w-0 truncate",
  price: "w-32 shrink-0 text-right tabular-nums",
  age: "w-24 shrink-0 text-right tabular-nums",
  viewsPerMonth: "w-24 shrink-0 text-right tabular-nums",
};

interface Listing {
  id: string;
  title: string;
  price: number | null;
  createdAt: string;
  status: string;
  images?: { url: string }[];
  _count?: {
    views?: number;
    messages?: number;
  };
}

export default function SlowListingsTable() {
  const navigate = useNavigate();

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["listingsForDashboard"],
    queryFn: async () => {
      const response = await api.get("/listings");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) return null;

  const now = new Date();
  const allSlowListings = (listings || [])
    .filter((l) => l.status === "AVAILABLE" && differenceInDays(now, new Date(l.createdAt)) > 45)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (allSlowListings.length === 0) {
    return null;
  }

  const slowListings = allSlowListings.slice(0, 5);
  const shownCount = slowListings.length;
  const totalCount = allSlowListings.length;

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "—";
    return `${price.toLocaleString("ro-RO")} €`;
  };

  return (
    <div className={`${CARD} overflow-hidden w-full`}>
      {/* Header inside card using cardRecipe */}
      <div className={CARD_HEADER}>
        <span className={`${CARD_LABEL_M} lg:hidden`}>Stau de mult în stoc</span>
        <span className={`${CARD_LABEL} hidden lg:block`}>Stau de mult în stoc</span>
        <span className={CARD_COUNT}>
          {shownCount} din {totalCount}
        </span>
      </div>

      {/* Desktop Table Header */}
      <div
        data-row="header"
        className="hidden lg:flex px-3 py-2 items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground border-b border-border border-transparent select-none"
      >
        <div data-col="thumbnail" className={SLOW_LISTING_COLS.thumbnail} />
        <div data-col="title" className={SLOW_LISTING_COLS.title}>
          Mașină
        </div>
        <div data-col="price" className={SLOW_LISTING_COLS.price}>
          Preț
        </div>
        <div data-col="age" className={SLOW_LISTING_COLS.age}>
          Vechime
        </div>
        <div data-col="viewsPerMonth" className={SLOW_LISTING_COLS.viewsPerMonth}>
          Viz./lună
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y-0">
        {slowListings.map((listing) => {
          const days = differenceInDays(now, new Date(listing.createdAt));
          const hasCount = listing._count && typeof listing._count.views === "number";
          const views = hasCount ? listing._count!.views! : null;

          let viewsPerMonthStr = "—";
          if (views !== null && days > 0) {
            const months = days / 30;
            const vpm = Math.round(views / months);
            viewsPerMonthStr = `${vpm}`;
          }

          const priceStr = formatPrice(listing.price);
          const ageColorClass = days >= 90 ? "text-destructive" : "text-warning";

          return (
            <div key={listing.id} onClick={() => navigate(`/listings/${listing.id}/edit`)}>
              {/* Mobile Row */}
              <div
                data-row="listing-mobile"
                className="lg:hidden min-h-[48px] px-3.5 py-2.5 border-b border-border last:border-b-0 cursor-pointer hover:bg-accent/5 transition-colors flex flex-col justify-center"
              >
                {/* Line 1: Thumbnail + Title + Price */}
                <div className="flex items-center gap-3">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-[42px] h-[30px] rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-[42px] h-[30px] rounded bg-muted flex items-center justify-center shrink-0">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="flex-1 min-w-0 truncate text-[14px] font-medium text-foreground">
                    {listing.title}
                  </span>
                  <span className="text-[14px] font-medium tabular-nums text-foreground shrink-0">
                    {priceStr}
                  </span>
                </div>
                {/* Line 2: Age + Views */}
                <div className="text-[12px] text-muted-foreground tabular-nums mt-0.5 pl-[54px]">
                  <span className={ageColorClass}>{days} zile</span>
                  <span className="mx-1.5">·</span>
                  <span>{viewsPerMonthStr !== "—" ? `${viewsPerMonthStr} vizite/lună` : "—"}</span>
                </div>
              </div>

              {/* Desktop Row */}
              <div
                data-row="listing"
                className="hidden lg:flex px-3 py-1.5 h-[54px] items-center gap-3 border-b border-border last:border-b-0 hover:bg-accent/5 transition-colors cursor-pointer select-none w-full"
              >
                <div data-col="thumbnail" className={SLOW_LISTING_COLS.thumbnail}>
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-16 h-10 rounded-md object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div data-col="title" className={SLOW_LISTING_COLS.title}>
                  <span className="text-[15px] font-medium text-foreground truncate block">
                    {listing.title}
                  </span>
                </div>
                <div data-col="price" className={SLOW_LISTING_COLS.price}>
                  <span className="text-[15px] font-semibold text-foreground">
                    {priceStr}
                  </span>
                </div>
                <div data-col="age" className={SLOW_LISTING_COLS.age}>
                  <span className={`text-[13px] font-medium ${ageColorClass}`}>
                    {days} zile
                  </span>
                </div>
                <div data-col="viewsPerMonth" className={SLOW_LISTING_COLS.viewsPerMonth}>
                  <span className="text-[13px] text-muted-foreground">
                    {viewsPerMonthStr}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
