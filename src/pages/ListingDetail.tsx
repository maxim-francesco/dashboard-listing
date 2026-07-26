import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-hot-toast";
import { differenceInDays, format } from "date-fns";
import { ro } from "date-fns/locale";
import { formatEur } from "@/lib/format";
import { 
  ArrowLeft, 
  Car, 
  Loader2, 
  Edit, 
  Globe, 
  Sparkles, 
  Megaphone, 
  Share2, 
  MoreHorizontal, 
  ChevronRight,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  RotateCw,
  Check
} from "lucide-react";

import api, {
  publishToAutovit,
  unpublishFromAutovit,
  publishToAutovitAndOLX,
  resetViewsForListing,
  createOffer,
  createContract,
  createReservation,
  reactivateListing,
  exposeTradeListing,
  cancelReservation
} from "@/services/api";

import ListingGallery from "@/components/listings/ListingGallery";
import ListingSpecs from "@/components/listings/ListingSpecs";
import PublishSheet from "@/components/listings/PublishSheet";
import MoreActionsSheet from "@/components/listings/MoreActionsSheet";

import MarkAsSoldModal from "@/components/modals/MarkAsSoldModal";
import DiagnoseListingModal from "@/components/modals/DiagnoseListingModal";
import MarketingModal from "@/components/modals/MarketingModal";
import ExposeTradeModal from "@/components/modals/ExposeTradeModal";
import QrCodeModal from "@/components/modals/QrCodeModal";
import GenerateOfferModal from "@/components/modals/GenerateOfferModal";
import GenerateContractModal, { ContractFormData } from "@/components/modals/GenerateContractModal";
import ReserveModal from "@/components/modals/ReserveModal";

import { PrintableSpecSheet } from "@/components/listings/PrintableSpecSheet";
import { PrintableOffer } from "@/components/listings/PrintableOffer";
import { PrintableContract } from "@/components/contracts/PrintableContract";

import { downloadImagesAsZip } from "@/utils/downloadImagesAsZip";

interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: {
    name: string;
  };
  createdAt: string;
  status: string;
  images?: { url: string }[];
  attributeValues: any[];
  _count?: {
    views: number;
    messages?: number;
  };
  autovitId?: string | null;
  autovitStatus?: string | null;
  price?: number;
  sellingPrice?: number;
  soldAt?: string | null;
  youtubeVideoId?: string | null;
  activeReservation?: {
    id: string;
    clientName: string;
    clientPhone: string;
    depositAmount: number;
    expiresAt: string;
  } | null;
}

interface Business {
  id: string;
  listingUrlPattern: string | null;
  name?: string;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyAddress?: string | null;
  companyCui?: string | null;
  companyRegCom?: string | null;
  companyLegalRep?: string | null;
}

const SkeletonDetail = () => (
  <div className="w-full max-w-[390px] mx-auto bg-background min-h-screen animate-pulse flex flex-col">
    <div className="w-full h-[220px] bg-muted shrink-0" />
    <div className="p-4 space-y-5 flex-1">
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-7 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-14 bg-muted rounded" />
        <div className="flex-1 h-14 bg-muted rounded" />
        <div className="flex-1 h-14 bg-muted rounded" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-[68px] bg-muted rounded" />
        <div className="flex-1 h-[68px] bg-muted rounded" />
        <div className="flex-1 h-[68px] bg-muted rounded" />
      </div>
      <div className="bg-card border border-border rounded-xl h-[300px]" />
    </div>
  </div>
);

