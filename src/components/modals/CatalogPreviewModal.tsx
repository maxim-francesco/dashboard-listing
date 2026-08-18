import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  Check,
  Link as LinkIcon,
  Share2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";

interface CatalogPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: any[];
  businessSettings: any;
}

const CatalogPreviewModal = ({
  isOpen,
  onClose,
  listings,
  businessSettings,
}: CatalogPreviewModalProps) => {
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [copiedWeb, setCopiedWeb] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Helper to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return "";
    let text = html
      .replace(/<\/p>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/div>/gi, " ");
    text = text.replace(/<[^>]*>/g, "");
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
    text = text.replace(/\s+/g, " ");
    return text.trim();
  };

  // Helper to get attribute value
  const getAttrValue = (listing: any, name: string) => {
    const av = listing.attributeValues?.find(
      (item: any) => item.attribute?.name?.toLowerCase() === name.toLowerCase()
    );
    if (!av) return "";
    if (av.stringValue !== null && av.stringValue !== undefined) return av.stringValue;
    if (av.numberValue !== null && av.numberValue !== undefined) return av.numberValue.toString();
    if (av.booleanValue !== null && av.booleanValue !== undefined) return av.booleanValue ? "Da" : "Nu";
    return "";
  };

  const hasPattern = Boolean(
    businessSettings?.listingUrlPattern && businessSettings.listingUrlPattern.trim()
  );
  const pattern = hasPattern ? businessSettings.listingUrlPattern.trim() : null;

  const previewRows = listings.map((listing) => {
    const id = listing.autovitId ? listing.autovitId.toString() : listing.id;
    const titleWords = (listing.title || "").trim().split(/\s+/);
    const marca = titleWords[0] || "";
    const model = titleWords[1] || "";
    const an = getAttrValue(listing, "An fabricație") || getAttrValue(listing, "An");
    const kilometraj = listing.mileage || getAttrValue(listing, "Kilometraj");
    const combustibil = getAttrValue(listing, "Combustibil");
    const cutie_viteze = getAttrValue(listing, "Transmisie") || getAttrValue(listing, "Cutie de viteze");
    const capacitate_cilindrica = getAttrValue(listing, "Capacitate cilindrică");
    const putere_cp = getAttrValue(listing, "Putere (CP)") || getAttrValue(listing, "Putere");

    let link: string | null = null;
    if (pattern) {
      let derived = pattern;
      if (derived.includes("{slug}")) {
        derived = derived.replace(/\{slug\}/g, listing.slug || listing.id);
      }
      if (derived.includes("{id}")) {
        derived = derived.replace(/\{id\}/g, listing.id);
      }
      link = derived;
    }

    // Build image links
    const imageLink = listing.images?.[0]?.url || "";
    const additionalImageLinks = listing.images
      ? listing.images.slice(1).map((img: any) => img.url).join(",")
      : "";

    const availability = "In Stock";
    const condition = "Used";
    let finalPrice = "";
    if (listing.price) {
      finalPrice = `${listing.price} EUR`;
    } else {
      const priceVal =
        getAttrValue(listing, "Preț") ||
        getAttrValue(listing, "Pret") ||
        getAttrValue(listing, "price");
      if (priceVal) {
        finalPrice = `${priceVal} EUR`;
      }
    }
    const title = listing.title || "";
    const description = stripHtml(listing.description || "");

    return {
      link,
      id,
      marca,
      model,
      an,
      kilometraj,
      combustibil,
      cutie_viteze,
      capacitate_cilindrica,
      putere_cp,
      price: finalPrice,
      imageLink,
      additionalImageLinks,
      availability,
      condition,
      title,
      description,
      quantity: "1",
    };
  });

  const businessId = businessSettings?.id || "";
  const backendBaseUrl =
    api.defaults.baseURL || (import.meta.env.VITE_API_BASE_URL as string) || "";
  const webPreviewUrl = `${window.location.origin}/public-feed/${businessId}`;
  const csvFeedUrl = `${backendBaseUrl}/public/listings/csv-feed?businessId=${businessId}`;

  const copyWebPreviewLink = () => {
    navigator.clipboard.writeText(webPreviewUrl);
    setCopiedWeb(true);
    toast.success("Link-ul de vizualizare a fost copiat!");
    setTimeout(() => setCopiedWeb(false), 2000);
  };

  const copyCsvFeedLink = () => {
    navigator.clipboard.writeText(csvFeedUrl);
    setCopiedCsv(true);
    toast.success("Link-ul de sincronizare a fost copiat!");
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const renderTable = () => (
    <Table>
      <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
        <TableRow className="border-border">
          <TableHead className="font-semibold text-foreground max-w-[160px]">Link</TableHead>
          <TableHead className="font-semibold text-foreground">ID</TableHead>
          <TableHead className="font-semibold text-foreground">Marca</TableHead>
          <TableHead className="font-semibold text-foreground">Model</TableHead>
          <TableHead className="font-semibold text-foreground">Year</TableHead>
          <TableHead className="font-semibold text-foreground">Mileage</TableHead>
          <TableHead className="font-semibold text-foreground">Fuel_Type</TableHead>
          <TableHead className="font-semibold text-foreground">Transmise</TableHead>
          <TableHead className="font-semibold text-foreground">Capacitate Cilindrica</TableHead>
          <TableHead className="font-semibold text-foreground">Putere (CP)</TableHead>
          <TableHead className="font-semibold text-foreground">Price</TableHead>
          <TableHead className="font-semibold text-foreground max-w-[150px]">image_link</TableHead>
          <TableHead className="font-semibold text-foreground max-w-[150px]">additional_image</TableHead>
          <TableHead className="font-semibold text-foreground">Availability</TableHead>
          <TableHead className="font-semibold text-foreground">Condition</TableHead>
          <TableHead className="font-semibold text-foreground">Title</TableHead>
          <TableHead className="font-semibold text-foreground max-w-[200px]">Description</TableHead>
          <TableHead className="font-semibold text-foreground">quantity_to_sell_on_facebook</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {previewRows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={18} className="text-center py-8 text-muted-foreground text-[13px]">
              Nu există mașini active în acest catalog.
            </TableCell>
          </TableRow>
        ) : (
          previewRows.map((row, idx) => (
            <TableRow key={row.id + "-" + idx} className="border-border hover:bg-muted/30">
              <TableCell className="font-mono text-xs max-w-[160px] truncate" title={row.link || "Model URL neconfigurat"}>
                {row.link ? (
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    <LinkIcon className="h-3 w-3 inline shrink-0" />
                    <span className="truncate">{row.link}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground italic text-[11px]">Neconfigurat</span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">{row.id}</TableCell>
              <TableCell className="font-medium">{row.marca}</TableCell>
              <TableCell className="font-medium">{row.model}</TableCell>
              <TableCell>{row.an}</TableCell>
              <TableCell className="font-mono text-xs">{row.kilometraj}</TableCell>
              <TableCell>{row.combustibil}</TableCell>
              <TableCell>{row.cutie_viteze}</TableCell>
              <TableCell>{row.capacitate_cilindrica}</TableCell>
              <TableCell>{row.putere_cp}</TableCell>
              <TableCell className="font-semibold text-primary">{row.price}</TableCell>
              <TableCell className="font-mono text-xs max-w-[150px] truncate" title={row.imageLink}>
                {row.imageLink ? (
                  <a
                    href={row.imageLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="h-3 w-3 inline shrink-0" />
                    <span className="truncate">{row.imageLink}</span>
                  </a>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="font-mono text-xs max-w-[150px] truncate" title={row.additionalImageLinks}>
                {row.additionalImageLinks || "—"}
              </TableCell>
              <TableCell>{row.availability}</TableCell>
              <TableCell>{row.condition}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.title}>
                {row.title}
              </TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.description}>
                {row.description}
              </TableCell>
              <TableCell className="font-mono text-xs">{row.quantity}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border max-w-5xl w-[95vw] max-h-[92vh] flex flex-col p-4 sm:p-6 gap-3 sm:gap-4 overflow-y-auto lg:overflow-hidden">
        <DialogHeader className="flex-shrink-0 text-left space-y-1">
          <DialogTitle className="text-[17px] sm:text-[20px] font-semibold text-foreground flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary shrink-0" />
            Link-uri pentru Facebook și Google
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            Folosește aceste link-uri pentru a conecta stocul de mașini la reclamele de pe Facebook și Google sau pentru a trimite lista completă.
          </DialogDescription>
        </DialogHeader>

        {!hasPattern && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[13px] flex-shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Modelul de link către site nu este configurat în Setări Afacere. Link-urile individuale ale mașinilor nu pot fi generate până la configurare.
            </p>
          </div>
        )}

        {/* Link Cards Section */}
        <div className="bg-muted/40 border border-border rounded-lg p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 flex-shrink-0">
          {/* Link 1: Web Preview */}
          <div className="space-y-1.5">
            <Label htmlFor="preview-page-url" className="text-[11px] font-semibold text-primary uppercase tracking-wide">
              1. Link vizualizare stoc (pagină web)
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="preview-page-url"
                readOnly
                value={webPreviewUrl}
                className="h-11 sm:h-9 bg-background select-all font-mono text-[12px] sm:text-[13px] text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-border w-full"
              />
              <Button
                type="button"
                variant="default"
                onClick={copyWebPreviewLink}
                className="h-11 sm:h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[13px] flex items-center justify-center gap-2 px-4 shrink-0 w-full sm:w-auto"
              >
                {copiedWeb ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedWeb ? "Copiat!" : "Copiază link-ul"}
              </Button>
            </div>
            <p className="text-[12px] text-muted-foreground leading-snug">
              Oricine deschide acest link poate vedea lista mașinilor direct în browser, fără cont sau autentificare.
            </p>
          </div>

          <div className="border-t border-border/60" />

          {/* Link 2: CSV Sync */}
          <div className="space-y-1.5">
            <Label htmlFor="preview-feed-url" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              2. Link sincronizare catalog (Facebook / Google / CSV)
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="preview-feed-url"
                readOnly
                value={csvFeedUrl}
                className="h-11 sm:h-9 bg-background select-all font-mono text-[12px] sm:text-[13px] text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-border w-full"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyCsvFeedLink}
                className="h-11 sm:h-9 border-border text-foreground hover:bg-muted font-medium text-[13px] flex items-center justify-center gap-2 px-4 shrink-0 w-full sm:w-auto"
              >
                {copiedCsv ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                {copiedCsv ? "Copiat!" : "Copiază link-ul"}
              </Button>
            </div>
            <p className="text-[12px] text-muted-foreground leading-snug">
              Link pentru sincronizarea automată a mașinilor în campaniile Facebook și Google sau pentru descărcare directă ca fișier CSV.
            </p>
          </div>
        </div>

        {/* Mobile Disclosure for Table */}
        <div className="lg:hidden flex flex-col gap-2 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTableOpen(!isTableOpen)}
            className="w-full h-11 flex items-center justify-between px-3 text-[13px] font-medium border-border text-foreground hover:bg-muted"
          >
            <span className="flex items-center gap-2 truncate">
              <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
              Previzualizează datele catalogului ({previewRows.length} mașini)
            </span>
            {isTableOpen ? (
              <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
            )}
          </Button>

          {isTableOpen && (
            <div className="flex flex-col gap-1.5 animate-in fade-in-50 duration-200">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 px-1">
                Glisează orizontal pentru a naviga cele 18 coloane
              </p>
              <div className="overflow-x-auto border border-border rounded-lg bg-background max-h-[260px] overflow-y-auto">
                {renderTable()}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
              Previzualizare date ({previewRows.length} mașini active)
            </span>
          </div>
          <div className="flex-1 overflow-auto border border-border rounded-lg bg-background min-h-[160px]">
            {renderTable()}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-3 border-t border-border mt-auto">
          <Button onClick={onClose} variant="outline" className="h-11 sm:h-9 w-full sm:w-auto text-[13px] font-medium">
            Închide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogPreviewModal;
