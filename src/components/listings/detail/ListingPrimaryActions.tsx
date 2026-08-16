import { useNavigate } from "react-router-dom";
import { FileText, Calendar, Check, RotateCw } from "lucide-react";

interface ListingPrimaryActionsProps {
  status: string;
  onOpenOfferModal: () => void;
  onOpenReserveModal: () => void;
  onOpenSoldModal: () => void;
  onReactivate: () => void;
}

export default function ListingPrimaryActions({
  status,
  onOpenOfferModal,
  onOpenReserveModal,
  onOpenSoldModal,
  onReactivate,
}: ListingPrimaryActionsProps) {
  const navigate = useNavigate();

  if (status === "AVAILABLE" || status === "INCOMING") {
    return (
      <div className="flex gap-2 w-full select-none">
        <button
          onClick={onOpenOfferModal}
          className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-medium min-h-[52px]"
        >
          <FileText className="w-5 h-5 shrink-0" />
          <span>Ofertă</span>
        </button>
        <button
          onClick={onOpenReserveModal}
          className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border text-foreground text-xs font-medium min-h-[52px]"
        >
          <Calendar className="w-5 h-5 shrink-0" />
          <span>Rezervă</span>
        </button>
        <button
          onClick={onOpenSoldModal}
          className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border text-foreground text-xs font-medium min-h-[52px]"
        >
          <Check className="w-5 h-5 shrink-0" />
          <span>Vândut</span>
        </button>
      </div>
    );
  }

  if (status === "RESERVED") {
    return (
      <div className="flex gap-2 w-full select-none">
        <button
          onClick={onOpenOfferModal}
          className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-medium min-h-[52px]"
        >
          <FileText className="w-5 h-5 shrink-0" />
          <span>Ofertă</span>
        </button>
        <button
          onClick={onOpenSoldModal}
          className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border text-foreground text-xs font-medium min-h-[52px]"
        >
          <Check className="w-5 h-5 shrink-0" />
          <span>Vândut</span>
        </button>
      </div>
    );
  }

  if (status === "SOLD") {
    return (
      <div className="flex gap-2 w-full select-none">
        <button
          onClick={() => navigate("/contracts")}
          className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border text-foreground text-xs font-medium min-h-[52px]"
        >
          <FileText className="w-5 h-5 shrink-0" />
          <span>Vezi contractul</span>
        </button>
        <button
          onClick={onReactivate}
          className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border text-foreground text-xs font-medium min-h-[52px]"
        >
          <RotateCw className="w-5 h-5 shrink-0" />
          <span>Reactivează</span>
        </button>
      </div>
    );
  }

  return null;
}
