import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Copy, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";

interface ShareOfferSheetProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string | null;
  clientPhone: string;
  carTitle: string;
  offerPrice: number;
  validityDays?: number;
  firmName?: string;
}

function waLink(phone: string, text: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  let wa = digits;
  if (digits.startsWith("0")) wa = "40" + digits.slice(1);
  return "https://wa.me/" + wa + "?text=" + encodeURIComponent(text);
}

export default function ShareOfferSheet({ isOpen, onClose, publicUrl, clientPhone, carTitle, offerPrice, validityDays, firmName }: ShareOfferSheetProps) {
  const priceTxt = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(offerPrice || 0) + " €";
  const validTxt = validityDays ? (" — valabilă " + validityDays + " zile") : "";
  const message = publicUrl
    ? ("Bună ziua! Oferta pentru " + carTitle + validTxt + ":\n\n" + publicUrl + "\n\n" + (firmName || ""))
    : ("Bună ziua! Oferta pentru " + carTitle + " la prețul de " + priceTxt + validTxt + ". " + (firmName || ""));

  const copyLink = async () => {
    if (!publicUrl) { toast.error("Link indisponibil pentru această ofertă."); return; }
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiat!");
    } catch {
      toast.error("Nu s-a putut copia linkul.");
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="bg-background border-border">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-foreground text-[18px]">Trimite oferta</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <p className="text-[14px] text-muted-foreground mb-1">{carTitle}</p>
          <p className="text-[15px] font-medium text-foreground mb-4">{priceTxt}{validityDays ? (" · valabilă " + validityDays + " zile") : ""}</p>

          {publicUrl && (
            <a href={publicUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[13px] text-primary hover:underline mb-4 break-all">
              <ExternalLink className="w-4 h-4 shrink-0" /> {publicUrl}
            </a>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 text-[15px]" onClick={copyLink}>
              <Copy className="w-4 h-4 mr-2" /> Copiază link
            </Button>
            <Button
              className="flex-1 h-12 text-[15px] bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.open(waLink(clientPhone, message), "_blank")}
            >
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
