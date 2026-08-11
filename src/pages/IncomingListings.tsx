import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Truck } from "lucide-react";
import { getIncomingListings } from "@/services/api";
import ListingCard from "@/components/listings/ListingCard";
import { roCount } from "@/lib/plural";

export default function IncomingListings() {
  const { data: listings = [], isLoading } = useQuery<any[]>({
    queryKey: ["incomingListings"],
    queryFn: async () => {
      const data = await getIncomingListings();
      return data.map((l: any) => ({ ...l, status: l.status ?? "INCOMING" }));
    },
    refetchOnWindowFocus: false,
  });

  return (
    <div className="space-y-4 max-w-[390px] mx-auto md:max-w-full pb-24">
      <div className="px-1">
        <Link to="/listings" className="inline-flex items-center text-[13px] text-primary hover:underline mb-1">
          ← Toate categoriile
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Sosesc în curând</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">{roCount(listings.length, "mașină", "mașini")}</p>
      </div>

      <div className="px-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Truck className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-[15px] font-medium text-foreground">Nicio mașină care sosește.</h3>
            <p className="text-xs text-muted-foreground mt-1">Mașinile marcate „Sosește" apar aici.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {listings.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} segment="instoc" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
