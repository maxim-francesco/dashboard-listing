
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
import { Plus, Edit, Trash2, Search, Loader2, ImageIcon, Eye, MoreHorizontal, ClipboardCheck, Copy, FileText, QrCode, Upload, EyeOff } from "lucide-react";
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
  unpublishFromAutovit 
} from "@/services/api";
import MarkAsSoldModal from "@/components/modals/MarkAsSoldModal";
import { PrintableSpecSheet } from "@/components/listings/PrintableSpecSheet";
import QrCodeModal from "@/components/modals/QrCodeModal";
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

  useEffect(() => {
    if (isOpen && listing.id) {
      getAutovitStatus(listing.id)
        .then(res => {
          setAutovitStatus(res.data.autovitStatus);
          setAutovitId(res.data.autovitId);
        })
        .catch(() => {});
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
        
        <Button 
          onClick={() => navigate("/listings/new")}
          className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adaugă Anunț Nou
        </Button>
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
