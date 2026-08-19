import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { TYPE_LABELS, TYPE_COLORS } from "./leadConstants";
import { cn } from "@/lib/utils";

export type LeadType = "GENERAL" | "STOCK" | "ORDER" | "BUYBACK" | "FINANCING";

interface LeadInteresSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: LeadType;
  onSelectType: (type: LeadType) => void;
}

const ALL_TYPES: LeadType[] = [
  "GENERAL",
  "STOCK",
  "ORDER",
  "BUYBACK",
  "FINANCING",
];

export function LeadInteresSheet({
  isOpen,
  onClose,
  currentType,
  onSelectType,
}: LeadInteresSheetProps) {
  const handleSelect = (type: LeadType) => {
    onSelectType(type);
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
            Tip interes
          </SheetTitle>
          <SheetDescription className="text-[13px] text-muted-foreground text-left">
            Selectează tipul de cerere pentru acest lead
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
            Categorii interes
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {ALL_TYPES.map((typeKey) => {
              const isSelected = currentType === typeKey;

              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => handleSelect(typeKey)}
                  className={cn(
                    "w-full min-h-[48px] px-3.5 flex items-center justify-between gap-2.5 text-[13px] text-left select-none transition-colors hover:bg-muted/50 cursor-pointer",
                    isSelected && "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <span
                      className={cn(
                        "font-medium truncate",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {TYPE_LABELS[typeKey] || typeKey}
                    </span>
                  </div>

                  <Badge
                    className={cn(
                      "px-2.5 py-0.5 text-[11px] font-semibold border-none shrink-0",
                      TYPE_COLORS[typeKey] || "bg-muted text-foreground"
                    )}
                  >
                    {TYPE_LABELS[typeKey] || typeKey}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
