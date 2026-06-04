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
    if (businessSettings?.id === "cmhomcpoi02x1ut2cpips3mo3") {
      link = "https://www.carsleasing.ro/stoc/{id}";
    }
    if (link.includes("{slug}")) {
      link = link.replace("{slug}", listing.slug || listing.id);
    }
    if (link.includes("{id}")) {
      link = link.replace("{id}", listing.id);
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
    const title = listing.title;
    const description = stripHtml(listing.description);

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
        <div className="bg-muted/50 border border-border/80 rounded-lg p-4 my-2 flex flex-col gap-4 flex-shrink-0">
          <div className="space-y-1">
            <Label htmlFor="preview-page-url" className="text-xs font-semibold text-primary uppercase tracking-wider">
              1. Link Previzualizare Web (Tabel Public fără Login)
            </Label>
            <div className="flex gap-2">
              <Input
                id="preview-page-url"
                readOnly
                value={`${window.location.origin}/public-feed/${businessSettings?.id || ""}`}
                className="bg-background select-all font-mono text-xs text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-border"
              />
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/public-feed/${businessSettings?.id || ""}`);
                  toast.success("Link previzualizare publică copiat!");
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiază Link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Oricine deschide acest link va vedea tabelul interactiv de mașini direct în browser, fără să aibă cont sau să fie autentificat.
            </p>
          </div>

          <div className="space-y-1 border-t border-border/50 pt-4">
            <Label htmlFor="preview-feed-url" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              2. Link Catalog Sincronizare (CSV / Facebook / Google Ads)
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
                variant="outline"
                size="sm"
                onClick={copyFeedLink}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground flex-shrink-0"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiază Link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Link de sincronizare pentru campanii sau pentru descărcare directă ca fișier CSV.
            </p>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-grow overflow-auto border border-border rounded-md bg-background min-h-0 mt-2">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow className="border-border">
                <TableHead className="font-semibold text-foreground max-w-[150px]">Link</TableHead>
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
                  <TableCell colSpan={18} className="text-center py-8 text-muted-foreground">
                    Nu există anunțuri active de previzualizat.
                  </TableCell>
                </TableRow>
              ) : (
                previewRows.map((row, idx) => (
                  <TableRow key={row.id + "-" + idx} className="border-border hover:bg-muted/30">
                    <TableCell className="font-mono text-xs max-w-[150px] truncate" title={row.link}>
                      <a href={row.link} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 inline" />
                        {row.link}
                      </a>
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
                        <a href={row.imageLink} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          <LinkIcon className="h-3 w-3 inline" />
                          {row.imageLink}
                        </a>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[150px] truncate" title={row.additionalImageLinks}>
                      {row.additionalImageLinks || "-"}
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
