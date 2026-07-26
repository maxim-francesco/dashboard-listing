import { Link } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { ro } from "date-fns/locale";
import { Car } from "lucide-react";
import { formatEur } from "@/lib/format";

interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: {
    name: string;
  };
  createdAt: string;
  status: string;
  images?: { url: string }[];
  attributeValues: any[];
  _count?: {
    views: number;
    messages?: number;
  };
  autovitId?: string | null;
  autovitStatus?: string | null;
  price?: number;
  sellingPrice?: number;
  soldAt?: string | null;
}

interface ListingCardProps {
  listing: Listing;
  segment: "instoc" | "vandute";
}

export default function ListingCard({
  listing,
  segment,
}: ListingCardProps) {
  const daysInStock = differenceInDays(new Date(), new Date(listing.createdAt));

  const getStatusPill = () => {
    if (segment === "vandute" || listing.status === "SOLD") {
      if (listing.sellingPrice && listing.sellingPrice > 0) {
        const formattedSale = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(listing.sellingPrice);
        return (
          <span className="px-2 py-0.5 rounded-[10px] bg-muted text-muted-foreground font-medium shrink-0">
            Vândută: {formattedSale} €
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 rounded-[10px] bg-muted text-muted-foreground font-medium shrink-0">
          Vândută
        </span>
      );
    }

    switch (listing.status) {
      case "RESERVED":
        return (
          <span className="px-2 py-0.5 rounded-[10px] bg-primary text-primary-foreground font-medium shrink-0">
            Rezervată
          </span>
        );
      case "INCOMING":
        return (
          <span className="px-2 py-0.5 rounded-[10px] bg-success-light text-success font-medium shrink-0">
            Sosește
          </span>
        );
      case "AVAILABLE":
      default:
        if (daysInStock >= 45) {
          return (
            <span className="px-2 py-0.5 rounded-[10px] bg-warning-light text-warning font-medium shrink-0">
              {daysInStock} zile
            </span>
          );
        }
        return (
          <span className="px-2 py-0.5 rounded-[10px] bg-muted text-muted-foreground font-medium shrink-0">
            {daysInStock} zile
          </span>
        );
    }
  };

  const viewCount = listing._count?.views ?? 0;
  const leadsCount = listing._count?.messages ?? 0;

  return (
    <Link 
      to={`/listings/${listing.id}`}
      className="bg-card border border-border rounded-xl p-2.5 flex gap-3 hover:bg-accent/5 transition-colors block w-full select-none"
    >
      {/* LEFT: Thumbnail */}
      {listing.images && listing.images.length > 0 ? (
        <img
          src={listing.images[0].url}
          alt={listing.title}
          className="w-24 h-18 rounded-lg object-cover shrink-0 bg-muted"
          style={{ width: "96px", height: "72px" }}
        />
      ) : (
        <div className="w-24 h-18 rounded-lg bg-muted flex items-center justify-center shrink-0" style={{ width: "96px", height: "72px" }}>
          <Car className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {/* RIGHT: Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-[15px] font-medium truncate text-foreground flex-1">
            {listing.title}
          </h3>
        </div>

        {/* Price */}
        {segment === "vandute" ? (
          listing.sellingPrice !== null && listing.sellingPrice !== undefined ? (
            <div className="text-[17px] font-semibold text-foreground leading-none">
              {formatEur(listing.sellingPrice)}
            </div>
          ) : (
            <div className="text-[17px] text-muted-foreground leading-none">
              preț nesalvat
            </div>
          )
        ) : (
          <div className="text-[17px] font-semibold text-foreground leading-none">
            {new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(listing.price || 0)} €
          </div>
        )}

        {/* Bottom Pill & Facts */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground mt-0.5">
          {segment === "vandute" ? (
            listing.sellingPrice !== null && listing.sellingPrice !== undefined ? (
              listing.soldAt ? (
                <span>{format(new Date(listing.soldAt), "dd MMM yyyy", { locale: ro })}</span>
              ) : null
            ) : (
              <span>cerut: {formatEur(listing.price || 0)}</span>
            )
          ) : (
            <>
              {getStatusPill()}
              <span>· {viewCount} {viewCount === 1 ? "vizualizare" : "vizualizări"}</span>
              {leadsCount > 0 && (
                <span>· {leadsCount === 1 ? "1 lead" : `${leadsCount} lead-uri`}</span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
