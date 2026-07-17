import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, TrendingDown, Clock, Info, CheckCircle2 } from "lucide-react";
import api from "@/services/api";

interface DiagnoseResponse {
  verdictCode: string;
  text: string;
  source: "ai" | "fallback";
  metrics: {
    myViews30: number;
    avgViews30: number;
    myLeads: number;
    daysOnStock: number;
    stockSize: number;
  };
}

interface DiagnoseListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string | null;
  listingTitle: string;
}

// mapare verdict -> severitate vizuală (culoare bandă + iconiță + etichetă scurtă)
const VERDICT_STYLE: Record<
  string,
  { label: string; band: string; icon: typeof Sparkles; iconColor: string }
> = {
  HIGH_VIEWS_NO_LEADS: { label: "Interes fără contacte", band: "bg-orange-100 dark:bg-orange-500/15 border-orange-300 dark:border-orange-500/30", icon: AlertTriangle, iconColor: "text-orange-500" },
  LOW_VIEWS: { label: "Vizibilitate scăzută", band: "bg-yellow-100 dark:bg-yellow-500/15 border-yellow-300 dark:border-yellow-500/30", icon: TrendingDown, iconColor: "text-yellow-600 dark:text-yellow-500" },
  STALE_NORMAL_TRAFFIC: { label: "Stă demult pe stoc", band: "bg-orange-100 dark:bg-orange-500/15 border-orange-300 dark:border-orange-500/30", icon: Clock, iconColor: "text-orange-500" },
  TOO_NEW: { label: "Prea nou pentru concluzii", band: "bg-muted border-border", icon: Info, iconColor: "text-muted-foreground" },
  INSUFFICIENT_DATA: { label: "Date insuficiente", band: "bg-muted border-border", icon: Info, iconColor: "text-muted-foreground" },
  HEALTHY: { label: "Se mișcă bine", band: "bg-green-100 dark:bg-green-500/15 border-green-300 dark:border-green-500/30", icon: CheckCircle2, iconColor: "text-green-600 dark:text-green-500" },
};

const DiagnoseListingModal = ({ isOpen, onClose, listingId, listingTitle }: DiagnoseListingModalProps) => {
  const [data, setData] = useState<DiagnoseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchDiagnosis = async (id: string) => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await api.get(`/ai/diagnose-listing/${id}`);
      setData(response.data as DiagnoseResponse);
    } catch (e) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && listingId) {
      fetchDiagnosis(listingId);
    }
    if (!isOpen) {
      setData(null);
      setError(false);
    }
  }, [isOpen, listingId]);

  const style = data ? (VERDICT_STYLE[data.verdictCode] || VERDICT_STYLE.INSUFFICIENT_DATA) : null;
  const VerdictIcon = style?.icon || Sparkles;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary-light">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Analiză anunț
          </DialogTitle>
          <DialogDescription className="truncate">{listingTitle}</DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          {isLoading ? (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se analizează anunțul...
              </div>
              <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
              <div className="h-4 w-2/3 rounded-md bg-muted animate-pulse" />
            </div>
          ) : error ? (
            <div className="py-4 text-sm text-muted-foreground">
              Nu am putut genera analiza. Încearcă din nou.
            </div>
          ) : data && style ? (
            <div className="space-y-4">
              <div className={`rounded-lg border p-4 ${style.band}`}>
                <div className="flex items-center gap-2 mb-2">
                  <VerdictIcon className={`h-4 w-4 ${style.iconColor}`} />
                  <span className="text-sm font-semibold text-foreground">{style.label}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{data.text}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground px-1">
                <div className="flex justify-between"><span>Vizualizări (30 zile)</span><span className="font-medium text-foreground">{data.metrics.myViews30}</span></div>
                <div className="flex justify-between"><span>Media stocului</span><span className="font-medium text-foreground">{data.metrics.avgViews30.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>Lead-uri</span><span className="font-medium text-foreground">{data.metrics.myLeads}</span></div>
                <div className="flex justify-between"><span>Zile pe stoc</span><span className="font-medium text-foreground">{data.metrics.daysOnStock}</span></div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Închide</Button>
          <Button
            onClick={() => listingId && fetchDiagnosis(listingId)}
            disabled={isLoading || !listingId}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Re-analizează
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiagnoseListingModal;
