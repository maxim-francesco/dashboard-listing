import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Link as LinkIcon, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "react-hot-toast";

interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  createdAt: string;
  price: number | null;
  mileage: number | null;
  autovitId?: string | null;
  attributeValues: any[];
  images?: { url: string }[];
}

const PublicFeedPreview = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicListings = async () => {
      if (!businessId) {
        setError("ID-ul afacerii lipsește din URL.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Hit the public search endpoint
        const response = await axios.get(
          `https://saas-platform-backend.onrender.com/api/public/listings/search`,
          {
            params: {
              businessId,
              limit: 500, // Fetch all active listings
            },
          }
        );
        
        if (response.data && response.data.data) {
          setListings(response.data.data);
        } else {
          setListings([]);
        }
      } catch (err: any) {
        console.error("Error fetching listings for preview:", err);
        setError("Nu s-au putut încărca datele catalogului public.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicListings();
  }, [businessId]);



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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium text-lg">Se încarcă previzualizarea catalogului public...</p>
      </div>
    );
  }

  if (error || !businessId) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-center">
        <div className="max-w-md bg-card border border-destructive/20 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-destructive mb-3">Eroare de încărcare</h2>
          <p className="text-muted-foreground mb-6">{error || "ID-ul afacerii nu este valid."}</p>
          <Button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground">
            Reîncearcă
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            Previzualizare Catalog
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Această pagină publică afișează datele mașinilor formatate pentru catalog.
          </p>
        </div>
        <Button
          onClick={() => {
            window.location.href = `https://saas-platform-backend.onrender.com/api/public/listings/csv-feed?businessId=${businessId}`;
          }}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 shadow-md"
        >
          <Download className="h-4 w-4" />
          Descarcă CSV
        </Button>
      </div>

      {/* Main Table Preview */}
      <Card className="border-card-border bg-card shadow-md overflow-hidden">
        <CardHeader className="bg-muted/40 border-b border-border/50">
          <CardTitle className="text-foreground text-lg">Mașini în catalog ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/70">
                <TableRow className="border-border">
                  <TableHead className="font-semibold text-foreground">Post Id</TableHead>
                  <TableHead className="font-semibold text-foreground">Marcă</TableHead>
                  <TableHead className="font-semibold text-foreground">Model</TableHead>
                  <TableHead className="font-semibold text-foreground">An</TableHead>
                  <TableHead className="font-semibold text-foreground">Kilometraj</TableHead>
                  <TableHead className="font-semibold text-foreground">Combustibil</TableHead>
                  <TableHead className="font-semibold text-foreground">Cutie</TableHead>
                  <TableHead className="font-semibold text-foreground">Cilindree</TableHead>
                  <TableHead className="font-semibold text-foreground">Putere</TableHead>
                  <TableHead className="font-semibold text-foreground">Preț</TableHead>
                  <TableHead className="font-semibold text-foreground">Availability</TableHead>
                  <TableHead className="font-semibold text-foreground">Condition</TableHead>
                  <TableHead className="font-semibold text-foreground">Titlu</TableHead>
                  <TableHead className="font-semibold text-foreground max-w-[150px]">Image Link</TableHead>
                  <TableHead className="font-semibold text-foreground max-w-[150px]">Additional Images</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-12 text-muted-foreground">
                      Nu există mașini active în acest catalog.
                    </TableCell>
                  </TableRow>
                ) : (
                  listings.map((listing) => {
                    const id = listing.autovitId ? listing.autovitId.toString() : listing.id;
                    const titleWords = listing.title.trim().split(/\s+/);
                    const marca = titleWords[0] || "";
                    const model = titleWords[1] || "";
                    const an = getAttrValue(listing, "An fabricație") || getAttrValue(listing, "An");
                    const kilometraj = listing.mileage || getAttrValue(listing, "Kilometraj");
                    const combustibil = getAttrValue(listing, "Combustibil");
                    const cutie = getAttrValue(listing, "Transmisie") || getAttrValue(listing, "Cutie de viteze");
                    const cilindree = getAttrValue(listing, "Capacitate cilindrică");
                    const putere = getAttrValue(listing, "Putere (CP)") || getAttrValue(listing, "Putere");

                    // Build link
                    const friendlyDomain = businessId === "cmhomcpoi02x1ut2cpips3mo3" ? "https://carsleasing.ro" : "https://example.com";
                    const link = `${friendlyDomain}/anunturi/${listing.slug || listing.id}`;

                    const availability = "In Stock";
                    const condition = "Used";
                    const priceStr = listing.price ? `${listing.price} EUR` : "";

                    return (
                      <TableRow key={listing.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-mono text-xs">{id}</TableCell>
                        <TableCell className="font-medium text-foreground">{marca}</TableCell>
                        <TableCell className="font-medium text-foreground">{model}</TableCell>
                        <TableCell>{an}</TableCell>
                        <TableCell className="font-mono text-xs">{kilometraj}</TableCell>
                        <TableCell>{combustibil}</TableCell>
                        <TableCell>{cutie}</TableCell>
                        <TableCell>{cilindree}</TableCell>
                        <TableCell>{putere}</TableCell>
                        <TableCell className="font-semibold text-primary">{priceStr}</TableCell>
                        <TableCell>{availability}</TableCell>
                        <TableCell>{condition}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={listing.title}>
                          {listing.title}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[150px] truncate" title={listing.images?.[0]?.url || ""}>
                          {listing.images?.[0]?.url ? (
                            <a
                              href={listing.images[0].url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="h-3 w-3 inline" />
                              {listing.images[0].url}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[150px] truncate" title={listing.images ? listing.images.slice(1).map(img => img.url).join(",") : ""}>
                          {listing.images && listing.images.length > 1
                            ? listing.images.slice(1).map(img => img.url).join(",")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicFeedPreview;
