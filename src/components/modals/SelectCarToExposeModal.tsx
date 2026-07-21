import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Car } from "lucide-react";
import { getSlowStock, SlowStockItem } from "@/services/api";
import { cn } from "@/lib/utils";

interface SelectCarToExposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (item: SlowStockItem) => void;
  onAddNew: () => void;
}

const SelectCarToExposeModal = ({
  isOpen,
  onClose,
  onPick,
  onAddNew,
}: SelectCarToExposeModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cars, isLoading } = useQuery({
    queryKey: ["exposable-cars"],
    queryFn: () => getSlowStock(0),
    enabled: isOpen,
  });

  const filteredCars = useMemo(() => {
    if (!cars) return [];
    return cars.filter((car) =>
      car.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cars, searchQuery]);

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="bg-popover border-border max-w-lg flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Expune o mașină la schimb</DialogTitle>
          <DialogDescription>
            Alege o mașină din stocul tău pentru a o expune în rețeaua B2B.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2 flex-1 min-h-0">
          {/* Top Actions: Search and Add New */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după titlu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background h-9 text-sm"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddNew}
              className="h-9 shrink-0 flex items-center gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adaugă o mașină nouă</span>
            </Button>
          </div>

          {/* Car List */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
                <Car className="w-10 h-10 mb-2 opacity-45" />
                <p className="text-sm">Nu ai mașini disponibile de expus.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCars.map((item) => {
                  const isAlreadyExposed = item.isExposed && item.tradeStatus === "ACTIVE";

                  return (
                    <div
                      key={item.listingId}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border border-border bg-card transition-colors",
                        isAlreadyExposed && "opacity-60 bg-muted/20"
                      )}
                    >
                      {/* Car Image */}
                      <div className="w-16 h-12 shrink-0 bg-muted rounded overflow-hidden relative">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Car className="w-5 h-5 opacity-40" />
                          </div>
                        )}
                      </div>

                      {/* Car Details */}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-sm text-foreground truncate leading-snug">
                          {item.title}
                        </h5>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.year ? `${item.year}` : ""}
                          {item.mileage ? ` · ${item.mileage.toLocaleString()} km` : ""}
                          {item.price ? ` · ${item.price.toLocaleString()} €` : " · Preț nespecificat"}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 ml-2">
                        {isAlreadyExposed ? (
                          <Badge
                            variant="secondary"
                            className="bg-muted text-muted-foreground/75 border-none text-[10px] font-semibold px-2.5 py-0.5"
                          >
                            Deja expusă
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 text-xs font-semibold px-3"
                            onClick={() => onPick(item)}
                          >
                            Expune
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectCarToExposeModal;
