
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string | null;
  urlPattern: string | null;
}

const QrCodeModal = ({ isOpen, onClose, listingId, urlPattern }: QrCodeModalProps) => {
  if (!listingId) return null;
  
  const publicUrl = urlPattern 
    ? urlPattern.replace('{id}', listingId)
    : `https://example.com/anunt/${listingId}`; // Fallback

  const fallbackMessage = !urlPattern ? (
    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
      Modelul URL nu este configurat. Setează-l în pagina de Setări Afacere.
    </p>
  ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Cod QR pentru Anunț</DialogTitle>
           <DialogDescription>
            Scanează acest cod pentru a deschide pagina publică a anunțului pe un telefon mobil.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-white rounded-lg flex items-center justify-center">
            <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={publicUrl}
                viewBox={`0 0 256 256`}
            />
        </div>
        <div className="text-center text-xs text-muted-foreground mt-2 break-words">
            URL: {publicUrl}
            {fallbackMessage}
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={onClose} variant="outline" className="w-full">
            Închide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeModal;
