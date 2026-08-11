import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface ExtendReservationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  carTitle: string;
  onConfirm: (days: number) => void;
}

const OPTIONS = [7, 14, 30];

export default function ExtendReservationSheet({ isOpen, onClose, carTitle, onConfirm }: ExtendReservationSheetProps) {
  const [days, setDays] = useState(7);
  useEffect(() => { if (isOpen) setDays(7); }, [isOpen]);

  return (
    <Drawer open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="bg-background border-border">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-foreground text-[18px]">Prelungește rezervarea</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <p className="text-[14px] text-muted-foreground mb-4">{carTitle}</p>
          <div className="flex gap-2 mb-5">
            {OPTIONS.map((o) => (
              <button
                key={o}
                onClick={() => setDays(o)}
                className={"flex-1 h-14 rounded-xl border text-[16px] font-medium transition-colors " + (days === o ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}
              >
                +{o} zile
              </button>
            ))}
          </div>
          <Button className="w-full h-12 text-[16px]" onClick={() => { onConfirm(days); onClose(); }}>
            Prelungește cu {days} zile
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
