import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Copy, RotateCcw, Trash2 } from "lucide-react";

interface MoreActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloneListing: () => void;
  onResetViews: () => void;
  onDeleteListing: () => void;
}

export default function MoreActionsSheet({
  open,
  onOpenChange,
  onCloneListing,
  onResetViews,
  onDeleteListing,
}: MoreActionsSheetProps) {
  const handleAction = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-8 max-w-lg mx-auto bg-background text-foreground border-border">
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        <DrawerHeader className="text-left px-0 pb-4">
          <DrawerTitle className="text-xl font-bold">Altele</DrawerTitle>
        </DrawerHeader>
        <div className="grid gap-2.5">
          {/* Row 1: Clonează anunțul */}
          <button
            onClick={() => handleAction(onCloneListing)}
            className="flex items-center gap-4 p-4 min-h-[56px] rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
              <Copy className="w-5 h-5" />
            </div>
            <div className="font-semibold text-foreground text-[15px]">Clonează anunțul</div>
          </button>

          {/* Row 2: Resetează vizualizările */}
          <button
            onClick={() => handleAction(onResetViews)}
            className="flex items-center gap-4 p-4 min-h-[56px] rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="font-semibold text-foreground text-[15px]">Resetează vizualizările</div>
          </button>

          {/* Row 3: Șterge anunțul */}
          <button
            onClick={() => handleAction(onDeleteListing)}
            className="flex items-center gap-4 p-4 min-h-[56px] rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-destructive cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive text-destructive-foreground shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="font-semibold text-destructive text-[15px]">Șterge anunțul</div>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
