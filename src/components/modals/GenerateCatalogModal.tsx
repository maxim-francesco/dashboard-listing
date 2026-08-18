import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Car,
  Coins,
  Truck,
  FileDown,
  Loader2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import api, { getStockCounts } from "@/services/api";
import {
  generateCatalogPdf,
  CatalogViewMode,
} from "@/services/catalogPdfGenerator";

interface GenerateCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockCounts?: {
    available?: number;
    incoming?: number;
    sold?: number;
    reserved?: number;
  };
  fixedSegment?: CatalogViewMode;
}

interface ProgressState {
  stage: "idle" | "fonts" | "fetch_data" | "fetch_images" | "drawing" | "done" | "error";
  percentage: number;
  message: string;
  completed: number;
  total: number;
}

let cachedFontData: {
  regularBase64: string;
  regularBytes: Uint8Array;
  semiBoldBase64: string;
  semiBoldBytes: Uint8Array;
} | null = null;

async function getBrowserFontData(): Promise<{
  regularBase64: string;
  regularBytes: Uint8Array;
  semiBoldBase64: string;
  semiBoldBytes: Uint8Array;
}> {
  if (cachedFontData) return cachedFontData;

  const [regRes, semiRes] = await Promise.all([
    fetch("/fonts/Inter-Regular.ttf"),
    fetch("/fonts/Inter-SemiBold.ttf"),
  ]);

  if (!regRes.ok || !semiRes.ok) {
    throw new Error("Eroare la încărcarea fonturilor pentru catalog.");
  }

  const [regBuf, semiBuf] = await Promise.all([
    regRes.arrayBuffer(),
    semiRes.arrayBuffer(),
  ]);

  const regBytes = new Uint8Array(regBuf);
  const semiBytes = new Uint8Array(semiBuf);

  let regBinary = "";
  for (let i = 0; i < regBytes.byteLength; i++) {
    regBinary += String.fromCharCode(regBytes[i]);
  }
  let semiBinary = "";
  for (let i = 0; i < semiBytes.byteLength; i++) {
    semiBinary += String.fromCharCode(semiBytes[i]);
  }

  cachedFontData = {
    regularBase64: btoa(regBinary),
    regularBytes: regBytes,
    semiBoldBase64: btoa(semiBinary),
    semiBoldBytes: semiBytes,
  };

  return cachedFontData;
}

