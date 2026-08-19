import { Car } from "lucide-react";
import { TradeListing, NegotiationSummary } from "@/services/api";
import { formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";

export const TRADE_CAR_ROW_COLS = {
  thumbnail: "w-16 h-10 shrink-0",
  title: "flex-1 min-w-0 truncate text-[15px] font-medium text-foreground",
  price: "text-[15px] font-semibold text-foreground tabular-nums text-right shrink-0",
  secondary: "text-[12px] text-muted-foreground truncate mt-0.5 tabular-nums",
};

export interface TradeCarRowProps {
  listing: TradeListing;
  segment: "browse" | "mine";
  negotiations?: NegotiationSummary[];
  onClick: () => void;
}

function getThumbnailUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/c_fill,w_128,h_80,q_auto,f_auto/");
  }
  return url;
}

export default function TradeCarRow({
  listing,
  segment,
  negotiations,
  onClick,
}: TradeCarRowProps) {
  const displayPrice =
    listing.b2bPrice !== null && listing.b2bPrice !== undefined
      ? listing.b2bPrice
      : listing.car.price;

  const isClosed = listing.status === "CLOSED";
  const thumbUrl = getThumbnailUrl(listing.car.image);

  let secondaryContent = null;

  if (segment === "browse") {
    const buyerNeg = negotiations?.find((n) => n.role === "BUYER");
    if (buyerNeg && buyerNeg.latestProposal) {
      secondaryContent = (
        <span>
          Ofertă în curs · {formatEur(buyerNeg.latestProposal.offeredPrice)}
        </span>
      );
    } else {
      secondaryContent = (
        <span>
          {listing.owner?.name || "Dealer"}
          {listing.owner?.city ? ` · ${listing.owner.city}` : ""}
        </span>
      );
    }
  } else {
    // segment === "mine"
    const myNegs = negotiations || [];
    const activeNeg = myNegs.find((n) => n.awaitingMyResponse) || myNegs[0];
    const statusLabel = isClosed ? "Retrasă" : "Expusă";

    let negSummary = "";
    if (myNegs.length > 0) {
      if (activeNeg?.awaitingMyResponse) {
        negSummary = " · ofertă nouă";
      } else {
        negSummary = myNegs.length === 1 ? " · o negociere" : ` · ${myNegs.length} negocieri`;
      }
    }

    secondaryContent = (
      <span>
        {statusLabel}
        {negSummary}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left select-none focus:outline-none",
        isClosed && "opacity-60"
      )}
    >
      {/* LEFT: Thumbnail 64x40 */}
      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt={listing.car.title}
          className="w-16 h-10 rounded object-cover shrink-0 bg-muted"
        />
      ) : (
        <div className="w-16 h-10 rounded bg-muted flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      {/* RIGHT: Content */}
      <div className="flex-1 min-w-0">
        {/* LINE 1 */}
        <div className="flex items-center justify-between gap-2">
          <span className={TRADE_CAR_ROW_COLS.title}>
            {listing.car.title.trim()}
          </span>
          <span className={TRADE_CAR_ROW_COLS.price}>
            {formatEur(displayPrice ?? 0)}
          </span>
        </div>

        {/* LINE 2 */}
        <div className={TRADE_CAR_ROW_COLS.secondary}>
          {secondaryContent}
        </div>
      </div>
    </button>
  );
}
