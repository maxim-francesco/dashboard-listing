import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { differenceInDays } from "date-fns";
import { Car } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  createdAt: string;
  status: string;
  images?: { url: string }[];
}

export default function StaleStock() {
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

  const slowListings = allSlowListings.slice(0, 3);
  const totalCount = allSlowListings.length;

  return (
    <div className="pt-2">
      <h3 className="text-[17px] font-semibold text-foreground mt-1 mb-2.5 px-0.5">Stau de mult în stoc</h3>
      <p className="hidden lg:block text-[13px] text-muted-foreground mt-0.5">
        {totalCount === 1 ? "1 mașină stă de peste 45 de zile" : `${totalCount} mașini stau de peste 45 de zile`}
      </p>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
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
      </div>
    </div>
  );
}
