import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
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
import { Copy, Link as LinkIcon, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

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
    // Collapse all whitespaces, including newlines, into a single space
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

  const previewRows = listings.map((listing) => {
    const id = listing.autovitId ? listing.autovitId.toString() : listing.id;
    const titleWords = listing.title.trim().split(/\s+/);
    const marca = titleWords[0] || "";
    const model = titleWords[1] || "";
    const an = getAttrValue(listing, "An fabricație") || getAttrValue(listing, "An");
    const kilometraj = listing.mileage || getAttrValue(listing, "Kilometraj");
    const combustibil = getAttrValue(listing, "Combustibil");
    const cutie_viteze = getAttrValue(listing, "Transmisie") || getAttrValue(listing, "Cutie de viteze");
    const capacitate_cilindrica = getAttrValue(listing, "Capacitate cilindrică");
    const putere_cp = getAttrValue(listing, "Putere (CP)") || getAttrValue(listing, "Putere");

    let link = businessSettings?.listingUrlPattern || "https://example.com/anunt/{id}";
    if (link.includes("{slug}")) {
      link = link.replace("{slug}", listing.slug || listing.id);
    }
    if (link.includes("{id}")) {
      link = link.replace("{id}", listing.id);
    }
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
    const title = listing.title;
    const description = stripHtml(listing.description);

    return {
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
      link,
      availability,
      condition,
      title,
      description,
    };
  });

  let domain = "https://carsleasing.ro"; // fallback default
  if (businessSettings?.listingUrlPattern) {
    try {
      const url = new URL(businessSettings.listingUrlPattern);
      domain = `${url.protocol}//${url.host}`;
    } catch (e) {
      console.error("Failed to parse listingUrlPattern:", e);
    }
  }
  const feedUrl = `${domain}/fisier.csv`;

  const copyFeedLink = () => {
    navigator.clipboard.writeText(feedUrl);
    toast.success("Link direct catalog copiat în clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border max-w-6xl w-[95vw] max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Previzualizare Feed Catalog (CSV)
          </DialogTitle>
          <DialogDescription>
            Tabelul de mai jos arată datele mașinilor exact așa cum sunt exportate în link-ul public CSV pentru Facebook/Google Catalog sau Excel.
          </DialogDescription>
        </DialogHeader>

        {/* Public Link Bar */}
        <div className="bg-muted/50 border border-border/80 rounded-lg p-4 my-2 flex flex-col md:flex-row md:items-center gap-4 flex-shrink-0">
          <div className="flex-grow space-y-1">
            <Label htmlFor="preview-feed-url" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Link Catalog Public (Direct)
            </Label>
            <div className="flex gap-2">
              <Input
                id="preview-feed-url"
                readOnly
                value={feedUrl}
                className="bg-background select-all font-mono text-xs text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-border"
              />
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={copyFeedLink}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiază Link
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-grow overflow-auto border border-border rounded-md bg-background min-h-0 mt-2">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow className="border-border">
                <TableHead className="font-semibold text-foreground">Post Id</TableHead>
                <TableHead className="font-semibold text-foreground">Marcă</TableHead>
                <TableHead className="font-semibold text-foreground">Model</TableHead>
                <TableHead className="font-semibold text-foreground">An</TableHead>
                <TableHead className="font-semibold text-foreground">Kilometraj</TableHead>
                <TableHead className="font-semibold text-foreground">Combustibil</TableHead>
                <TableHead className="font-semibold text-foreground">Transmisie</TableHead>
                <TableHead className="font-semibold text-foreground">Cilindree</TableHead>
                <TableHead className="font-semibold text-foreground">Putere</TableHead>
                <TableHead className="font-semibold text-foreground">Preț</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Condiție</TableHead>
                <TableHead className="font-semibold text-foreground">Titlu</TableHead>
                <TableHead className="font-semibold text-foreground max-w-[200px]">Link</TableHead>
                <span className="sr-only">Descriere</span>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                    Nu există anunțuri active de previzualizat.
                  </TableCell>
                </TableRow>
              ) : (
                previewRows.map((row, idx) => (
                  <TableRow key={row.id + "-" + idx} className="border-border hover:bg-muted/30">
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
                    <TableCell>{row.availability}</TableCell>
                    <TableCell>{row.condition}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={row.title}>
                      {row.title}
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate" title={row.link}>
                      <a href={row.link} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 inline" />
                        {row.link}
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer controls */}
        <div className="flex-shrink-0 flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
            Închide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogPreviewModal;
