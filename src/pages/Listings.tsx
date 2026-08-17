import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { MoreVertical, Search, Plus, Car, Loader2, FileText, ChevronRight } from "lucide-react";
import { roCount } from "@/lib/plural";
import { formatEur } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import api, {
  getAutovitStatus,
  publishToAutovitAndOLX,
  unpublishFromAutovit,
  resetViewsForListing,
  createOffer,
  createContract,
  createReservation,
  getSoldListings,
  reactivateListing
} from "@/services/api";
import MarkAsSoldModal from "@/components/modals/MarkAsSoldModal";
import DiagnoseListingModal from "@/components/modals/DiagnoseListingModal";
import { PrintableSpecSheet } from "@/components/listings/PrintableSpecSheet";
import QrCodeModal from "@/components/modals/QrCodeModal";
import CatalogPreviewModal from "@/components/modals/CatalogPreviewModal";
import { PrintableOffer } from "@/components/listings/PrintableOffer";
import GenerateOfferModal from "@/components/modals/GenerateOfferModal";
import GenerateContractModal, { ContractFormData } from "@/components/modals/GenerateContractModal";
import { PrintableContract } from "@/components/contracts/PrintableContract";
import ReserveModal from "@/components/modals/ReserveModal";
import ListingCard from "@/components/listings/ListingCard";
import { waLink } from "@/utils/phone";

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

const ListingCardSkeleton = () => (
  <>
    <div className="bg-card border border-border rounded-xl p-2.5 flex gap-3 animate-pulse lg:hidden">
      <div className="w-[96px] h-[72px] bg-muted rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-5 bg-muted rounded w-1/4" />
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-4 bg-muted rounded w-12" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
      </div>
    </div>

    <div className="hidden lg:flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-1.5 animate-pulse w-full">
      <div className="w-16 h-[40px] bg-muted rounded shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
      <div className="w-32 shrink-0 flex justify-end">
        <div className="h-4 bg-muted rounded w-16" />
      </div>
      <div className="w-28 shrink-0 flex justify-center">
        <div className="h-5 bg-muted rounded-full w-14" />
      </div>
      <div className="w-24 shrink-0 flex justify-end">
        <div className="h-4 bg-muted rounded w-8" />
      </div>
      <div className="w-20 shrink-0 flex justify-end">
        <div className="h-4 bg-muted rounded w-6" />
      </div>
    </div>
  </>
);

interface ListingsProps {
  initialSegment?: "instoc" | "vandute";
}

