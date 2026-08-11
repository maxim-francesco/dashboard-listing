import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Car } from "lucide-react";
import { getActiveListings } from "@/services/api";

interface PickCarSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (listing: any) => void;
  statuses?: string[];
}

export default function PickCarSheet({ isOpen, onClose, onPick, statuses = ["AVAILABLE"] }: PickCarSheetProps) {
  const [search, setSearch] = useState("");
  const { data: listings = [], isLoading } = useQuery<any[]>({
    queryKey: ["listings"],
    queryFn: getActiveListings,
    refetchOnWindowFocus: false,
    enabled: isOpen,
  });

  const available = (listings as any[]).filter((l) => statuses.includes(l.status ?? "AVAILABLE"));
  const term = search.toLowerCase().trim();
  const filtered = term
    ? available.filter((l) => (l.title || "").toLowerCase().includes(term))
    : available;

  return (
    <Drawer open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="bg-background border-border max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-foreground text-[18px]">Alege mașina</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Caută marcă, model"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border h-11"
            />
          </div>
        </div>
        <div className="px-4 pb-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Car className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-[14px] text-muted-foreground">
                {term ? "Nicio mașină găsită." : "Nicio mașină disponibilă de rezervat."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onPick(l)}
                  className="flex items-center gap-3 p-2.5 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors text-left w-full"
                >
                  {l.images && l.images.length > 0 ? (
                    <img src={l.images[0].url} alt={l.title} className="rounded-lg object-cover shrink-0 bg-muted" style={{ width: "72px", height: "54px" }} />
                  ) : (
                    <div className="rounded-lg bg-muted flex items-center justify-center shrink-0" style={{ width: "72px", height: "54px" }}>
                      <Car className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-foreground truncate">{l.title}</div>
                    <div className="text-[14px] text-muted-foreground">
                      {new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(l.price || 0)} €
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
