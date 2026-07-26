import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Phone, Car } from "lucide-react";
import { isToday, isTomorrow, isYesterday, differenceInCalendarDays } from "date-fns";

interface Offer {
  id: string;
  clientName: string;
  clientPhone: string | null;
  listingTitleSnapshot: string;
  listingImageSnapshot: string | null;
  offerPrice: number;
  viewedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  listingId: string | null;
}

function getRelativeViewedTime(viewedAtStr: string): string {
  const date = new Date(viewedAtStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 60) {
    return "acum câteva minute";
  }
  if (diffHours < 24 && !isYesterday(date)) {
    return `acum ${diffHours} ${diffHours === 1 ? "oră" : "ore"}`;
  }
  if (isYesterday(date)) {
    return "ieri";
  }
  const diffDays = differenceInCalendarDays(now, date);
  return `acum ${diffDays} ${diffDays === 1 ? "zi" : "zile"}`;
}

export default function ViewedOffers() {
  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ["offers"],
    queryFn: async () => {
      const response = await api.get("/offers");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading || !offers) {
    return null;
  }

  const now = new Date();
  const limitDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const dedupedMap = new Map<string, Offer>();
  for (const offer of offers) {
    const key = offer.listingId
      ? `${offer.clientPhone ?? ""}_${offer.listingId}`
      : `${offer.clientPhone ?? ""}_${offer.listingTitleSnapshot}`;
    const existing = dedupedMap.get(key);
    if (!existing || new Date(offer.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      dedupedMap.set(key, offer);
    }
  }
  const dedupedOffers = Array.from(dedupedMap.values());

  const filtered = dedupedOffers
    .filter((offer) => {
      if (!offer.viewedAt) return false;
      if (offer.expiresAt) {
        const expiresDate = new Date(offer.expiresAt);
        if (expiresDate < limitDate) return false;
      }
      return true;
    })
    .sort((a, b) => {
      return new Date(b.viewedAt!).getTime() - new Date(a.viewedAt!).getTime();
    })
    .slice(0, 3);

  if (filtered.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(price) + ' €';
  };

  return (
    <div>
      <div className="text-[17px] font-semibold text-foreground mt-1 mb-2.5 px-0.5">
        Oferte văzute de clienți
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.map((offer, idx) => {
          const viewedTimeStr = getRelativeViewedTime(offer.viewedAt!);
          let signalText = "";
          let signalClass = "";

          if (offer.expiresAt) {
            const expiresDate = new Date(offer.expiresAt);
            if (expiresDate > now) {
              if (isToday(expiresDate)) {
                signalText = `expiră azi · a deschis oferta ${viewedTimeStr}`;
                signalClass = "text-warning";
              } else if (isTomorrow(expiresDate)) {
                signalText = `expiră mâine · a deschis oferta ${viewedTimeStr}`;
                signalClass = "text-warning";
              } else {
                signalText = `a deschis oferta ${viewedTimeStr}`;
                signalClass = "text-success";
              }
            } else {
              signalText = "ofertă expirată";
              signalClass = "text-muted-foreground";
            }
          } else {
            signalText = `a deschis oferta ${viewedTimeStr}`;
            signalClass = "text-success";
          }

          return (
            <div
              key={offer.id}
              className={`flex items-center gap-3 px-3.5 py-3 ${
                idx > 0 ? "border-t border-border" : ""
              }`}
            >
              {offer.listingImageSnapshot ? (
                <img
                  src={offer.listingImageSnapshot}
                  alt={offer.listingTitleSnapshot}
                  className="w-[56px] h-[42px] rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-[56px] h-[42px] rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium truncate text-foreground">
                  {offer.clientName}
                </div>
                <div className="text-[13px] text-muted-foreground truncate flex items-center min-w-0">
                  <span className="shrink-0 font-medium text-foreground">
                    {formatPrice(offer.offerPrice)}
                  </span>
                  <span className="mx-1 shrink-0">·</span>
                  <span className="truncate">
                    {offer.listingTitleSnapshot}
                  </span>
                </div>
                <div className={`text-xs mt-0.5 ${signalClass}`}>
                  {signalText}
                </div>
              </div>

              {offer.clientPhone && (
                <a
                  href={`tel:${offer.clientPhone}`}
                  className="w-11 h-11 rounded-full bg-success-light text-success flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
