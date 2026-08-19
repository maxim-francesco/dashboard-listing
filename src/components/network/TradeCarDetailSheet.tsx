import { Car, Phone } from "lucide-react";
import { TradeListing, NegotiationSummary } from "@/services/api";
import { formatEur } from "@/lib/format";
import { FUEL_TYPE_LABELS, GEARBOX_LABELS, FuelType, GearboxType } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface TradeCarDetailSheetProps {
  listing: TradeListing | null;
  segment: "browse" | "mine";
  negotiations?: NegotiationSummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMakeOffer: (listing: TradeListing) => void;
  onOpenNegotiation: (negotiationId: string) => void;
  onEdit: (listing: TradeListing) => void;
  onRequestRetrage: (listing: TradeListing) => void;
  onReExpose: (listingId: string) => void;
}

function getDetailImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/c_fill,w_800,h_600,q_auto,f_auto/");
  }
  return url;
}

export default function TradeCarDetailSheet({
  listing,
  segment,
  negotiations,
  open,
  onOpenChange,
  onMakeOffer,
  onOpenNegotiation,
  onEdit,
  onRequestRetrage,
  onReExpose,
}: TradeCarDetailSheetProps) {
  if (!listing) return null;

  const displayPrice =
    listing.b2bPrice !== null && listing.b2bPrice !== undefined
      ? listing.b2bPrice
      : listing.car.price;

  const isB2bDiscount =
    listing.b2bPrice !== null &&
    listing.b2bPrice !== undefined &&
    listing.car.price !== null &&
    listing.car.price !== undefined &&
    listing.b2bPrice < listing.car.price;

  const detailImgUrl = getDetailImageUrl(listing.car.image);

  // Build localized specs: only present fields joined with " · "
  const specsParts: string[] = [];

  if (listing.car.year !== null && listing.car.year !== undefined) {
    specsParts.push(String(listing.car.year));
  }

  if (listing.car.fuelType) {
    const localizedFuel =
      FUEL_TYPE_LABELS[listing.car.fuelType as FuelType] || listing.car.fuelType;
    specsParts.push(localizedFuel);
  }

  if (listing.car.mileage !== null && listing.car.mileage !== undefined) {
    specsParts.push(`${listing.car.mileage.toLocaleString("ro-RO")} km`);
  }

  if (listing.car.gearbox) {
    const localizedGearbox =
      GEARBOX_LABELS[listing.car.gearbox as GearboxType] || listing.car.gearbox;
    specsParts.push(localizedGearbox);
  }

  const specsLine = specsParts.join(" · ");

  // Negotiation resolution
  const myNegs = negotiations || [];
  const buyerNeg = myNegs.find((n) => n.role === "BUYER");
  const activeMineNeg = myNegs.find((n) => n.awaitingMyResponse) || myNegs[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-border text-foreground rounded-t-2xl px-4 py-5 max-h-[85vh] overflow-y-auto space-y-4"
      >
        {/* 1. Header */}
        <SheetHeader className="text-left pb-2 border-b border-border">
          <SheetTitle className="text-[17px] font-medium text-foreground pr-8 break-words leading-snug">
            {listing.car.title.trim()}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-muted-foreground">
            {listing.owner?.name || "Dealer"}
            {listing.owner?.city ? ` · ${listing.owner.city}` : ""}
          </SheetDescription>
        </SheetHeader>

        {/* 2. Large Image (master ceiling 800x600) */}
        <div className="w-full h-48 sm:h-56 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
          {detailImgUrl ? (
            <img
              src={detailImgUrl}
              alt={listing.car.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Car className="w-12 h-12 text-muted-foreground" />
          )}
        </div>

        {/* 3. Price Block */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[19px] font-semibold text-foreground tabular-nums">
            {formatEur(displayPrice ?? 0)}
          </span>
          {isB2bDiscount && listing.car.price !== null && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] text-muted-foreground line-through tabular-nums">
                {formatEur(listing.car.price)}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                preț public
              </span>
            </div>
          )}
        </div>

        {/* 4. Specs Line */}
        {specsLine.length > 0 && (
          <div className="text-[13px] text-muted-foreground tabular-nums">
            {specsLine}
          </div>
        )}

        {/* 5. Accepts Trade Line */}
        {listing.acceptsTrade && (
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary border border-primary/20 text-[12px] font-medium rounded-md px-2.5 py-1 inline-block">
              Acceptă schimb
            </span>
          </div>
        )}

        {/* 6. Action Block (switched on segment) */}
        <div className="pt-2 flex flex-col gap-2">
          {segment === "browse" && (
            <>
              {buyerNeg ? (
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenNegotiation(buyerNeg.id);
                  }}
                  className="w-full min-h-[48px] bg-primary text-primary-foreground font-semibold text-[15px]"
                >
                  Vezi oferta
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onMakeOffer(listing);
                  }}
                  className="w-full min-h-[48px] bg-primary text-primary-foreground font-semibold text-[15px]"
                >
                  Fă ofertă
                </Button>
              )}

              {listing.owner?.contactPhone && (
                <a
                  href={`tel:${listing.owner.contactPhone}`}
                  className="w-full min-h-[44px] rounded-lg border border-border bg-card text-foreground flex items-center justify-center gap-2 font-medium text-[14px] hover:bg-muted transition-colors"
                >
                  <Phone className="w-4 h-4 text-success" />
                  <span>Sună {listing.owner.name}</span>
                </a>
              )}
            </>
          )}

          {segment === "mine" && (
            <>
              {/* Incoming offer callout */}
              {myNegs.length > 0 && activeMineNeg && (
                <>
                  {activeMineNeg.awaitingMyResponse ? (
                    <div className="border border-primary/30 bg-primary/8 rounded-lg p-3 text-[13px] text-foreground space-y-0.5">
                      <div className="font-semibold text-primary">
                        {activeMineNeg.counterparty?.name || "Dealer"} oferă{" "}
                        {formatEur(activeMineNeg.latestProposal?.offeredPrice ?? 0)}
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        Așteaptă răspunsul tău
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/40 rounded-lg text-[13px] text-muted-foreground">
                      Ai cerut {formatEur(activeMineNeg.latestProposal?.offeredPrice ?? 0)} ·{" "}
                      {activeMineNeg.counterparty?.name || "Dealer"}
                    </div>
                  )}
                </>
              )}

              {/* Action buttons */}
              {myNegs.length > 0 && activeMineNeg && (
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenNegotiation(activeMineNeg.id);
                  }}
                  className="w-full min-h-[44px] bg-primary text-primary-foreground font-semibold text-[15px]"
                >
                  Vezi oferta
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(listing);
                }}
                className="w-full min-h-[44px] bg-card border border-border text-foreground font-semibold text-[15px] hover:bg-muted"
              >
                Editează
              </Button>

              {listing.status === "ACTIVE" ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onRequestRetrage(listing);
                  }}
                  className="w-full min-h-[44px] text-destructive text-[14px] font-semibold hover:underline text-center flex items-center justify-center"
                >
                  Retrage din rețea
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onReExpose(listing.id);
                    onOpenChange(false);
                  }}
                  className="w-full min-h-[44px] text-muted-foreground hover:text-foreground text-[14px] font-semibold transition-colors text-center flex items-center justify-center"
                >
                  Expune din nou
                </button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
