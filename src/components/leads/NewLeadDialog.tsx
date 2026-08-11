import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ImageIcon, Loader2 } from "lucide-react";
import { getActiveListings, createManualLead } from "@/services/api";
import { toast } from "react-hot-toast";

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newLeadId: string) => void;
}

export const NewLeadDialog = ({ open, onOpenChange, onSuccess }: NewLeadDialogProps) => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"GENERAL" | "STOCK" | "ORDER" | "BUYBACK" | "FINANCING">("GENERAL");
  const [listingId, setListingId] = useState<string | null>(null);

  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form fields
      setPhone("");
      setName("");
      setType("GENERAL");
      setListingId(null);
      
      // Fetch active listings
      setListingsLoading(true);
      getActiveListings()
        .then(setListings)
        .catch((e) => console.error("Eroare la încărcarea anunțurilor:", e))
        .finally(() => setListingsLoading(false));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsSubmitting(true);
    try {
      const data = await createManualLead({
        phone: phone.trim(),
        name: name.trim() || undefined,
        type,
        listingId,
      });
      toast.success("Lead creat cu succes");
      onOpenChange(false);
      onSuccess(data.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Eroare la crearea lead-ului.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedListing = listings.find((l) => l.id === listingId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[92vw] rounded-2xl p-6 bg-background border border-border gap-4 z-[99]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Lead nou</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Telefon */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
              Telefon <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="ex: 0740111222"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 md:h-10 text-base md:text-xs border-border bg-background"
              required
              autoFocus
            />
          </div>

          {/* Nume */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground">
              Nume
            </Label>
            <Input
              id="name"
              placeholder="ex: Popescu Ion"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 md:h-10 text-base md:text-xs border-border bg-background"
            />
          </div>

          {/* Tip Lead */}
          <div className="space-y-1.5">
            <Label htmlFor="type" className="text-xs font-semibold text-foreground">
              Tip Lead
            </Label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger className="w-full h-11 md:h-10 text-base md:text-xs bg-background border-border">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent className="z-[101]">
                <SelectItem value="GENERAL" className="text-base md:text-xs">General</SelectItem>
                <SelectItem value="STOCK" className="text-base md:text-xs">Stoc</SelectItem>
                <SelectItem value="ORDER" className="text-base md:text-xs">Comandă</SelectItem>
                <SelectItem value="BUYBACK" className="text-base md:text-xs">Buyback</SelectItem>
                <SelectItem value="FINANCING" className="text-base md:text-xs">Finanțare</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mașină asociată */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Mașină (opțional)</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full h-11 md:h-10 justify-between text-base md:text-xs border-border bg-background hover:bg-secondary/20"
                  disabled={listingsLoading}
                >
                  {selectedListing ? selectedListing.title : "Selectează un autovehicul"}
                  <span className="opacity-50 text-[10px]">▼</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] sm:w-[400px] p-0 bg-popover border-border z-[101]">
                <Command className="w-full">
                  <CommandInput placeholder="Căutare anunț după titlu..." className="border-none focus:ring-0" />
                  <CommandList className="max-h-[200px] overflow-y-auto">
                    <CommandEmpty>Nu s-a găsit niciun anunț.</CommandEmpty>
                    <CommandGroup>
                      {listings.map((l) => (
                        <CommandItem
                          key={l.id}
                          value={l.title}
                          onSelect={() => {
                            setListingId(l.id === listingId ? null : l.id);
                            setComboboxOpen(false);
                          }}
                          className="text-foreground hover:bg-secondary cursor-pointer flex items-center justify-between p-2.5 text-base md:text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {l.images && l.images.length > 0 ? (
                              <img src={l.images[0].url} alt="" className="w-6 h-6 object-cover rounded" />
                            ) : (
                              <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <span>{l.title}</span>
                          </div>
                          <span className="font-semibold text-primary">
                            {l.price ? `${l.price} EUR` : ""}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit / Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 md:h-10 text-base md:text-xs border-border px-4"
              disabled={isSubmitting}
            >
              Anulează
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !phone.trim()}
              className="h-11 md:h-10 text-base md:text-xs font-semibold bg-primary hover:bg-primary-dark text-white px-4"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Adaugă lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
