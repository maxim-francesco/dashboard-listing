import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Globe, Slash, QrCode, FileText, Download, Loader2 } from "lucide-react";

interface PublishSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autovitStatus: string | null;
  onPublishAutovit: () => void;
  onUnpublishAutovit: () => void;
  onShowQrCode: () => void;
  onGeneratePdf: () => void;
  onDownloadZip: () => void;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
  isZipping?: boolean;
  isGeneratingPdf?: boolean;
}

export default function PublishSheet({
  open,
  onOpenChange,
  autovitStatus,
  onPublishAutovit,
  onUnpublishAutovit,
  onShowQrCode,
  onGeneratePdf,
  onDownloadZip,
  isPublishing = false,
  isUnpublishing = false,
  isZipping = false,
  isGeneratingPdf = false,
}: PublishSheetProps) {
  const isActive = autovitStatus === "active";

  const handleAction = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-8 max-w-lg mx-auto bg-background text-foreground border-border">
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        <DrawerHeader className="text-left px-0 pb-4">
          <DrawerTitle className="text-xl font-bold">Publicare</DrawerTitle>
        </DrawerHeader>
        <div className="grid gap-2.5">
          {/* Row 1: Publică/Dezactivează pe Autovit */}
          {!isActive ? (
            <button
              onClick={() => handleAction(onPublishAutovit)}
              disabled={isPublishing}
              className="flex items-center gap-4 p-4 min-h-[56px] rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
              </div>
              <div className="font-semibold text-foreground text-[15px]">Publică pe Autovit & OLX</div>
            </button>
          ) : (
            <button
              onClick={() => handleAction(onUnpublishAutovit)}
              disabled={isUnpublishing}
              className="flex items-center gap-4 p-4 min-h-[56px] rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 text-destructive shrink-0">
                {isUnpublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Slash className="w-5 h-5" />}
              </div>
              <div className="font-semibold text-foreground text-[15px]">Dezactivează pe Autovit</div>
            </button>
          )}

          {/* Row 2: Arată cod QR */}
          <button
            onClick={() => handleAction(onShowQrCode)}
            className="flex items-center gap-4 p-4 min-h-[56px] rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="font-semibold text-foreground text-[15px]">Arată cod QR</div>
          </button>

          {/* Row 3: Fișă tehnică PDF */}
          <button
            onClick={() => handleAction(onGeneratePdf)}
            disabled={isGeneratingPdf}
            className="flex items-center gap-4 p-4 min-h-[56px] rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
              {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="font-semibold text-foreground text-[15px]">Fișă tehnică PDF</div>
          </button>

          {/* Row 4: Descarcă pozele (ZIP) */}
          <button
            onClick={() => handleAction(onDownloadZip)}
            disabled={isZipping}
            className="flex items-center gap-4 p-4 min-h-[56px] rounded-xl border border-border bg-card hover:bg-accent text-left transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
              {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </div>
            <div className="font-semibold text-foreground text-[15px]">Descarcă pozele (ZIP)</div>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