export default function GenerateCatalogModal({
  isOpen,
  onClose,
  stockCounts: initialStockCounts,
  fixedSegment,
}: GenerateCatalogModalProps) {
  const [selectedSegment, setSelectedSegment] = useState<CatalogViewMode>(fixedSegment || "stock");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    stage: "idle",
    percentage: 0,
    message: "",
    completed: 0,
    total: 0,
  });
  const [downloadedFilename, setDownloadedFilename] = useState<string | null>(null);

  // Business info query (accepted 7th GET /business/me debt)
  const { data: business } = useQuery({
    queryKey: ["businessMe"],
    queryFn: async () => {
      const { data } = await api.get("/business/me");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Stock counts query (fallback if not passed from parent)
  const { data: fetchedCounts } = useQuery({
    queryKey: ["stock-counts"],
    queryFn: getStockCounts,
    enabled: !initialStockCounts,
    refetchOnWindowFocus: false,
  });

  const c = (initialStockCounts || fetchedCounts) as any;
  const stockCount = (c?.available ?? 0) + (c?.reserved ?? 0);
  const soldCount = c?.sold ?? 0;
  const incomingCount = c?.incoming ?? 0;

  const segmentCounts: Record<CatalogViewMode, number> = {
    stock: stockCount,
    sold: soldCount,
    incoming: incomingCount,
  };

  const segments: {
    id: CatalogViewMode;
    title: string;
    description: string;
    icon: any;
    count: number;
  }[] = [
    {
      id: "stock",
      title: "În stoc",
      description: "Mașini disponibile la vânzare",
      icon: Car,
      count: stockCount,
    },
    {
      id: "sold",
      title: "Vândute",
      description: "Istoric mașini vândute",
      icon: Coins,
      count: soldCount,
    },
    {
      id: "incoming",
      title: "Sosesc în curând",
      description: "Mașini în tranzit / pregătire",
      icon: Truck,
      count: incomingCount,
    },
  ];

  const selectedCount = segmentCounts[selectedSegment] ?? 0;
  const isEmptySegment = selectedCount === 0;
  const isDataReady = Boolean(business?.id && (initialStockCounts || fetchedCounts));

  useEffect(() => {
    if (fixedSegment) {
      setSelectedSegment(fixedSegment);
    }
  }, [fixedSegment]);

  useEffect(() => {
    if (
      isOpen &&
      fixedSegment &&
      isDataReady &&
      !isGenerating &&
      !downloadedFilename &&
      progress.stage === "idle"
    ) {
      const count = segmentCounts[fixedSegment] ?? 0;
      if (count > 0) {
        handleGenerate(fixedSegment);
      }
    }
  }, [isOpen, fixedSegment, isDataReady, segmentCounts[fixedSegment || "stock"]]);

  const handleModalClose = () => {
    if (isGenerating) return; // Cannot close mid-generation
    setDownloadedFilename(null);
    setProgress({
      stage: "idle",
      percentage: 0,
      message: "",
      completed: 0,
      total: 0,
    });
    onClose();
  };

  const handleGenerate = async (overrideSegment?: CatalogViewMode) => {
    const targetSegment = overrideSegment || selectedSegment;

    if (!business?.id) {
      toast.error("Datele firmei nu sunt disponibile. Încercați din nou.");
      return;
    }

    const count = segmentCounts[targetSegment] ?? 0;
    if (count === 0) {
      toast.error("Nu există mașini în acest segment pentru a genera catalogul.");
      return;
    }

    setIsGenerating(true);
    setDownloadedFilename(null);
    setProgress({
      stage: "fonts",
      percentage: 5,
      message: "Se încarcă fonturile vectoriale...",
      completed: 0,
      total: 2,
    });

    try {
      const fontData = await getBrowserFontData();

      const result = await generateCatalogPdf({
        businessId: business.id,
        businessName: business.name || "Catalog Vehicule",
        viewMode: targetSegment,
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
        fontData,
        onProgress: ({ stage, completed, total }) => {
          if (stage === "fonts") {
            const pct = Math.round((completed / (total || 2)) * 10);
            setProgress({
              stage,
              percentage: Math.max(5, pct),
              message: "Se pregătesc fonturile...",
              completed,
              total,
            });
          } else if (stage === "fetch_data") {
            const pct = Math.round(10 + (completed / (total || 1)) * 10);
            setProgress({
              stage,
              percentage: pct,
              message: "Se preiau datele despre mașini...",
              completed,
              total,
            });
          } else if (stage === "fetch_images") {
            const pct = Math.round(20 + (total > 0 ? (completed / total) * 55 : 55));
            setProgress({
              stage,
              percentage: pct,
              message: `Se descarcă imaginile: ${completed} din ${total}`,
              completed,
              total,
            });
          } else if (stage === "drawing") {
            const pct = Math.round(75 + (total > 0 ? (completed / total) * 24 : 24));
            setProgress({
              stage,
              percentage: pct,
              message: `Se generează paginile PDF: ${completed} din ${total}`,
              completed,
              total,
            });
          } else if (stage === "done") {
            setProgress({
              stage,
              percentage: 100,
              message: "Generare finalizată!",
              completed,
              total,
            });
          }
        },
      });

      if (!result || result.pageCount === 0) {
        throw new Error("Nu au fost găsite mașini pentru a genera pagini PDF.");
      }

      // Download file in browser
      const segmentLabels: Record<CatalogViewMode, string> = {
        stock: "stoc",
        sold: "vandute",
        incoming: "incoming",
      };
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `catalog-${segmentLabels[targetSegment]}-${dateStr}.pdf`;

      const blob = new Blob([result.pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadedFilename(filename);

      setProgress((prev) => ({
        ...prev,
        stage: "done",
        percentage: 100,
        message: "Descărcat cu succes!",
      }));

      toast.success("Catalogul PDF a fost descărcat cu succes!");
    } catch (err: any) {
      console.error("Eroare generare catalog PDF:", err);
      toast.error(err?.message || "Eroare la generarea catalogului PDF.");
      setProgress((prev) => ({
        ...prev,
        stage: "error",
        message: err?.message || "Eroare la generare.",
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const getDialogSubtitle = () => {
    if (fixedSegment === "sold") return "Catalog PDF cu mașinile vândute.";
    if (fixedSegment === "stock") return "Catalog PDF cu mașinile disponibile în stoc.";
    if (fixedSegment === "incoming") return "Catalog PDF cu mașinile care sosesc în curând.";
    return "Alege segmentul de mașini pentru a genera și descărca catalogul vectorial.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleModalClose(); }}>
      <DialogContent
        className="max-w-lg bg-card border-border p-6"
        onPointerDownOutside={(e) => { if (isGenerating) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isGenerating) e.preventDefault(); }}
      >
        <DialogHeader className="pr-0 sm:pr-0 text-center sm:text-center items-center">
          <DialogTitle className="text-[17px] font-semibold text-foreground flex items-center justify-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Generează catalog PDF
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground text-center">
            {getDialogSubtitle()}
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {downloadedFilename && !isGenerating ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[15px] font-semibold text-foreground leading-snug">
                    Catalog descărcat cu succes
                  </h4>
                  <p className="text-[13px] text-muted-foreground mt-0.5 break-all">
                    {downloadedFilename}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleModalClose}
                className="h-11 min-h-[44px] text-[13px] w-full sm:w-auto"
              >
                Închide
              </Button>
            </div>
          </div>
        ) : fixedSegment ? (
          /* Fixed Segment Mode */
          <div className="space-y-4 py-2">
            {!isDataReady ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground gap-2 text-[13px]">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Se pregătește generarea...
              </div>
            ) : isEmptySegment && !isGenerating ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-muted/60 border border-border text-muted-foreground">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                  <p className="text-[13px]">
                    Nu există mașini în segmentul {fixedSegment === "sold" ? "vândute" : "în stoc"} pentru a genera catalogul.
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleModalClose}
                    className="h-11 min-h-[44px] text-[13px] w-full sm:w-auto"
                  >
                    Închide
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 p-3.5 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-foreground font-medium flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      {progress.message || "Se inițializează generarea..."}
                    </span>
                    <span className="font-semibold text-primary tabular-nums">
                      {progress.percentage}%
                    </span>
                  </div>
                  <Progress value={progress.percentage} className="h-2 w-full bg-muted" />
                  {progress.stage === "fetch_images" && progress.total > 0 && (
                    <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                      {progress.completed} / {progress.total} imagini procesate
                    </p>
                  )}
                  {progress.stage === "drawing" && progress.total > 0 && (
                    <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                      {progress.completed} / {progress.total} pagini randate
                    </p>
                  )}
                </div>

                {progress.stage === "error" && (
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      onClick={handleModalClose}
                      className="h-11 min-h-[44px] text-[13px] w-full sm:w-auto"
                    >
                      Închide
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Segment Selector Mode */
          <div className="space-y-4 py-2">
            {/* Segment Selector Cards */}
            <div>
              <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
                Selectează segmentul
              </p>
              <div className="grid gap-2.5">
                {segments.map((seg) => {
                  const Icon = seg.icon;
                  const isSelected = selectedSegment === seg.id;
                  const isZero = seg.count === 0;

                  return (
                    <button
                      key={seg.id}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => {
                        setSelectedSegment(seg.id);
                        setDownloadedFilename(null);
                      }}
                      className={
                        "flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors select-none " +
                        (isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent/50") +
                        (isGenerating ? " opacity-60 cursor-not-allowed" : " cursor-pointer")
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 " +
                            (isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground")
                          }
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold text-foreground leading-snug">
                              {seg.title}
                            </span>
                          </div>
                          <p className="text-[13px] text-muted-foreground leading-none mt-0.5">
                            {seg.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "text-[13px] font-semibold px-2.5 py-0.5 rounded-full tabular-nums " +
                            (isZero
                              ? "bg-muted text-muted-foreground/60"
                              : isSelected
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground")
                          }
                        >
                          {seg.count} {seg.count === 1 ? "mașină" : "mașini"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empty Segment Warning */}
            {isEmptySegment && !isGenerating && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/60 border border-border text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                <p className="text-[13px]">
                  Nu există mașini în acest segment. Alegeți alt segment pentru a genera catalogul.
                </p>
              </div>
            )}

            {/* Progress Surface */}
            {isGenerating && (
              <div className="space-y-2 p-3.5 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-foreground font-medium flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    {progress.message || "Se procesează..."}
                  </span>
                  <span className="font-semibold text-primary tabular-nums">
                    {progress.percentage}%
                  </span>
                </div>
                <Progress value={progress.percentage} className="h-2 w-full bg-muted" />
                {progress.stage === "fetch_images" && progress.total > 0 && (
                  <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                    {progress.completed} / {progress.total} imagini procesate
                  </p>
                )}
                {progress.stage === "drawing" && progress.total > 0 && (
                  <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                    {progress.completed} / {progress.total} pagini randate
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                disabled={isGenerating || isEmptySegment || !business?.id}
                onClick={() => handleGenerate()}
                className="h-11 min-h-[44px] text-[13px] w-full sm:w-auto px-6"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Se generează...
                  </>
                ) : isEmptySegment ? (
                  "Nicio mașină în segment"
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Generează catalog ({selectedCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
