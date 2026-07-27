import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Car, UserPlus, Calendar } from "lucide-react";
import AddLeadModal from "./modals/AddLeadModal";

interface AddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddSheet({ open, onOpenChange }: AddSheetProps) {
  const navigate = useNavigate();
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-8 max-w-lg mx-auto bg-background text-foreground border-border">
          <DrawerHeader className="text-left px-0 pb-4">
            <DrawerTitle className="text-xl font-bold">Ce vrei să adaugi?</DrawerTitle>
          </DrawerHeader>
          <div className="grid gap-3">
            {/* Row 1: Mașină nouă (Primary tint, emphasized) */}
            <button
              onClick={() => handleSelect("/listings/new")}
              className="flex items-center gap-4 p-4 min-h-[64px] rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shrink-0 shadow-sm">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-foreground">Mașină nouă</div>
                <div className="text-xs text-muted-foreground">Poze, preț, detalii</div>
              </div>
            </button>

            {/* Row 2: Client nou */}
            <button
              onClick={() => {
                onOpenChange(false);
                setLeadModalOpen(true);
              }}
              className="flex items-center gap-4 p-4 min-h-[64px] rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-foreground">Client nou</div>
                <div className="text-xs text-muted-foreground">Cineva care a sunat sau a venit</div>
              </div>
            </button>

            {/* Row 3: Programare */}
            <button
              onClick={() => handleSelect("/calendar")}
              className="flex items-center gap-4 p-4 min-h-[64px] rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-foreground">Programare</div>
                <div className="text-xs text-muted-foreground">Test-drive, vizionare, predare</div>
              </div>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
      <AddLeadModal isOpen={leadModalOpen} onClose={() => setLeadModalOpen(false)} />
    </>
  );
}
