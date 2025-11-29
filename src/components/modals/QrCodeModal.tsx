
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
import html2canvas from 'html2canvas';
import { Download } from "lucide-react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string | null;
  listingSlug: string | null;
  urlPattern: string | null;
}

const QrCodeModal = ({ isOpen, onClose, listingId, listingSlug, urlPattern }: QrCodeModalProps) => {
  if (!listingId) return null;
  
  let publicUrl = urlPattern || `https://example.com/anunt/{id}`; 

  if (publicUrl.includes('{slug}')) {
    publicUrl = publicUrl.replace('{slug}', listingSlug || listingId);
  }
  if (publicUrl.includes('{id}')) {
    publicUrl = publicUrl.replace('{id}', listingId);
  }

  const fallbackMessage = !urlPattern ? (
    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
      Modelul URL nu este configurat. Setează-l în pagina de Setări Afacere.
    </p>
  ) : null;

  const downloadQrCode = async () => {
    const qrCodeElement = document.getElementById('qr-code-container');
    if (qrCodeElement) {
      try {
        const canvas = await html2canvas(qrCodeElement, { scale: 3 });
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `qr-code-${listingSlug || listingId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Failed to download QR code", error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Cod QR pentru Anunț</DialogTitle>
           <DialogDescription>
            Scanează acest cod pentru a deschide pagina publică a anunțului pe un telefon mobil.
          </DialogDescription>
        </DialogHeader>
        <div 
          id="qr-code-container" 
          className="bg-white rounded-lg flex flex-col items-center justify-center p-6"
        >
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
        <DialogFooter className="mt-4 sm:justify-between gap-2">
          <Button
            onClick={downloadQrCode}
            disabled={!urlPattern}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Descarcă PNG
          </Button>
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
            Închide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeModal;
