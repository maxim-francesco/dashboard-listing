import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Car, ExternalLink, Send, Eye } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OfferItem } from "@/services/api";
import { formatEur } from "@/lib/format";
import { formatRoPhone, telLink, hasUsablePhone } from "@/utils/phone";
import { roCount } from "@/lib/plural";
import { cn } from "@/lib/utils";
import { daysLeft } from "@/lib/date";

function getListPriceDisplay(offerPrice: number, listPrice: number | null | undefined): string {
  if (listPrice == null || listPrice === 0) {
    return "—";
  }
  if (offerPrice < listPrice) {
    const diff = listPrice - offerPrice;
    return `${formatEur(listPrice)} · −${formatEur(diff)}`;
  }
  if (offerPrice === listPrice) {
    return `${formatEur(listPrice)} · fără reducere`;
  }
  return formatEur(listPrice);
}

function formatViewedDelay(createdAt: string, viewedAt: string): string {
  const createdMs = new Date(createdAt).getTime();
  const viewedMs = new Date(viewedAt).getTime();
  const diffMs = Math.max(0, viewedMs - createdMs);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let delayText = "";
  if (diffMinutes < 60) {
    const mins = Math.max(1, diffMinutes);
    delayText = `${mins} min după trimitere`;
  } else if (diffHours < 24) {
    delayText = `${diffHours} ${roCount(diffHours, "oră", "ore")} după trimitere`;
  } else {
    delayText = `${diffDays} ${roCount(diffDays, "zi", "zile")} după trimitere`;
  }
  return `${format(new Date(viewedAt), "dd MMM", { locale: ro })}, la ${delayText}`;
}

interface OfferDetailSheetProps {
  row: OfferItem | null;
  open: boolean;
  onClose: () => void;
  onReshare: (row: OfferItem) => void;
}

export default function OfferDetailSheet({
  row,
  open,
  onClose,
  onReshare,
}: OfferDetailSheetProps) {
  if (!row) return null;

  const now = Date.now();
  const isExpired = new Date(row.expiresAt).getTime() <= now;
  const dl = daysLeft(row.expiresAt);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between pb-2 border-b border-border text-left">
          <SheetTitle className="text-[17px] font-medium text-foreground">
            Detalii ofertă
          </SheetTitle>
          {isExpired ? (
            <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground shrink-0 mr-6">
              Expirată
            </span>
          ) : row.viewedAt ? (
            <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-success/15 text-success inline-flex items-center gap-1 shrink-0 mr-6">
              <Eye className="w-3.5 h-3.5" /> Văzută
            </span>
          ) : (
            <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground shrink-0 mr-6">
              Nedeschisă
            </span>
          )}
        </SheetHeader>

        {/* IMAGE SECTION */}
        <div className="relative w-full h-[150px] rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
          {row.listingImageSnapshot ? (
            <img
              src={row.listingImageSnapshot}
              alt={row.listingTitleSnapshot}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Car className="w-8 h-8 opacity-50" />
              <span className="text-xs">Fără imagine</span>
            </div>
          )}
        </div>

        {/* TITLE / CAR LINK */}
        <div>
          {row.listingId ? (
            <Link
              to={`/listings/${row.listingId}`}
              className="text-[15px] font-medium text-foreground hover:underline inline-flex items-center gap-1.5 leading-snug"
            >
              <span>{row.listingTitleSnapshot}</span>
              <ExternalLink className="w-4 h-4 text-primary shrink-0" />
            </Link>
          ) : (
            <h3 className="text-[15px] font-medium text-foreground">
              {row.listingTitleSnapshot}
            </h3>
          )}
        </div>

        {/* DETAIL ROWS */}
        <div className="space-y-2.5 text-[14px] bg-background/50 p-3 rounded-xl border border-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Preț oferit</span>
            <span className="text-[15px] font-medium text-foreground">
              {formatEur(row.offerPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Preț listă</span>
            <span className="text-muted-foreground text-right">
              {getListPriceDisplay(row.offerPrice, row.listPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Client</span>
            <span className="font-medium text-foreground text-right truncate">
              {row.clientName}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Telefon</span>
            {hasUsablePhone(row.clientPhone) ? (
              <a
                href={telLink(row.clientPhone)}
                className="font-medium text-primary hover:underline text-right"
              >
                {formatRoPhone(row.clientPhone)}
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Trimisă</span>
            <span className="text-foreground">
              {format(new Date(row.createdAt), "dd MMM yyyy", { locale: ro })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Văzută</span>
            {row.viewedAt ? (
              <span className="text-foreground text-right">
                {formatViewedDelay(row.createdAt, row.viewedAt)}
              </span>
            ) : (
              <span className="text-muted-foreground">Nedeschisă încă</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Expiră</span>
            <span className={cn(
              isExpired
                ? "text-muted-foreground"
                : dl <= 2
                ? "text-warning font-medium"
                : "text-foreground"
            )}>
              {format(new Date(row.expiresAt), "dd MMM yyyy", { locale: ro })} · {
                isExpired ? "expirată" : (dl <= 0 ? "expiră azi" : "valabilă încă " + roCount(dl, "zi", "zile"))
              }
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {row.publicUrl ? (
            <a
              href={row.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 min-h-[44px] rounded-xl border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Vezi pagina</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 h-11 min-h-[44px] rounded-xl border border-border bg-card/50 text-muted-foreground text-[14px] font-medium opacity-50 cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <span>Vezi pagina</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
              onReshare(row);
            }}
            className="flex-1 h-11 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Trimite din nou</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
