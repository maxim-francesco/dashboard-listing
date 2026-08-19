import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Car, ExternalLink, Phone, User, Coins, Calendar } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import api, { ReservationItem } from "@/services/api";
import { formatEur } from "@/lib/format";
import { formatRoPhone, telLink, hasUsablePhone } from "@/utils/phone";
import { roCount } from "@/lib/plural";
import { daysLeft } from "@/lib/date";

function statusLabel(s: string) {
  if (s === "COMPLETED") return "Finalizată";
  if (s === "CANCELLED") return "Anulată";
  if (s === "EXPIRED") return "Expirată";
  return "Activă";
}

interface ReservationDetailSheetProps {
  row: ReservationItem | null;
  open: boolean;
  onClose: () => void;
  onExtend: (row: ReservationItem) => void;
  onCancel: (row: ReservationItem) => void;
  onSold: (row: ReservationItem) => void;
}

export default function ReservationDetailSheet({
  row,
  open,
  onClose,
  onExtend,
  onCancel,
  onSold,
}: ReservationDetailSheetProps) {
  const { data: listing, isLoading: isListingLoading } = useQuery<any>({
    queryKey: ["listing", row?.listingId],
    queryFn: async () => {
      const res = await api.get(`/listings/${row?.listingId}`);
      return res.data;
    },
    enabled: open && !!row?.listingId,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (!row) return null;

  const images = listing?.images
    ? [...listing.images].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    : [];
  const firstImage = images.length > 0 ? images[0].url : null;
  const dl = daysLeft(row.expiresAt);

  let expireColorClass = "text-muted-foreground";
  if (dl <= 0) {
    expireColorClass = "text-destructive font-medium";
  } else if (dl <= 2) {
    expireColorClass = "text-warning font-medium";
  }

  const expireText =
    dl <= 0 ? "Expiră azi" : "Expiră în " + roCount(dl, "zi", "zile");

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between pb-2 border-b border-border text-left">
          <SheetTitle className="text-[17px] font-semibold text-foreground">
            Detalii rezervare
          </SheetTitle>
          <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground shrink-0 mr-6">
            {statusLabel(row.status)}
          </span>
        </SheetHeader>

        {/* IMAGE SECTION */}
        <div className="relative w-full h-[160px] rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
          {isListingLoading ? (
            <div className="w-full h-full bg-muted animate-pulse" />
          ) : firstImage ? (
            <>
              <img
                src={firstImage}
                alt={row.listing?.title || "Vehicul"}
                className="w-full h-full object-cover"
              />
              {images.length > 0 && (
                <div className="absolute top-2 right-2 bg-black/60 text-foreground text-[11px] font-medium px-2 py-0.5 rounded backdrop-blur-xs">
                  1 / {images.length}
                </div>
              )}
            </>
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
              className="text-[15px] font-semibold text-foreground hover:underline inline-flex items-center gap-1.5 leading-snug"
            >
              <span>{row.listing?.title || "Mașină"}</span>
              <ExternalLink className="w-4 h-4 text-primary shrink-0" />
            </Link>
          ) : (
            <h3 className="text-[15px] font-semibold text-foreground">
              {row.listing?.title || "Mașină"}
            </h3>
          )}
        </div>

        {/* DETAIL ROWS */}
        <div className="space-y-2.5 text-[14px] bg-background/50 p-3 rounded-xl border border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4 shrink-0" />
              <span>Client</span>
            </div>
            <span className="font-medium text-foreground text-right truncate">
              {row.clientName}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <span>Telefon</span>
            </div>
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
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className="w-4 h-4 shrink-0" />
              <span>Avans</span>
            </div>
            <span className="font-medium text-foreground">
              {formatEur(row.depositAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Început</span>
            </div>
            <span className="text-foreground">
              {format(new Date(row.startDate), "dd MMM yyyy", { locale: ro })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Expiră</span>
            </div>
            <span className={expireColorClass}>
              {format(new Date(row.expiresAt), "dd MMM yyyy", { locale: ro })} · {expireText}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        {row.status === "ACTIVE" && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                onClose();
                onExtend(row);
              }}
              className="flex-1 h-11 min-h-[44px] rounded-xl border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50 transition-colors"
            >
              Prelungește
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onCancel(row);
              }}
              className="flex-1 h-11 min-h-[44px] rounded-xl border border-destructive/40 bg-card text-destructive text-[14px] font-medium hover:bg-destructive/10 transition-colors"
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSold(row);
              }}
              className="flex-1 h-11 min-h-[44px] rounded-xl border border-success/40 bg-success/10 text-success text-[14px] font-medium hover:bg-success/20 transition-colors"
            >
              Vândut
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
