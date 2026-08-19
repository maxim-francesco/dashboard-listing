import { useState, useMemo } from "react";
import { Search, Check, ImageIcon, ExternalLink, Link2Off, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ListingItem {
  id: string;
  title: string;
  price?: number | null;
  images?: { url: string }[];
  publicUrl?: string;
}

interface LeadCarSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentListingId: string | null;
  currentListing?: ListingItem | null;
  listings: ListingItem[];
  listingsLoading: boolean;
  onSelectListing: (listingId: string | null) => void;
}

export function LeadCarSheet({
  isOpen,
  onClose,
  currentListingId,
  currentListing,
  listings,
  listingsLoading,
  onSelectListing,
}: LeadCarSheetProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredListings = useMemo(() => {
    if (!search.trim()) return listings;
    const q = search.toLowerCase();
    return listings.filter((item) =>
      item.title?.toLowerCase().includes(q)
    );
  }, [listings, search]);

  const handleSelect = (id: string | null) => {
    onSelectListing(id);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="bg-card border-border rounded-t-2xl p-4 space-y-3.5 max-h-[85vh] overflow-y-auto [&>button.absolute]:hidden flex flex-col"
      >
        <SheetHeader>
          <SheetTitle className="text-[17px] font-semibold text-foreground text-left">
            Autovehicul asociat
          </SheetTitle>
          <SheetDescription className="text-[13px] text-muted-foreground text-left">
            Asociază un anunț activ din stoc cu acest lead
          </SheetDescription>
        </SheetHeader>

        {/* Currently linked car quick actions if present */}
        {currentListing && (
          <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentListing.images && currentListing.images.length > 0 ? (
                <img
                  src={currentListing.images[0].url}
                  alt={currentListing.title}
                  className="w-10 h-10 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {currentListing.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/listings/${currentListing.id}/edit`);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                  >
                    <span>Editează</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  {currentListing.publicUrl &&
                    !currentListing.publicUrl.includes("example.com") && (
                      <a
                        href={currentListing.publicUrl}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:underline font-medium"
                      >
                        <span>Public</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="min-h-[44px] px-2.5 flex items-center gap-1 text-[12px] text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
              title="Dezactivează legătura"
            >
              <Link2Off className="w-4 h-4" />
              <span>Dezleagă</span>
            </button>
          </div>
        )}

        {/* Search input */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="lead-car-search-input"
            name="lead-car-search"
            placeholder="Caută anunț după titlu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border rounded-xl w-full h-11 text-[14px] focus-visible:ring-0 focus-visible:border-border"
          />
        </div>

        {/* Listings List */}
        <div className="space-y-1.5 flex-1 min-h-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
            Anunțuri active
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border max-h-[42vh] overflow-y-auto">
            {/* Unlink / No car option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                "w-full min-h-[48px] px-3.5 flex items-center justify-between gap-2.5 text-[13px] text-left select-none transition-colors hover:bg-muted/50 cursor-pointer",
                !currentListingId && "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                  {!currentListingId && <Check className="w-4 h-4 text-primary" />}
                </div>
                <span className="font-medium text-muted-foreground">— Fără mașină —</span>
              </div>
            </button>

            {listingsLoading ? (
              <div className="p-4 text-center text-[13px] text-muted-foreground">
                Se încarcă anunțurile...
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="p-4 text-center text-[13px] text-muted-foreground">
                Niciun anunț găsit.
              </div>
            ) : (
              filteredListings.map((car) => {
                const isSelected = currentListingId === car.id;
                const thumb = car.images?.[0]?.url;

                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => handleSelect(car.id)}
                    className={cn(
                      "w-full min-h-[48px] px-3.5 py-2 flex items-center justify-between gap-3 text-left select-none transition-colors hover:bg-muted/50 cursor-pointer",
                      isSelected && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={car.title}
                          className="w-10 h-7 object-cover rounded shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-7 bg-muted rounded flex items-center justify-center shrink-0">
                          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "truncate text-[13px]",
                          isSelected ? "text-primary font-medium" : "text-foreground"
                        )}
                      >
                        {car.title}
                      </span>
                    </div>

                    {car.price ? (
                      <span className="text-[13px] font-semibold text-primary tabular-nums shrink-0 ml-2">
                        {new Intl.NumberFormat("ro-RO", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        }).format(car.price)}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
