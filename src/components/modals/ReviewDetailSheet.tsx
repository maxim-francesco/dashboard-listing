import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Star, Check, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Review } from "@/pages/AdminReviewsPage";

interface ReviewDetailSheetProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDelete: (review: Review) => void;
}

export default function ReviewDetailSheet({
  review,
  open,
  onClose,
  onApprove,
  onDelete,
}: ReviewDetailSheetProps) {
  if (!review) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: ro });
    } catch {
      return null;
    }
  };

  const formattedDate = formatDate(review.createdAt);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="bg-card border-border rounded-t-xl p-4 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* HEADER BLOCK */}
        <SheetHeader className="text-left space-y-0 pb-3 border-b border-border">
          {/* Line 1: Author Name */}
          <SheetTitle className="text-[17px] font-medium text-foreground pr-10 max-w-[280px] truncate">
            {review.name}
          </SheetTitle>

          {/* Line 2: Meta line (date · colored status text) */}
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mt-1">
            {formattedDate && <span>{formattedDate}</span>}
            {formattedDate && <span>·</span>}
            {review.isApproved ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                Aprobată
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-warning">
                <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                În așteptare
              </span>
            )}
          </div>

          {/* Line 3: Star Rating Row */}
          <div className="flex items-center gap-2 mt-2.5">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-5 h-5",
                    star <= review.rating
                      ? "fill-current text-warning"
                      : "text-muted-foreground/40"
                  )}
                />
              ))}
            </div>
            <span className="text-[14px] text-muted-foreground">
              {review.rating} din 5
            </span>
          </div>
        </SheetHeader>

        {/* FULL REVIEW TEXT */}
        <div className="py-1">
          <p className="text-[15px] text-foreground leading-relaxed break-words">
            {review.text}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="pt-2 border-t border-border">
          {!review.isApproved ? (
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(review);
                }}
                className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-destructive/40 bg-card text-destructive hover:bg-destructive/10 text-[14px] font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                Șterge
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(review.id);
                }}
                className="flex-[2] min-w-0 min-h-[44px] rounded-xl bg-success text-success-foreground hover:bg-success/90 text-[14px] font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4 shrink-0" />
                Aprobă
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(review);
              }}
              className="w-full min-h-[44px] rounded-xl border border-destructive/40 bg-card text-destructive hover:bg-destructive/10 text-[14px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              Șterge
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
