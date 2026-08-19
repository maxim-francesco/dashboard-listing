import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Building2, MapPin, Phone, Mail, MessageSquare, Loader2 } from "lucide-react";

export interface DealerProfile {
  id: string;
  name: string;
  city?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

interface DealerDetailSheetProps {
  dealer: DealerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onMessage?: (dealerId: string) => void;
  isMessaging?: boolean;
  hideMessageAction?: boolean;
}

export default function DealerDetailSheet({
  dealer,
  isOpen,
  onClose,
  onMessage,
  isMessaging = false,
  hideMessageAction = false,
}: DealerDetailSheetProps) {
  if (!dealer) return null;

  const hasPhone = !!dealer.contactPhone;
  const hasEmail = !!dealer.contactEmail;
  const hasCity = !!dealer.city;
  const hasAnyContact = hasPhone || hasEmail || hasCity;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="bg-card border-border rounded-t-xl p-4 space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="pb-2 border-b border-border text-left">
          <SheetTitle className="text-[17px] font-semibold text-foreground truncate">
            {dealer.name}
          </SheetTitle>
          <SheetDescription className="text-[12px] text-muted-foreground truncate">
            {dealer.city || "Dealer partener în rețea"}
          </SheetDescription>
        </SheetHeader>

        {/* DETAILS BLOCK */}
        <div className="space-y-2.5 text-[13px] bg-background/50 p-3 rounded-xl border border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Companie</span>
            </div>
            <span className="font-medium text-foreground text-right truncate">
              {dealer.name}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Oraș</span>
            </div>
            <span className="text-foreground text-right truncate">
              {dealer.city || "Nespecificat"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <span>Telefon</span>
            </div>
            {hasPhone ? (
              <a
                href={`tel:${dealer.contactPhone}`}
                className="font-medium text-primary hover:underline text-right tabular-nums"
              >
                {dealer.contactPhone}
              </a>
            ) : (
              <span className="text-muted-foreground">Nespecificat</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0" />
              <span>Email</span>
            </div>
            {hasEmail ? (
              <a
                href={`mailto:${dealer.contactEmail}`}
                className="font-medium text-primary hover:underline text-right truncate max-w-[200px]"
              >
                {dealer.contactEmail}
              </a>
            ) : (
              <span className="text-muted-foreground">Nespecificat</span>
            )}
          </div>
        </div>

        {/* EMPTY PROFILE NOTICE (when no phone/email is public) */}
        {!hasPhone && !hasEmail && (
          <p className="text-[12px] text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/40 text-center">
            {hideMessageAction
              ? "Dealerul nu a specificat date directe de contact. Comunicați prin mesageria rețelei."
              : "Dealerul nu a specificat date directe de contact. Folosiți mesageria internă."}
          </p>
        )}

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {hasPhone && (
            <a
              href={`tel:${dealer.contactPhone}`}
              className="flex-1 min-h-[44px] h-11 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-medium text-[14px] flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>Sună</span>
            </a>
          )}
          {!hideMessageAction && onMessage && (
            <button
              type="button"
              onClick={() => onMessage(dealer.id)}
              disabled={isMessaging}
              className="flex-1 min-h-[44px] h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[14px] flex items-center justify-center gap-2 transition-colors"
            >
              {isMessaging ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>Scrie mesaj</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
