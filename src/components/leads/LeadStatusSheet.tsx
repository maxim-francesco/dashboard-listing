import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  LOST_REASON_LABELS,
} from "./leadConstants";
import { cn } from "@/lib/utils";

export type LeadStatus = "NEW" | "CONTACTED" | "VIEWING" | "OFFER" | "WON" | "LOST";

interface LeadStatusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: LeadStatus;
  currentLostReason?: string | null;
  onSelectStatus: (status: LeadStatus, lostReason?: string) => void;
}

const ALL_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "VIEWING",
  "OFFER",
  "WON",
  "LOST",
];

const LOST_REASONS = Object.keys(LOST_REASON_LABELS);

export function LeadStatusSheet({
  isOpen,
  onClose,
  currentStatus,
  currentLostReason,
  onSelectStatus,
}: LeadStatusSheetProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(currentStatus);
  const [selectedReason, setSelectedReason] = useState<string>(currentLostReason || "PRICE");

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
      setSelectedReason(currentLostReason || "PRICE");
    }
  }, [isOpen, currentStatus, currentLostReason]);

  const handleStatusClick = (status: LeadStatus) => {
    if (status === "LOST") {
      setSelectedStatus("LOST");
      return;
    }
    onSelectStatus(status);
    onClose();
  };

  const handleConfirmLost = () => {
    onSelectStatus("LOST", selectedReason);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="bg-card border-border rounded-t-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto [&>button.absolute]:hidden"
      >
        <SheetHeader>
          <SheetTitle className="text-[17px] font-semibold text-foreground text-left">
            Schimbă statusul
          </SheetTitle>
          <SheetDescription className="text-[13px] text-muted-foreground text-left">
            Selectează stadiul curent al lead-ului
          </SheetDescription>
        </SheetHeader>

        {/* 6 statuses list */}
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
            Status pipeline
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {ALL_STATUSES.map((status) => {
              const isCurrent = currentStatus === status;
              const isSelected = selectedStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusClick(status)}
                  className={cn(
                    "w-full min-h-[48px] px-3.5 flex items-center justify-between gap-2.5 text-[13px] text-left select-none transition-colors hover:bg-muted/50 cursor-pointer",
                    isSelected && "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                      {(isCurrent || isSelected) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "font-medium truncate",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                  </div>

                  <Badge
                    className={cn(
                      "px-2.5 py-0.5 text-[11px] font-semibold border-none shrink-0",
                      STATUS_COLORS[status] || "bg-muted text-foreground"
                    )}
                  >
                    {STATUS_LABELS[status]}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lost reason choice inside the same sheet */}
        {selectedStatus === "LOST" && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
              Motivul pierderii
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
              {LOST_REASONS.map((reasonKey) => {
                const isReasonSelected = selectedReason === reasonKey;
                return (
                  <button
                    key={reasonKey}
                    type="button"
                    onClick={() => setSelectedReason(reasonKey)}
                    className="w-full min-h-[48px] px-3.5 flex items-center gap-2.5 text-[13px] text-left select-none transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                      {isReasonSelected && (
                        <Check className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "flex-1 min-w-0 truncate",
                        isReasonSelected
                          ? "text-destructive font-medium"
                          : "text-foreground"
                      )}
                    >
                      {LOST_REASON_LABELS[reasonKey] || reasonKey}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={handleConfirmLost}
              className="w-full min-h-[44px] bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium text-[13px] rounded-lg mt-2"
            >
              Confirmă status Pierdut
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