export default function ListingDetail() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State controls for sheets and modals
  const [publishSheetOpen, setPublishSheetOpen] = useState(false);
  const [moreActionsSheetOpen, setMoreActionsSheetOpen] = useState(false);
  
  const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);
  const [isDiagnoseModalOpen, setIsDiagnoseModalOpen] = useState(false);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);
  const [isExposeModalOpen, setIsExposeModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);

  // States for publish actions loading indicators
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // Offscreen rendering states
  const [pdfListing, setPdfListing] = useState<Listing | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [offerRenderData, setOfferRenderData] = useState<null | {
    listing: Listing;
    offer: { clientName: string; offerPrice: number; listPrice: number | null; validityDays: number };
    clientPhone: string;
  }>(null);
  const [contractRenderData, setContractRenderData] = useState<null | {
    listing: Listing;
    form: ContractFormData;
    contractNumber: number | null;
  }>(null);

  // Fetch listing data
  const { data: listing, isLoading: isListingLoading, error: listingError } = useQuery<Listing>({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const response = await api.get(`/listings/${listingId}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
    retry: false
  });

  // Fetch business settings
  const { data: businessSettings } = useQuery<Business>({
    queryKey: ['business-me'],
    queryFn: async () => {
      const response = await api.get('/business/me');
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  // Handle Offscreen rendering effects
  useEffect(() => {
    if (pdfListing) {
      const generatePdf = async () => {
        setIsGeneratingPdf(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const specSheetElement = document.getElementById("offscreen-spec-sheet");
        if (!specSheetElement) {
          toast.error("A apărut o eroare la generarea PDF-ului.");
          setIsGeneratingPdf(false);
          setPdfListing(null);
          return;
        }

        try {
          const canvas = await html2canvas(specSheetElement, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;
          pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          pdf.save(`${pdfListing.title || "spec-sheet"}.pdf`);
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

  useEffect(() => {
    if (offerRenderData) {
      const generateOfferPdf = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const offerElement = document.getElementById("offscreen-offer");
        if (!offerElement) {
          toast.error("A apărut o eroare la generarea ofertei.");
          setOfferRenderData(null);
          return;
        }

        const photoUrl = (offerRenderData.listing as any)?.images?.[0]?.url || null;
        if (photoUrl) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            let settled = false;
            const done = () => {
              if (!settled) {
                settled = true;
                resolve();
              }
            };
            img.onload = done;
            img.onerror = done;
            img.src = photoUrl;
            setTimeout(done, 4000);
          });
        }

        try {
          const canvas = await html2canvas(offerElement, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;
          pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          const safeTitle = (offerRenderData.listing.title || "Oferta").replace(/[\/\\\s]+/g, "-");
          pdf.save(`Oferta-${offerRenderData.offer.clientName}-${safeTitle}.pdf`);

          const digitsOnly = offerRenderData.clientPhone.replace(/\D/g, "");
          let waPhone = digitsOnly;
          if (digitsOnly.startsWith("0")) {
            waPhone = "40" + digitsOnly.slice(1);
          } else if (!digitsOnly.startsWith("40") && digitsOnly.length > 0) {
            waPhone = digitsOnly;
          }

          let publicUrl: string | null = null;
          try {
            const created = await createOffer({
              listingId: offerRenderData.listing.id,
              clientName: offerRenderData.offer.clientName,
              clientPhone: offerRenderData.clientPhone,
              offerPrice: offerRenderData.offer.offerPrice,
              listPrice: offerRenderData.offer.listPrice,
              validityDays: offerRenderData.offer.validityDays,
            });
            publicUrl = created.publicUrl;
          } catch (err) {
            console.error("Nu s-a putut crea linkul public al ofertei:", err);
          }

          const firmName = businessSettings?.name ?? "";
          const messageText = publicUrl
            ? `Bună ziua! Oferta pentru ${offerRenderData.listing.title}: ${publicUrl} — valabilă ${offerRenderData.offer.validityDays} zile. ${firmName}`
            : `Bună ziua! Vă trimit oferta pentru ${offerRenderData.listing.title} la prețul de ${offerRenderData.offer.offerPrice} €, valabilă ${offerRenderData.offer.validityDays} zile. (Atașez documentul PDF.) — ${firmName}`;
          const encodedMsg = encodeURIComponent(messageText);
          const whatsappUrl = `https://wa.me/${waPhone}?text=${encodedMsg}`;
          window.open(whatsappUrl, "_blank");

          if (publicUrl) {
            const linkForToast = publicUrl;
            toast.success(
              (t) => (
                <span className="flex flex-col gap-1.5">
                  <span>Ofertă generată. Link public creat.</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(linkForToast);
                      toast.dismiss(t.id);
                      toast.success("Link copiat!");
                    }}
                    className="self-start bg-blue-600 hover:bg-blue-700 text-white border-none rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer"
                  >
                    Copiază link
                  </button>
                </span>
              ),
              { duration: 8000 }
            );
          } else {
            toast.success("Oferta a fost generată. Atașează PDF-ul descărcat în conversația WhatsApp.");
          }
        } catch (error) {
          console.error("Eroare la generarea ofertei PDF:", error);
          toast.error("A apărut o eroare la generarea ofertei.");
        } finally {
          setOfferRenderData(null);
        }
      };
      generateOfferPdf();
    }
  }, [offerRenderData, businessSettings]);

  useEffect(() => {
    if (contractRenderData) {
      const generateContractPdf = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const contractElement = document.getElementById("offscreen-contract");
        if (!contractElement) {
          toast.error("A apărut o eroare la generarea contractului.");
          setContractRenderData(null);
          return;
        }

        try {
          const canvas = await html2canvas(contractElement, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;
          pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          const buyerNameClean = (contractRenderData.form.buyerName || "client").replace(/[\/\\\s]+/g, "-");
          pdf.save(`Contract-${contractRenderData.contractNumber ?? "nou"}-${buyerNameClean}.pdf`);
          toast.success("Contractul PDF a fost generat și descărcat.");
        } catch (error) {
          console.error("Eroare la generarea contractului PDF:", error);
          toast.error("A apărut o eroare la generarea contractului.");
        } finally {
          setContractRenderData(null);
        }
      };
      generateContractPdf();
    }
  }, [contractRenderData]);

  // Loading / Error handler states
  if (isListingLoading) {
    return <SkeletonDetail />;
  }

  const is404 = listingError || !listing;
  if (is404) {
    return (
      <div className="w-full max-w-[390px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center select-none">
        <Car className="w-12 h-12 text-muted-foreground mb-3" />
        <h3 className="text-[17px] font-semibold text-foreground">Mașina nu a fost găsită.</h3>
        <Link to="/listings" className="text-sm text-primary hover:underline mt-2">
          Înapoi la mașini
        </Link>
      </div>
    );
  }

  // Identity helpers
  const getAttrValueByName = (name: string) => {
    const av = listing.attributeValues?.find(
      (item: any) => item.attribute?.name?.toLowerCase() === name.toLowerCase()
    );
    if (!av) return null;
    return av.stringValue ?? av.numberValue ?? (av.booleanValue ? "Da" : "Nu");
  };

  const mileageFormatted = listing.mileage !== undefined && listing.mileage !== null
    ? new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(listing.mileage) + " km"
    : null;

  const yearValue = getAttrValueByName("An");
  const fuelValue = getAttrValueByName("Combustibil");
  const gearboxValue = getAttrValueByName("Cutie de viteze");

  const identitySubtitle = [
    mileageFormatted,
    yearValue,
    fuelValue,
    gearboxValue
  ].filter(Boolean).join(" · ");

  // Figures computations
  const daysInStock = differenceInDays(new Date(), new Date(listing.createdAt));
  const viewCount = listing._count?.views !== undefined ? listing._count.views : "—";
  const leadsCount = listing._count?.messages !== undefined ? listing._count.messages : "—";

  const getDaysColorClass = (days: number) => {
    if (days >= 90) return "text-destructive";
    if (days >= 45) return "text-warning";
    return "text-foreground";
  };

  // Action handlers
  const handlePublishAutovit = async () => {
    try {
      setIsPublishing(true);
      await publishToAutovitAndOLX(listing.id);
      toast.success("Anunțul a fost trimis spre publicare.");
      queryClient.invalidateQueries({ queryKey: ['listing', listing.id] });
    } catch (error) {
      toast.error("Eroare la publicare.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishAutovit = async () => {
    try {
      setIsUnpublishing(true);
      await unpublishFromAutovit(listing.id);
      toast.success("Anunțul a fost dezactivat pe Autovit.");
      queryClient.invalidateQueries({ queryKey: ['listing', listing.id] });
    } catch (error) {
      toast.error("Eroare la dezactivare.");
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleOfferSubmit = (data: { clientName: string; clientPhone: string; offerPrice: number; validityDays: number }) => {
    setOfferRenderData({
      listing,
      offer: {
        clientName: data.clientName,
        offerPrice: data.offerPrice,
        listPrice: listing.price ?? null,
        validityDays: data.validityDays,
      },
      clientPhone: data.clientPhone,
    });
  };

  const handleContractSubmit = async (form: ContractFormData) => {
    try {
      const created = await createContract({
        listingId: listing.id,
        buyerType: form.buyerType,
        buyerName: form.buyerName,
        buyerAddress: form.buyerAddress || undefined,
        buyerPhone: form.buyerPhone || undefined,
        buyerEmail: form.buyerEmail || undefined,
        buyerCnp: form.buyerCnp || undefined,
        buyerCiSeries: form.buyerCiSeries || undefined,
        buyerCiNumber: form.buyerCiNumber || undefined,
        buyerCui: form.buyerCui || undefined,
        buyerRegCom: form.buyerRegCom || undefined,
        buyerLegalRep: form.buyerLegalRep || undefined,
        salePrice: form.salePrice,
        saleDate: form.saleDate,
        plateNumber: form.plateNumber || undefined,
        mileageAtSale: form.mileageAtSale,
        clauses: form.clauses || undefined,
      });
      setContractRenderData({ listing, form, contractNumber: created.contractNumber });
      toast.success(`Contract #${created.contractNumber} salvat. Se generează PDF-ul...`);
    } catch (err) {
      console.error("Eroare la salvarea contractului:", err);
      toast.error("Nu s-a putut salva contractul.");
    }
  };

  const handleReserveSubmit = async (data: { clientName: string; clientPhone: string; depositAmount: number; reservationDays: number }) => {
    try {
      await createReservation({ listingId: listing.id, ...data });
      toast.success("Mașina a fost rezervată.");
      queryClient.invalidateQueries({ queryKey: ['listing', listing.id] });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Nu s-a putut crea rezervarea.");
    }
  };

  const handleReactivate = async () => {
    if (window.confirm(`Vrei să reactivezi anunțul "${listing.title}"?`)) {
      try {
        await reactivateListing(listing.id);
        toast.success(`Anunțul "${listing.title}" a fost reactivat!`);
        queryClient.invalidateQueries({ queryKey: ['listing', listing.id] });
      } catch (error) {
        toast.error("Nu s-a putut reactiva anunțul.");
      }
    }
  };

  const handleCancelReservation = async () => {
    if (!listing.activeReservation?.id) return;
    const clientName = listing.activeReservation.clientName;
    const avans = formatEur(listing.activeReservation.depositAmount);
    
    if (window.confirm(`Anulezi rezervarea lui ${clientName}? Mașina revine la vânzare, iar avansul de ${avans} nu mai apare în evidență.`)) {
      try {
        await cancelReservation(listing.activeReservation.id);
        toast.success("Rezervare anulată. Mașina este din nou la vânzare.");
        queryClient.invalidateQueries({ queryKey: ['listing', listing.id] });
        queryClient.invalidateQueries({ queryKey: ['listings'] });
        queryClient.invalidateQueries({ queryKey: ['soldListings'] });
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        queryClient.invalidateQueries({ queryKey: ['reservationsForDashboard'] });
      } catch (e: any) {
        console.error(e);
        toast.error(e?.response?.data?.message || "Nu s-a putut anula rezervarea.");
      }
    }
  };


  const handleCloneListing = async () => {
    if (window.confirm("Ești sigur că vrei să clonezi acest anunț? Acesta va crea o copie nouă fără imagini.")) {
      const promise = api.post(`/listings/${listing.id}/clone`);
      toast.promise(promise, {
        loading: "Se clonează anunțul...",
        success: (response) => {
          const newListingId = response.data.id;
          navigate(`/listings/${newListingId}/edit`);
          return "Anunțul a fost clonat cu succes! Ești redirecționat...";
        },
        error: "Eroare la clonarea anunțului.",
      });
    }
  };

  const handleResetViews = async () => {
    if (window.confirm("Ești sigur că vrei să resetezi vizualizările pentru acest anunț?")) {
      try {
        await resetViewsForListing(listing.id);
        toast.success("Vizualizările au fost resetate.");
        queryClient.invalidateQueries({ queryKey: ['listing', listing.id] });
      } catch (error) {
        toast.error("Nu s-au putut reseta vizualizările.");
      }
    }
  };

  const handleDeleteListing = async () => {
    if (window.confirm(`Ești sigur că vrei să ștergi definitiv "${listing.title}"?`)) {
      const promise = api.delete(`/listings/${listing.id}`);
      toast.promise(promise, {
        loading: `Se șterge "${listing.title}"...`,
        success: () => {
          navigate("/listings");
          return `"${listing.title}" a fost șters cu succes.`;
        },
        error: () => "Nu s-a putut șterge anunțul. Te rugăm să încercați din nou.",
      });
    }
  };

  const handleExposeTradeSubmit = async (values: { b2bPrice: number | null; acceptsTrade: boolean; note?: string | null }) => {
    try {
      await exposeTradeListing({
        listingId: listing.id,
        b2bPrice: values.b2bPrice,
        acceptsTrade: values.acceptsTrade,
        note: values.note
      });
      toast.success("Mașina a fost expusă în rețea.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Nu s-a putut expune mașina în rețea.");
    }
  };

  const handleDownloadZip = async () => {
    if (!listing.images || listing.images.length === 0) {
      toast.error("Anunțul nu are poze.");
      return;
    }
    toast.loading("Se pregătește arhiva...", { id: "zip-toast" });
    try {
      await downloadImagesAsZip(listing.images, listing.title || "anunt");
      toast.success("Arhiva a fost descărcată cu succes!", { id: "zip-toast" });
    } catch (error) {
      toast.error("A apărut o eroare la descărcarea imaginilor.", { id: "zip-toast" });
    }
  };

  // Primary Actions configuration by Status
  const renderPrimaryActions = () => {
    const status = listing.status;

    if (status === "AVAILABLE" || status === "INCOMING") {
      return (
        <div className="flex gap-2 w-full select-none">
          <button
            onClick={() => setOfferModalOpen(true)}
            className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-medium min-h-[52px]"
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>Ofertă</span>
          </button>
          <button
            onClick={() => setReserveModalOpen(true)}
            className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border-strong text-foreground text-xs font-medium min-h-[52px]"
          >
            <Calendar className="w-5 h-5 shrink-0" />
            <span>Rezervă</span>
          </button>
          <button
            onClick={() => setIsSoldModalOpen(true)}
            className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border-strong text-foreground text-xs font-medium min-h-[52px]"
          >
            <Check className="w-5 h-5 shrink-0" />
            <span>Vândut</span>
          </button>
        </div>
      );
    }

    if (status === "RESERVED") {
      return (
        <div className="flex gap-2 w-full select-none">
          <button
            onClick={() => setOfferModalOpen(true)}
            className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-medium min-h-[52px]"
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>Ofertă</span>
          </button>
          <button
            onClick={() => setIsSoldModalOpen(true)}
            className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border-strong text-foreground text-xs font-medium min-h-[52px]"
          >
            <Check className="w-5 h-5 shrink-0" />
            <span>Vândut</span>
          </button>
        </div>
      );
    }

    if (status === "SOLD") {
      return (
        <div className="flex gap-2 w-full select-none">
          <button
            onClick={() => navigate("/contracts")}
            className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border-strong text-foreground text-xs font-medium min-h-[52px]"
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>Vezi contractul</span>
          </button>
          <button
            onClick={handleReactivate}
            className="flex-1 rounded-[var(--radius)] py-3 flex flex-col items-center justify-center gap-1 bg-card border border-border-strong text-foreground text-xs font-medium min-h-[52px]"
          >
            <RotateCw className="w-5 h-5 shrink-0" />
            <span>Reactivează</span>
          </button>
          <div className="flex-1 py-3 flex flex-col items-center justify-center text-muted-foreground text-xs font-medium min-h-[52px]">
            —
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full max-w-[390px] mx-auto bg-background min-h-screen flex flex-col pb-20 overflow-x-hidden">
      {/* 1. Gallery */}
      <ListingGallery images={listing.images} title={listing.title} />

      {/* 2. Listing Information and Actions */}
      <div className="p-4 space-y-5 flex-1">
        {/* (a) IDENTITY */}
        <div className="space-y-1 text-left">
          <h1 className="text-[19px] font-semibold text-foreground leading-tight">
            {listing.title}
          </h1>
          <div className="text-[22px] font-semibold text-foreground leading-none pt-1">
            {new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(listing.price || 0)} €
          </div>
          {identitySubtitle && (
            <div className="text-sm text-muted-foreground pt-1.5 leading-snug">
              {identitySubtitle}
            </div>
          )}
        </div>

        {/* (b) THREE FIGURES */}
        <div className="flex gap-2 select-none">
          <div className="flex-1 bg-card border border-border rounded-[var(--radius)] p-2.5 text-center flex flex-col justify-between">
            <span className={`text-[17px] font-semibold ${getDaysColorClass(daysInStock)}`}>
              {daysInStock}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-0.5">
              zile în stoc
            </span>
          </div>
          <div className="flex-1 bg-card border border-border rounded-[var(--radius)] p-2.5 text-center flex flex-col justify-between">
            <span className="text-[17px] font-semibold text-foreground">
              {viewCount}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-0.5">
              vizualizări
            </span>
          </div>
          <div className="flex-1 bg-card border border-border rounded-[var(--radius)] p-2.5 text-center flex flex-col justify-between">
            <span className="text-[17px] font-semibold text-foreground">
              {leadsCount}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-0.5">
              lead-uri
            </span>
          </div>
        </div>

        {/* (c) PRIMARY ACTIONS */}
        {listing.status === "RESERVED" && listing.activeReservation && (
          <div className="border border-border rounded-[var(--radius)] p-3 text-[13px] text-foreground bg-card select-none">
            <div>Rezervată de {listing.activeReservation.clientName}</div>
            <div className="text-muted-foreground mt-0.5">
              {formatEur(listing.activeReservation.depositAmount)} avans · expiră {format(new Date(listing.activeReservation.expiresAt), "dd MMM yyyy", { locale: ro })}
            </div>
          </div>
        )}
        {renderPrimaryActions()}

        {/* (d) ACTION LIST */}
        <div className="bg-card border border-border rounded-xl overflow-hidden select-none">
          {/* Edit */}
          <Link
            to={`/listings/${listing.id}/edit`}
            className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 transition-colors w-full cursor-pointer min-h-[44px]"
          >
            <Edit className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="flex-1 text-[15px] font-medium text-foreground text-left">Editează anunțul</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </Link>

          {/* Publicare */}
          <button
            onClick={() => setPublishSheetOpen(true)}
            className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
          >
            <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="flex-1 text-[15px] font-medium text-foreground">Publicare</span>
            <div className="flex items-center gap-2">
              {listing.autovitStatus === "active" ? (
                <span className="bg-success-light text-success font-medium text-xs rounded-full px-2.5 py-0.5">
                  Pe Autovit
                </span>
              ) : (
                <span className="bg-muted text-muted-foreground font-medium text-xs rounded-full px-2.5 py-0.5">
                  Nepublicată
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </button>

          {/* AI Diagnose */}
          <button
            onClick={() => setIsDiagnoseModalOpen(true)}
            className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
          >
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <span className="flex-1 text-[15px] font-medium text-foreground">De ce nu se vinde?</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          {/* Marketing Texts */}
          <button
            onClick={() => setIsMarketingModalOpen(true)}
            className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
          >
            <Megaphone className="w-5 h-5 text-primary shrink-0" />
            <span className="flex-1 text-[15px] font-medium text-foreground">Texte de promovare</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          {/* B2B Expose Trade */}
          <button
            onClick={() => setIsExposeModalOpen(true)}
            className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
          >
            <Share2 className="w-5 h-5 text-primary shrink-0" />
            <span className="flex-1 text-[15px] font-medium text-foreground">Expune la schimb în rețea</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          {/* More Actions */}
          <button
            onClick={() => setMoreActionsSheetOpen(true)}
            className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-accent/40 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
          >
            <MoreHorizontal className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="flex-1 text-[15px] font-medium text-foreground">Altele</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          {/* Cancel Reservation */}
          {listing.status === "RESERVED" && listing.activeReservation && (
            <button
              onClick={handleCancelReservation}
              className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-destructive/5 border-t border-border transition-colors w-full cursor-pointer text-left min-h-[44px]"
            >
              <XCircle className="w-5 h-5 text-destructive shrink-0" />
              <span className="flex-1 text-[15px] font-medium text-destructive">Anulează rezervarea</span>
              <ChevronRight className="w-5 h-5 text-destructive shrink-0" />
            </button>
          )}
        </div>

        {/* (e) SPECS */}
        <ListingSpecs attributeValues={listing.attributeValues} />
      </div>

      {/* Sheets Overlay */}
      <PublishSheet
        open={publishSheetOpen}
        onOpenChange={setPublishSheetOpen}
        autovitStatus={listing.autovitStatus ?? null}
        onPublishAutovit={handlePublishAutovit}
        onUnpublishAutovit={handleUnpublishAutovit}
        onShowQrCode={() => setQrModalOpen(true)}
        onGeneratePdf={() => setPdfListing(listing)}
        onDownloadZip={handleDownloadZip}
        isPublishing={isPublishing}
        isUnpublishing={isUnpublishing}
        isGeneratingPdf={isGeneratingPdf}
      />

      <MoreActionsSheet
        open={moreActionsSheetOpen}
        onOpenChange={setMoreActionsSheetOpen}
        onCloneListing={handleCloneListing}
        onResetViews={handleResetViews}
        onDeleteListing={handleDeleteListing}
      />

      {/* Modals area */}
      <MarkAsSoldModal
        isOpen={isSoldModalOpen}
        onClose={() => setIsSoldModalOpen(false)}
        listingId={listing.id}
        listingTitle={listing.title}
      />

      <DiagnoseListingModal
        isOpen={isDiagnoseModalOpen}
        onClose={() => setIsDiagnoseModalOpen(false)}
        listingId={listing.id}
        listingTitle={listing.title}
      />

      <MarketingModal
        isOpen={isMarketingModalOpen}
        onClose={() => setIsMarketingModalOpen(false)}
        listingId={listing.id}
      />

      <ExposeTradeModal
        isOpen={isExposeModalOpen}
        onClose={() => setIsExposeModalOpen(false)}
        listing={{
          listingId: listing.id,
          title: listing.title,
          price: listing.price ?? null,
          image: listing.images?.[0]?.url ?? null,
          daysInStock: daysInStock,
          isExposed: false,
          tradeStatus: null,
          make: getAttrValueByName("Marca"),
          model: getAttrValueByName("Model"),
          year: yearValue ? Number(yearValue) : null,
          mileage: listing.mileage ?? null
        }}
        mode="create"
        onSubmit={handleExposeTradeSubmit}
      />

      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        listingId={listing.id}
        listingSlug={listing.slug}
        urlPattern={businessSettings?.listingUrlPattern ?? null}
      />

      <GenerateOfferModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        listing={listing}
        onGenerate={handleOfferSubmit}
      />

      <GenerateContractModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        listing={listing}
        onGenerate={handleContractSubmit}
      />

      <ReserveModal
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        listing={listing}
        onSubmit={handleReserveSubmit}
      />

      {/* Hidden container for PDF generation */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1 }}>
        <div id="offscreen-spec-sheet">
          {pdfListing && <PrintableSpecSheet listing={pdfListing} />}
        </div>
        <div id="offscreen-offer">
          {offerRenderData && (
            <PrintableOffer
              listing={offerRenderData.listing}
              business={businessSettings}
              offer={offerRenderData.offer}
            />
          )}
        </div>
        <div id="offscreen-contract">
          {contractRenderData && (
            <PrintableContract
              listing={contractRenderData.listing}
              business={businessSettings}
              contract={{
                buyerType: contractRenderData.form.buyerType,
                buyerName: contractRenderData.form.buyerName,
                buyerAddress: contractRenderData.form.buyerAddress,
                buyerPhone: contractRenderData.form.buyerPhone,
                buyerEmail: contractRenderData.form.buyerEmail,
                buyerCnp: contractRenderData.form.buyerCnp,
                buyerCiSeries: contractRenderData.form.buyerCiSeries,
                buyerCiNumber: contractRenderData.form.buyerCiNumber,
                buyerCui: contractRenderData.form.buyerCui,
                buyerRegCom: contractRenderData.form.buyerRegCom,
                buyerLegalRep: contractRenderData.form.buyerLegalRep,
                salePrice: contractRenderData.form.salePrice,
                saleDate: contractRenderData.form.saleDate,
                plateNumber: contractRenderData.form.plateNumber,
                mileageAtSale: contractRenderData.form.mileageAtSale,
                clauses: contractRenderData.form.clauses,
                contractNumber: contractRenderData.contractNumber,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