const Listings = ({ initialSegment }: ListingsProps) => {
  const [activeSegment, setActiveSegment] = useState<"instoc" | "vandute">(initialSegment ?? "instoc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);
  const [isDiagnoseModalOpen, setIsDiagnoseModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const [pdfListing, setPdfListing] = useState<Listing | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [offerModalListing, setOfferModalListing] = useState<Listing | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerRenderData, setOfferRenderData] = useState<null | {
    listing: Listing;
    offer: { clientName: string; offerPrice: number; listPrice: number | null; validityDays: number };
    clientPhone: string;
  }>(null);

  const [contractModalListing, setContractModalListing] = useState<Listing | null>(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [reserveModalListing, setReserveModalListing] = useState<Listing | null>(null);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [contractRenderData, setContractRenderData] = useState<null | {
    listing: Listing;
    form: ContractFormData;
    contractNumber: number | null;
  }>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrListing, setQrListing] = useState<{ id: string; slug: string } | null>(null);
  const [businessSettings, setBusinessSettings] = useState<Business | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialSegment) setActiveSegment(initialSegment);
  }, [initialSegment]);

  // "În stoc" segment query (AVAILABLE + RESERVED + INCOMING)
  const { data: inStockListings = [], isLoading: isInStockLoading, refetch: refetchInStock } = useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      const response = await api.get("/listings");
      const listingsWithStatus = response.data.map((listing: any) => ({
        ...listing,
        status: listing.status ?? "AVAILABLE",
      }));
      return listingsWithStatus;
    },
    refetchOnWindowFocus: false,
  });

  // "Vândute" segment query (SOLD)
  const { data: soldListings = [], isLoading: isSoldLoading, refetch: refetchSold } = useQuery<Listing[]>({
    queryKey: ["soldListings"],
    queryFn: async () => {
      const response = await getSoldListings();
      return response.map((listing: any) => ({
        ...listing,
        status: listing.status ?? "SOLD",
      }));
    },
    refetchOnWindowFocus: false,
  });

  const listings = inStockListings; // For compatibility with Excel exporter and Preview Modal
  const isLoading = activeSegment === "instoc" ? isInStockLoading : isSoldLoading;

  // G3.a money panel calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthSoldListings = soldListings.filter((listing) => {
    if (!listing.soldAt) return false;
    const soldDate = new Date(listing.soldAt);
    return soldDate.getFullYear() === currentYear && soldDate.getMonth() === currentMonth;
  });

  const totalCurrentMonthCount = currentMonthSoldListings.length;

  const listingsWithProfit = currentMonthSoldListings.filter(
    (l) => l.sellingPrice !== null && l.sellingPrice !== undefined && l.purchasePrice !== null && l.purchasePrice !== undefined
  );

  const profitCount = listingsWithProfit.length;

  const profitSum = listingsWithProfit.reduce((sum, l) => {
    const sell = l.sellingPrice || 0;
    const buy = l.purchasePrice || 0;
    const extra = l.otherCosts || 0;
    return sum + (sell - buy - extra);
  }, 0);

  let panelBgClass = "bg-muted";
  let panelTextClass = "text-foreground";

  if (profitCount > 0) {
    if (profitSum > 0) {
      panelBgClass = "bg-success-light";
      panelTextClass = "text-success";
    } else if (profitSum < 0) {
      panelBgClass = "bg-destructive/10";
      panelTextClass = "text-destructive";
    }
  }

  const renderLine2 = () => {
    const carsText = roCount(totalCurrentMonthCount, "mașină", "mașini");
    if (profitCount === 0) {
      return carsText;
    }
    return `${formatEur(profitSum)} · ${carsText}`;
  };

  const showLine3 = profitCount > 0 && profitCount < totalCurrentMonthCount;

  const unrecordedSalesCount = soldListings.filter((l) => !l.soldAt).length;

  const refetch = () => {
    refetchInStock();
    refetchSold();
  };

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await api.get<Business>("/business/me");
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
          const whatsappUrl = waLink(offerRenderData.clientPhone, messageText);
          if (whatsappUrl) {
            window.open(whatsappUrl, "_blank");
          } else {
            toast.error("Numarul de telefon al clientului nu este valid — oferta a fost creata, dar nu am putut deschide WhatsApp.");
          }

          if (publicUrl) {
            const linkForToast = publicUrl;
            toast.success(
              (t) => (
                <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span>Ofertă generată. Link public creat.</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(linkForToast);
                      toast.dismiss(t.id);
                      toast.success("Link copiat!");
                    }}
                    style={{
                      alignSelf: "flex-start",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
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

  const handleGeneratePdf = (listing: Listing) => {
    setPdfListing(listing);
  };

  const handleOpenOfferModal = (listing: Listing) => {
    setOfferModalListing(listing);
    setOfferModalOpen(true);
  };

  const handleOpenContractModal = (listing: Listing) => {
    setContractModalListing(listing);
    setContractModalOpen(true);
  };

  const handleContractSubmit = async (form: ContractFormData) => {
    if (!contractModalListing) return;
    try {
      const created = await createContract({
        listingId: contractModalListing.id,
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
      setContractRenderData({ listing: contractModalListing, form, contractNumber: created.contractNumber });
      toast.success(`Contract #${created.contractNumber} salvat. Se generează PDF-ul...`);
    } catch (err) {
      console.error("Eroare la salvarea contractului:", err);
      toast.error("Nu s-a putut salva contractul.");
    }
  };

  const handleOfferSubmit = (data: { clientName: string; clientPhone: string; offerPrice: number; validityDays: number }) => {
    const listPrice = (offerModalListing as any)?.price ?? null;
    setOfferRenderData({
      listing: offerModalListing!,
      offer: {
        clientName: data.clientName,
        offerPrice: data.offerPrice,
        listPrice,
        validityDays: data.validityDays,
      },
      clientPhone: data.clientPhone,
    });
  };

  const handleOpenReserve = (listing: Listing) => {
    setReserveModalListing(listing);
    setReserveModalOpen(true);
  };

  const handleReserveSubmit = async (data: { clientName: string; clientPhone: string; depositAmount: number; reservationDays: number }) => {
    if (!reserveModalListing) return;
    try {
      await createReservation({ listingId: reserveModalListing.id, ...data });
      toast.success("Mașina a fost rezervată.");
      refetch();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Nu s-a putut crea rezervarea.");
    }
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
        },
      });
    }
  };

  const handleCloneListing = async (listingId: string) => {
    if (window.confirm("Ești sigur că vrei să clonezi acest anunț? Acesta va crea o copie nouă fără imagini.")) {
      const promise = api.post(`/listings/${listingId}/clone`);

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

  const handleOpenSoldModal = (listing: Listing) => {
    setSelectedListing(listing);
    setIsSoldModalOpen(true);
  };

  const handleOpenDiagnose = (listing: Listing) => {
    setSelectedListing(listing);
    setIsDiagnoseModalOpen(true);
  };

  const handleReactivate = async (listing: Listing) => {
    if (window.confirm(`Vrei să reactivezi anunțul "${listing.title}"?`)) {
      try {
        await reactivateListing(listing.id);
        toast.success(`Anunțul "${listing.title}" a fost reactivat!`);
        refetch();
      } catch (error) {
        toast.error("Nu s-a putut reactiva anunțul.");
      }
    }
  };

  const handleExportExcel = () => {
    if (listings.length === 0) {
      toast.error("Nu există anunțuri de exportat.");
      return;
    }

    try {
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

      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '""';
        const clean = str.toString().replace(/"/g, '""');
        return `"${clean}"`;
      };

      const headers = [
        "Link",
        "ID",
        "Marca",
        "Model",
        "Year",
        "Mileage",
        "Fuel_Type",
        "Transmise",
        "Capacitate Cilindrica",
        "Putere (CP)",
        "Price",
        "image_link",
        "additional_image",
        "Availability",
        "Condition",
        "Title",
        "Description",
        "quantity_to_sell_on_facebook",
      ];

      const csvLines = [headers.join(";")];

      listings.forEach((listing) => {
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
          const priceVal = getAttrValue(listing, "Preț") || getAttrValue(listing, "Pret") || getAttrValue(listing, "price");
          if (priceVal) {
            finalPrice = `${priceVal} EUR`;
          }
        }

        const title = listing.title;
        const description = stripHtml(listing.description);

        const row = [
          escapeCsv(link),
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
          escapeCsv(description),
          escapeCsv("1"),
        ];

        csvLines.push(row.join(";"));
      });

      const csvContent = csvLines.join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

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

  const currentListings = activeSegment === "instoc" ? inStockListings : soldListings;
  const filteredListings = currentListings
    .filter((listing) =>
      listing.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const renderEmptyState = () => {
    if (activeSegment === "instoc") {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Car className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="text-[15px] font-medium text-foreground">Nicio mașină în stoc.</h3>
          <p className="text-xs text-muted-foreground mt-1">Adaugă prima mașină din butonul +</p>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Car className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="text-[15px] font-medium text-foreground">Nicio mașină vândută încă.</h3>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4 max-w-[390px] mx-auto md:max-w-full">
      {/* Back to hub */}
      <div className="px-1 pt-1">
        <Link to="/listings" className="inline-flex items-center text-[13px] text-primary hover:underline">
          ← Toate categoriile
        </Link>
      </div>
      {/* (a) Header row */}
      <div className="flex justify-between items-center py-2 px-1">
        <h1 className="text-[20px] font-semibold text-foreground">{activeSegment === "instoc" ? "În stoc" : "Vândute"}</h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-11 h-11 p-0 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0"
            >
              <MoreVertical className="h-5 w-5 text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border min-w-[160px]">
            <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
              Exportă Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsPreviewModalOpen(true)} className="cursor-pointer">
              Previzualizează feed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* (b) Search input */}
      <div className="relative w-full px-1">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Caută marcă, model, an"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border rounded-[var(--radius)] w-full py-6 focus:ring-0 focus:border-border text-[15px]"
        />
      </div>



      {activeSegment === "vandute" && (
        <div className="px-1 space-y-2.5">
          {/* Money Panel */}
          <div
            onClick={() => navigate("/reports")}
            className={`w-full border border-border rounded-xl p-3 flex flex-col justify-center cursor-pointer min-h-[52px] select-none ${panelBgClass} ${panelTextClass}`}
          >
            <div className="text-[13px] opacity-70">Luna asta</div>
            <div className="text-[22px] font-semibold leading-tight">
              {renderLine2()}
            </div>
            {showLine3 && (
              <div className="text-[12px] opacity-70 mt-0.5">
                profit calculat pe {profitCount} din {roCount(totalCurrentMonthCount, "mașină", "mașini")}
              </div>
            )}
            {unrecordedSalesCount > 0 && (
              <div className="text-[12px] opacity-70 mt-0.5">
                {roCount(unrecordedSalesCount, "mașină vândută", "mașini vândute")} {unrecordedSalesCount === 1 ? "nu are" : "nu au"} data salvată
              </div>
            )}
          </div>

          {/* Documents Row */}
          <Link
            to="/contracts"
            className="flex items-center gap-3 px-3.5 py-4 hover:bg-accent/40 transition-colors w-full cursor-pointer min-h-[52px] bg-card border border-border rounded-xl select-none"
          >
            <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-grow min-w-0 flex flex-col text-left">
              <span className="text-[15px] font-medium text-foreground leading-snug">
                Toate actele
              </span>
              <span className="text-[12px] text-muted-foreground truncate leading-normal">
                Contracte și procese-verbale
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </Link>
        </div>
      )}

      {/* (d) List Body */}
      <div className="px-1">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            <ListingCardSkeleton />
            <ListingCardSkeleton />
            <ListingCardSkeleton />
          </div>
        ) : filteredListings.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <div className="hidden lg:flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground px-3 py-2 font-medium select-none border border-transparent">
              <div className="w-16 shrink-0" />
              <div className="flex-1 min-w-0">Mașină</div>
              <div className="w-32 shrink-0 text-right">Preț</div>
              <div className="w-28 shrink-0 text-center">Status</div>
              <div className="w-24 shrink-0 text-right">Viz.</div>
              <div className="w-20 shrink-0 text-right">Lead-uri</div>
            </div>
            <div className="flex flex-col gap-2.5 lg:gap-1 pb-20">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  segment={activeSegment}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals and PDFs */}
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

      <DiagnoseListingModal
        isOpen={isDiagnoseModalOpen}
        onClose={() => {
          setIsDiagnoseModalOpen(false);
          setSelectedListing(null);
        }}
        listingId={selectedListing?.id || null}
        listingTitle={selectedListing?.title || ""}
      />

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

      <GenerateOfferModal
        isOpen={offerModalOpen}
        onClose={() => {
          setOfferModalOpen(false);
          setOfferModalListing(null);
        }}
        listing={offerModalListing}
        onGenerate={handleOfferSubmit}
      />

      <GenerateContractModal
        isOpen={contractModalOpen}
        onClose={() => {
          setContractModalOpen(false);
          setContractModalListing(null);
        }}
        listing={contractModalListing}
        onGenerate={handleContractSubmit}
      />

      <ReserveModal
        isOpen={reserveModalOpen}
        onClose={() => {
          setReserveModalOpen(false);
          setReserveModalListing(null);
        }}
        listing={reserveModalListing}
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
};

export default Listings;
