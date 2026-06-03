
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { downloadImagesAsZip } from '@/utils/downloadImagesAsZip';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, Loader2, ImageIcon, Eye, MoreHorizontal, ClipboardCheck, Copy, FileText, QrCode, Upload, EyeOff, Archive, RefreshCw, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { format } from 'date-fns';
import api, { 
  getAutovitStatus, 
  publishToAutovitAndOLX, 
  unpublishFromAutovit,
  resetViewsForListing
} from "@/services/api";
import MarkAsSoldModal from "@/components/modals/MarkAsSoldModal";
import { PrintableSpecSheet } from "@/components/listings/PrintableSpecSheet";
import QrCodeModal from "@/components/modals/QrCodeModal";
import CatalogPreviewModal from "@/components/modals/CatalogPreviewModal";
import AutovitStatusBadge from "@/components/listings/AutovitStatusBadge";

interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: {
    name: string;
  };
  createdAt: string;
  status: 'Activ' | 'Inactiv';
  images?: { url: string }[];
  attributeValues: any[];
  _count?: {
    views: number;
  };
  autovitId?: string | null;
  autovitStatus?: string | null;
}

interface Business {
  id: string;
  listingUrlPattern: string | null;
}

// Componentă separată pentru meniul de acțiuni pentru a gestiona starea per rând
const ListingActionDropdown = ({ 
  listing, 
  onDelete, 
  onClone, 
  onSold, 
  onGeneratePdf, 
  onShowQr,
  isPdfLoading 
}: { 
  listing: Listing; 
  onDelete: (id: string, title: string) => void;
  onClone: (id: string) => void;
  onSold: (listing: Listing) => void;
  onGeneratePdf: (listing: Listing) => void;
  onShowQr: (listing: Listing) => void;
  isPdfLoading: boolean;
}) => {
  const navigate = useNavigate();
  const [autovitStatus, setAutovitStatus] = useState<string | null>(null);
  const [autovitId, setAutovitId] = useState<string | null>(null);
  const [isAutovitLoading, setIsAutovitLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isResettingViews, setIsResettingViews] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && listing.id) {
      console.log(`[DEBUG] Listing for ${listing.id}:`, listing);
      getAutovitStatus(listing.id)
        .then(res => {
          console.log(`[DEBUG] Autovit Status for ${listing.id}:`, res.data);
          setAutovitStatus(res.data.autovitStatus);
          setAutovitId(res.data.autovitId);
        })
        .catch((err) => {
          console.error(`[DEBUG] Failed to fetch Autovit status for ${listing.id}:`, err);
        });
    }
  }, [isOpen, listing.id]);

  const handlePublishAutovit = async () => {
    setIsAutovitLoading(true);
    try {
      const res = await publishToAutovitAndOLX(listing.id);
      toast.success(res.data.message || "Publicat pe Autovit & OLX!");
      setAutovitStatus("active");
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Eroare la publicare.");
    } finally {
      setIsAutovitLoading(false);
    }
  };

  const handleDeactivateAutovit = async () => {
    setIsAutovitLoading(true);
    try {
      await unpublishFromAutovit(listing.id);
      toast.success("Anunț dezactivat de pe Autovit & OLX.");
      setAutovitStatus("inactive");
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Eroare la dezactivare.");
    } finally {
      setIsAutovitLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!listing.images || listing.images.length === 0) {
      toast.error('Acest anunț nu are imagini de descărcat.');
      return;
    }
    setIsZipping(true);
    toast.loading('Se pregătește arhiva...', { id: 'zip-toast' });
    try {
      await downloadImagesAsZip(listing.images, listing.title);
      toast.success('Arhiva a fost descărcată cu succes!', { id: 'zip-toast' });
    } catch (error) {
      toast.error('A apărut o eroare la crearea arhivei.', { id: 'zip-toast' });
    } finally {
      setIsZipping(false);
    }
  };

  const handleResetViews = async () => {
    if (!window.confirm(`Sigur vrei să resetezi vizualizările pentru "${listing.title}"? Numărul va începe de la 0.`)) {
      return;
    }
    setIsResettingViews(true);
    try {
      await resetViewsForListing(listing.id);
      toast.success('Vizualizările au fost resetate.');
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Eroare la resetarea vizualizărilor.');
    } finally {
      setIsResettingViews(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Deschide meniu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border min-w-[200px]">
        <DropdownMenuItem
          onClick={() => onGeneratePdf(listing)}
          disabled={isPdfLoading}
          className="cursor-pointer"
        >
          {isPdfLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
              <FileText className="mr-2 h-4 w-4" />
          )}
          <span>{isPdfLoading ? 'Se generează...' : 'Generează PDF'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => onShowQr(listing)}
          className="cursor-pointer"
        >
          <QrCode className="mr-2 h-4 w-4" />
          <span>Arată cod QR</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => onSold(listing)}
          className="cursor-pointer"
        >
          <ClipboardCheck className="mr-2 h-4 w-4" />
          <span>Marchează ca Vândut</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => onClone(listing.id)}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          <span>Clonează</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="cursor-pointer"
        >
          {isZipping ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Archive className="mr-2 h-4 w-4" />
          )}
          <span>{isZipping ? 'Se descarcă...' : 'Descarcă poze (ZIP)'}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            handleResetViews();
          }}
          disabled={isResettingViews}
          className="cursor-pointer"
        >
          {isResettingViews ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          <span>{isResettingViews ? 'Se resetează...' : 'Resetează vizualizări'}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {autovitStatus !== "active" ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handlePublishAutovit();
            }}
            disabled={isAutovitLoading}
            className="cursor-pointer text-success hover:!text-success-foreground hover:!bg-success"
          >
            {isAutovitLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            <span>{isAutovitLoading ? "Se publică..." : "Publică pe Autovit & OLX"}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleDeactivateAutovit();
            }}
            disabled={isAutovitLoading}
            className="cursor-pointer text-destructive hover:!text-destructive-foreground hover:!bg-destructive"
          >
            {isAutovitLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <EyeOff className="mr-2 h-4 w-4" />
            )}
            <span>{isAutovitLoading ? "Se dezactivează..." : "Dezactivează Autovit & OLX"}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate(`/listings/${listing.id}/edit`)}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>Editează</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => onDelete(listing.id, listing.title)}
          className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Șterge</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Listings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const [pdfListing, setPdfListing] = useState<Listing | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrListing, setQrListing] = useState<{id: string, slug: string} | null>(null);
  const [businessSettings, setBusinessSettings] = useState<Business | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const navigate = useNavigate();

  const { data: listings = [], isLoading, refetch } = useQuery<Listing[]>({
    queryKey: ['listings'],
    queryFn: async () => {
        const response = await api.get('/listings');
        const listingsWithStatus = response.data.map((listing: any) => ({
            ...listing,
            status: 'Activ' as const,
        }));
        return listingsWithStatus;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await api.get<Business>('/business/me');
        setBusinessSettings(response.data);
      } catch (error) {
        console.error("Failed to fetch business settings for QR code.");
      }
    };
    fetchBusinessSettings();
  }, []);

  useEffect(() => {
    if (pdfListing) {
      const generatePdf = async () => {
        setIsGeneratingPdf(true);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const specSheetElement = document.getElementById('offscreen-spec-sheet');
        if (!specSheetElement) {
          toast.error("A apărut o eroare la generarea PDF-ului.");
          setIsGeneratingPdf(false);
          setPdfListing(null);
          return;
        }

        try {
          const canvas = await html2canvas(specSheetElement, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;

          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          pdf.save(`${pdfListing.title || 'spec-sheet'}.pdf`);
        } catch (error) {
          console.error("Eroare la generarea PDF-ului:", error);
          toast.error("A apărut o eroare la generarea PDF-ului.");
        } finally {
          setIsGeneratingPdf(false);
          setPdfListing(null);
        }
      };

      generatePdf();
    }
  }, [pdfListing]);

  const handleGeneratePdf = (listing: Listing) => {
    setPdfListing(listing);
  };

  const handleShowQrCode = (listing: Listing) => {
    setQrListing({ id: listing.id, slug: listing.slug });
    setQrModalOpen(true);
  };

  const handleDeleteListing = async (listingId: string, listingTitle: string) => {
    if (window.confirm(`Ești sigur că vrei să ștergi definitiv "${listingTitle}"?`)) {
        const promise = api.delete(`/listings/${listingId}`);

        toast.promise(promise, {
            loading: `Se șterge "${listingTitle}"...`,
            success: () => {
                refetch();
                return `"${listingTitle}" a fost șters cu succes.`;
            },
            error: (err) => {
                return "Nu s-a putut șterge anunțul. Te rugăm să încercați din nou.";
            }
        });
    }
  };

  const handleCloneListing = async (listingId: string) => {
    if (window.confirm("Ești sigur că vrei să clonezi acest anunț? Acesta va crea o copie nouă fără imagini.")) {
      const promise = api.post(`/listings/${listingId}/clone`);

      toast.promise(promise, {
        loading: 'Se clonează anunțul...',
        success: (response) => {
          const newListingId = response.data.id;
          navigate(`/listings/${newListingId}/edit`);
          return 'Anunțul a fost clonat cu succes! Ești redirecționat...';
        },
        error: "Eroare la clonarea anunțului.",
      });
    }
  };

  const handleOpenSoldModal = (listing: Listing) => {
    setSelectedListing(listing);
    setIsSoldModalOpen(true);
  };

  const handleExportExcel = () => {
    if (listings.length === 0) {
      toast.error("Nu există anunțuri de exportat.");
      return;
    }

    try {
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

      // Helper to escape CSV fields
      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '""';
        const clean = str.toString().replace(/"/g, '""');
        return `"${clean}"`;
      };

      const headers = [
        "Post Id",
        "Marca",
        "Model",
        "An",
        "Kilometraj",
        "Combustibil",
        "Cutie Viteze",
        "Capacitate Cilindrica",
        "Putere (CP)",
        "Pret",
        "image_link",
        "additional_image_link",
        "Availability",
        "Condition",
        "Titlu",
        "Descriere"
      ];

      const csvLines = [headers.join(",")];

      listings.forEach((listing) => {
        const id = listing.autovitId ? listing.autovitId.toString() : listing.id;
        
        // Extragere marca si model din titlu
        const titleWords = listing.title.trim().split(/\s+/);
        const marca = titleWords[0] || "";
        const model = titleWords[1] || "";

        const an = getAttrValue(listing, "An fabricație") || getAttrValue(listing, "An");
        const kilometraj = listing.mileage || getAttrValue(listing, "Kilometraj");
        const combustibil = getAttrValue(listing, "Combustibil");
        const cutie_viteze = getAttrValue(listing, "Transmisie") || getAttrValue(listing, "Cutie de viteze");
        const capacitate_cilindrica = getAttrValue(listing, "Capacitate cilindrică");
        const putere_cp = getAttrValue(listing, "Putere (CP)") || getAttrValue(listing, "Putere");
        
        // Build URL
        let link = businessSettings?.listingUrlPattern || "https://example.com/anunt/{id}";
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
        
        // Format price
        let finalPrice = "";
        if (listing.price) {
          finalPrice = `${listing.price} EUR`;
        } else {
          const priceVal = getAttrValue(listing, "Preț") || getAttrValue(listing, "Pret") || getAttrValue(listing, "price");
          if (priceVal) {
            finalPrice = `${priceVal} EUR`;
          }
        }

        const title = listing.title;
        const description = stripHtml(listing.description);

        const row = [
          escapeCsv(id),
          escapeCsv(marca),
          escapeCsv(model),
          escapeCsv(an),
          escapeCsv(kilometraj),
          escapeCsv(combustibil),
          escapeCsv(cutie_viteze),
          escapeCsv(capacitate_cilindrica),
          escapeCsv(putere_cp),
          escapeCsv(finalPrice),
          escapeCsv(imageLink),
          escapeCsv(additionalImageLinks),
          escapeCsv(availability),
          escapeCsv(condition),
          escapeCsv(title),
          escapeCsv(description)
        ];

        csvLines.push(row.join(","));
      });

      const csvContent = "sep=,\n" + csvLines.join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Trigger download
      const linkEl = document.createElement("a");
      const url = URL.createObjectURL(blob);
      linkEl.setAttribute("href", url);
      linkEl.setAttribute("download", `export-masini-${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);
      
      toast.success("Fișierul Excel (CSV) a fost descărcat cu succes!");
    } catch (error) {
      console.error("Eroare la exportul Excel:", error);
      toast.error("A apărut o eroare la exportul Excel.");
    }
  };


  const getStatusColor = (status: string) => {
    return status === "Activ" 
      ? "bg-success-light text-success border-success/20"
      : "bg-muted text-muted-foreground border-border";
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestionează Anunțurile</h1>
          <p className="text-muted-foreground mt-2">
            Vizualizează, editează și gestionează toate anunțurile de pe platforma ta.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportă Excel
          </Button>
          <Button
            onClick={() => setIsPreviewModalOpen(true)}
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto"
          >
            <Eye className="w-4 h-4 mr-2" />
            Previzualizează Feed
          </Button>
          <Button 
            onClick={() => navigate("/listings/new")}
            className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adaugă Anunț Nou
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-card-border bg-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută după titlu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Toate Anunțurile</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă anunțurile...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader className="hidden md:table-header-group">
                    <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Imagine</TableHead>
                    <TableHead className="text-foreground font-medium">Titlu</TableHead>
                    <TableHead className="text-foreground font-medium">Categorie</TableHead>
                    <TableHead className="text-foreground font-medium">Vizualizări</TableHead>
                    <TableHead className="text-foreground font-medium">Dată Creare</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                    <TableHead className="text-foreground font-medium">Autovit</TableHead>
                    <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="block md:table-row-group">
                    {filteredListings.map((listing) => (
                    <TableRow key={listing.id} className="block md:table-row mb-4 md:mb-0 border md:border-b rounded-lg md:rounded-none shadow-md md:shadow-none">
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none">
                            <span className="font-semibold text-foreground md:hidden">Imagine</span>
                            {listing.images && listing.images.length > 0 ? (
                                <img 
                                src={listing.images[0].url} 
                                alt={listing.title} 
                                className="w-16 h-16 object-cover rounded-md"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none font-medium text-foreground">
                            <span className="font-semibold text-foreground md:hidden">Titlu</span>
                            <span>{listing.title}</span>
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none text-muted-foreground">
                            <span className="font-semibold text-foreground md:hidden">Categorie</span>
                            <span>{listing.category.name}</span>
                        </TableCell>
                         <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none text-muted-foreground">
                            <span className="font-semibold text-foreground md:hidden">Vizualizări</span>
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                <span>{listing._count?.views ?? 0}</span>
                            </div>
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none text-muted-foreground">
                            <span className="font-semibold text-foreground md:hidden">Dată Creare</span>
                            <span>{format(new Date(listing.createdAt), "dd MMM yyyy")}</span>
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none">
                            <span className="font-semibold text-foreground md:hidden">Status</span>
                            <Badge className={getStatusColor(listing.status)}>
                                {listing.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none">
                            <span className="font-semibold text-foreground md:hidden">Autovit</span>
                            <AutovitStatusBadge 
                              autovitId={listing.autovitId ?? null} 
                              autovitStatus={listing.autovitStatus ?? null} 
                            />
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 md:text-right">
                             <span className="font-semibold text-foreground md:hidden">Acțiuni</span>
                             <ListingActionDropdown 
                                listing={listing}
                                onDelete={handleDeleteListing}
                                onClone={handleCloneListing}
                                onSold={handleOpenSoldModal}
                                onGeneratePdf={handleGeneratePdf}
                                onShowQr={handleShowQrCode}
                                isPdfLoading={isGeneratingPdf && pdfListing?.id === listing.id}
                             />
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedListing && (
        <MarkAsSoldModal
          isOpen={isSoldModalOpen}
          onClose={() => {
            setIsSoldModalOpen(false);
            setSelectedListing(null);
          }}
          listingId={selectedListing.id}
          listingTitle={selectedListing.title}
        />
      )}

      <QrCodeModal 
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        listingId={qrListing?.id || null}
        listingSlug={qrListing?.slug || null}
        urlPattern={businessSettings?.listingUrlPattern || null}
      />

      <CatalogPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        listings={listings}
        businessSettings={businessSettings}
      />

      {/* Hidden container for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
        <div id="offscreen-spec-sheet">
          {pdfListing && <PrintableSpecSheet listing={pdfListing} />}
        </div>
      </div>
    </div>
  );
};

export default Listings;
