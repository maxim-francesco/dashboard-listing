import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Car, Plus, Users, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import AddSheet from "./AddSheet";
import { useInLucruCount } from "@/hooks/useInLucruCount";
import { useNetworkActionCount } from "@/hooks/useNetworkActionCount";

export default function BottomNav() {
  const { pathname } = useLocation();
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  // Active state calculations
  const isAziActive = pathname === "/";
  const isMasiniActive = pathname === "/listings" || pathname.startsWith("/listings/");
  const isClientiActive =
    pathname.startsWith("/customers") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/reservations");
  const isReteaActive = pathname.startsWith("/network");

  // Fetch counts for badges
  const { inLucru } = useInLucruCount();
  const { count: reteaCount } = useNetworkActionCount();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="h-16 flex items-end justify-around pb-2 relative">
        {/* Slot 1: Azi */}
        <Link
          to="/"
          className={cn(
            "flex flex-col items-center gap-1 w-16 pb-1 transition-colors cursor-pointer",
            isAziActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className="relative">
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium leading-none">Azi</span>
        </Link>

        {/* Slot 2: Mașini */}
        <Link
          to="/listings"
          className={cn(
            "flex flex-col items-center gap-1 w-16 pb-1 transition-colors cursor-pointer",
            isMasiniActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className="relative">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium leading-none">Mașini</span>
        </Link>

        {/* Slot 3: [+] Center Action Button */}
        <div className="relative w-16 flex justify-center pb-1">
          <button
            onClick={() => setAddSheetOpen(true)}
            className="w-14 h-14 -mt-[18px] relative -top-[18px] rounded-full bg-primary text-primary-foreground border-[3px] border-card flex items-center justify-center shadow-lg hover:bg-primary/95 focus:outline-none shrink-0 cursor-pointer"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Slot 4: Clienți */}
        <Link
          to="/customers"
          className={cn(
            "flex flex-col items-center gap-1 w-16 pb-1 transition-colors cursor-pointer",
            isClientiActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {inLucru > 0 && (
              <span className="absolute -top-1.5 -right-2 flex items-center justify-center bg-destructive text-destructive-foreground min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1">
                {inLucru}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium leading-none">Clienți</span>
        </Link>

        {/* Slot 5: Rețea */}
        <Link
          to="/network"
          className={cn(
            "flex flex-col items-center gap-1 w-16 pb-1 transition-colors cursor-pointer",
            isReteaActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className="relative">
            <Network className="w-5 h-5" />
            {reteaCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex items-center justify-center bg-destructive text-destructive-foreground min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1">
                {reteaCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium leading-none">Rețea</span>
        </Link>
      </div>
      <AddSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />
    </div>
  );
}
