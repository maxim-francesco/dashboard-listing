import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2, X, CheckCircle2, AlertTriangle, AlertCircle, Camera, Tag, TrendingUp, Megaphone, Image as ImageIcon, Clock } from "lucide-react";
import api from "@/services/api";

interface DiagnoseMetrics {
  myViews30: number;
  avgViews30: number;
  myLeads: number;
  daysOnStock: number;
  stockSize: number;
}

interface DiagnoseResponse {
  verdictCode: string;
  level: "good" | "warn" | "bad";
  verdict: string;
  subtitle: string;
  explanation: string;
  tips: string[];
  source: "ai" | "fallback";
  metrics: DiagnoseMetrics;
}

interface DiagnoseListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string | null;
  listingTitle: string;
}

const LEVEL_STYLES: Record<
  "good" | "warn" | "bad",
  { band: string; circle: string; title: string; sub: string; Icon: typeof CheckCircle2 }
> = {
  good: {
    band: "bg-[#EAF3DE]",
    circle: "bg-[#639922]",
    title: "text-[#173404]",
    sub: "text-[#3B6D11]",
    Icon: CheckCircle2,
  },
  warn: {
    band: "bg-[#FAEEDA]",
    circle: "bg-[#BA7517]",
    title: "text-[#412402]",
    sub: "text-[#854F0B]",
    Icon: AlertTriangle,
  },
  bad: {
    band: "bg-[#FCEBEB]",
    circle: "bg-[#A32D2D]",
    title: "text-[#501313]",
    sub: "text-[#791F1F]",
    Icon: AlertCircle,
  },
};

// pick a friendly icon per tip based on keywords
function tipIcon(tip: string) {
  const t = tip.toLowerCase();
  if (t.includes("poz") || t.includes("imagin") || t.includes("fotograf")) return Camera;
  if (t.includes("preț") || t.includes("pret") || t.includes("scade") || t.includes("ieftin")) return Tag;
  if (t.includes("promov") || t.includes("vizib") || t.includes("reclam")) return Megaphone;
  if (t.includes("titl") || t.includes("descri")) return ImageIcon;
  if (t.includes("așteapt") || t.includes("asteapt") || t.includes("zile")) return Clock;
  return TrendingUp;
}

export default function DiagnoseListingModal({ isOpen, onClose, listingId, listingTitle }: DiagnoseListingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DiagnoseResponse | null>(null);

  const runDiagnosis = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/ai/diagnose-listing/${listingId}`);
      setData(res.data);
    } catch (err) {
      setError("Nu am putut analiza anunțul acum. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (isOpen) runDiagnosis();
    else {
      setData(null);
      setError(null);
    }
  }, [isOpen, runDiagnosis]);

  const style = data ? LEVEL_STYLES[data.level] : LEVEL_STYLES.good;
  const VerdictIcon = style.Icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[400px] p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-[18px] py-4 border-b border-border">
          <Sparkles className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-medium text-foreground leading-tight">Analiză anunț</p>
            <p className="text-[13px] text-muted-foreground truncate">{listingTitle}</p>
          </div>
          <button
            type="button"
            aria-label="Închide"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-[18px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-[15px] text-muted-foreground">Analizez anunțul...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-[15px] text-foreground">{error}</p>
              <Button onClick={runDiagnosis} className="mt-2">
                <RefreshCw className="w-4 h-4 mr-2" /> Încearcă din nou
              </Button>
            </div>
          ) : data ? (
            <>
              {/* Traffic-light verdict band */}
              <div className={`flex items-center gap-3.5 p-4 rounded-xl mb-4 ${style.band}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${style.circle}`}>
                  <VerdictIcon className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[19px] font-medium leading-tight ${style.title}`}>{data.verdict}</p>
                  <p className={`text-[14px] ${style.sub}`}>{data.subtitle}</p>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-[15px] text-foreground leading-relaxed mb-4">{data.explanation}</p>

              {/* Tips */}
              {data.tips && data.tips.length > 0 && (
                <>
                  <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-2.5">Ce poți face</p>
                  <div className="flex flex-col gap-2.5 mb-[18px]">
                    {data.tips.map((tip, i) => {
                      const TipIcon = tipIcon(tip);
                      return (
                        <div key={i} className="flex gap-3 items-start px-3.5 py-3 bg-muted/60 rounded-[10px]">
                          <TipIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <span className="text-[15px] text-foreground leading-snug">{tip}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3.5 bg-muted/60 rounded-[10px] mb-4">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Vizualizări</span>
                  <span className="font-medium">{data.metrics.myViews30}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Media stoc</span>
                  <span className="font-medium">{data.metrics.avgViews30}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Mesaje</span>
                  <span className="font-medium">{data.metrics.myLeads}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Zile pe stoc</span>
                  <span className="font-medium">{data.metrics.daysOnStock}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={onClose} className="flex-1 min-h-[48px] text-[15px]">
                  Închide
                </Button>
                <Button onClick={runDiagnosis} className="flex-1 min-h-[48px] text-[15px]">
                  <RefreshCw className="w-[18px] h-[18px] mr-2" /> Reanalizează
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
