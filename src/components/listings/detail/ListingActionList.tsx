import { Link } from "react-router-dom";
import {
  Edit,
  Globe,
  Sparkles,
  Megaphone,
  Share2,
  MoreHorizontal,
  ChevronRight,
  XCircle,
} from "lucide-react";

interface ListingActionListProps {
  listingId: string;
  autovitStatus?: string | null;
  isReserved: boolean;
  hasActiveReservation: boolean;
  onOpenPublishSheet: () => void;
  onOpenDiagnoseModal: () => void;
  onOpenMarketingModal: () => void;
  onOpenExposeModal: () => void;
  onOpenMoreActionsSheet: () => void;
  onCancelReservation: () => void;
}

export default function ListingActionList({
  listingId,
  autovitStatus,
  isReserved,
  hasActiveReservation,
  onOpenPublishSheet,
  onOpenDiagnoseModal,
  onOpenMarketingModal,
  onOpenExposeModal,
  onOpenMoreActionsSheet,
  onCancelReservation,
}: ListingActionListProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden select-none">
      {/* Edit */}
      <Link
        to={`/listings/${listingId}/edit`}
        className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 transition-colors w-full cursor-pointer min-h-[44px]"
      >
        <Edit className="w-5 h-5 text-muted-foreground shrink-0" />
        <span className="flex-1 text-[15px] font-medium text-foreground text-left">Editează anunțul</span>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </Link>

      {/* Publicare */}
      <button
        onClick={onOpenPublishSheet}
        className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
      >
        <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
        <span className="flex-1 text-[15px] font-medium text-foreground">Publicare</span>
        <div className="flex items-center gap-2">
          {autovitStatus === "active" ? (
            <span className="bg-success-light text-success font-medium text-xs rounded-full px-2.5 py-0.5">
              Pe Autovit
            </span>
          ) : (
            <span className="bg-muted text-muted-foreground font-medium text-xs rounded-full px-2.5 py-0.5">
              Nepublicată
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </button>

      {/* AI Diagnose */}
      <button
        onClick={onOpenDiagnoseModal}
        className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
      >
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <span className="flex-1 text-[15px] font-medium text-foreground">De ce nu se vinde?</span>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </button>

      {/* Marketing Texts */}
      <button
        onClick={onOpenMarketingModal}
        className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
      >
        <Megaphone className="w-5 h-5 text-primary shrink-0" />
        <span className="flex-1 text-[15px] font-medium text-foreground">Texte de promovare</span>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </button>

      {/* B2B Expose Trade */}
      <button
        onClick={onOpenExposeModal}
        className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
      >
        <Share2 className="w-5 h-5 text-primary shrink-0" />
        <span className="flex-1 text-[15px] font-medium text-foreground">Expune la schimb în rețea</span>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </button>

      {/* More Actions */}
      <button
        onClick={onOpenMoreActionsSheet}
        className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
      >
        <MoreHorizontal className="w-5 h-5 text-muted-foreground shrink-0" />
        <span className="flex-1 text-[15px] font-medium text-foreground">Altele</span>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </button>

      {/* Cancel Reservation */}
      {isReserved && hasActiveReservation && (
        <button
          onClick={onCancelReservation}
          className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-destructive/5 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
        >
          <XCircle className="w-5 h-5 text-destructive shrink-0" />
          <span className="flex-1 text-[15px] font-medium text-destructive">Anulează rezervarea</span>
          <ChevronRight className="w-5 h-5 text-destructive shrink-0" />
        </button>
      )}
    </div>
  );
}
