import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Copy, RefreshCw, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";

type Format = "facebook" | "whatsapp" | "olx" | "instagram";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

type PlatformMeta = {
  key: Format;
  label: string;
  color: string;
  tint: string;
  darkText: string;
  Icon?: (props: { className?: string }) => JSX.Element;
};

const PLATFORMS: PlatformMeta[] = [
  { key: "facebook", label: "Facebook", color: "#1877F2", tint: "#E7F0FE", darkText: "#0C447C", Icon: FacebookIcon },
  { key: "whatsapp", label: "WhatsApp", color: "#128C3E", tint: "#E1F7EA", darkText: "#0F6E32", Icon: WhatsAppIcon },
  { key: "olx", label: "OLX", color: "#0F766E", tint: "#DEF5F1", darkText: "#0B5A54" },
  { key: "instagram", label: "Instagram", color: "#C13584", tint: "#FBEAF3", darkText: "#8A2560", Icon: InstagramIcon },
];

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingPayload?: Record<string, any>;
  listingId?: string;
}

const MarketingModal = ({ isOpen, onClose, listingPayload, listingId }: MarketingModalProps) => {
  const [activeTab, setActiveTab] = useState<Format>("facebook");
  const [results, setResults] = useState<Partial<Record<Format, string>>>({});
  const [loadingFormat, setLoadingFormat] = useState<Format | null>(null);
  const [errorFormat, setErrorFormat] = useState<Format | null>(null);

  const generate = async (format: Format) => {
    setLoadingFormat(format);
    setErrorFormat(null);
    try {
      const payload = listingId ? { listingId, format } : { ...listingPayload, format };
      const response = await api.post("/ai/generate-marketing", payload);
      setResults((prev) => ({ ...prev, [format]: response.data.text }));
    } catch (e: any) {
      setErrorFormat(format);
      toast.error(e?.response?.data?.error || "Nu s-a putut genera textul.");
    } finally {
      setLoadingFormat(null);
    }
  };

  useEffect(() => {
    if (isOpen && !results[activeTab] && loadingFormat !== activeTab) {
      generate(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) {
      setResults({});
      setActiveTab("facebook");
      setErrorFormat(null);
    }
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Text copiat!");
  };

  const active = PLATFORMS.find((p) => p.key === activeTab)!;
  const currentText = results[activeTab];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Texte de promovare
          </DialogTitle>
          <DialogDescription>
            Alege canalul, generează, copiază. Atât.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2.5 mt-2">
          {PLATFORMS.map((p) => {
            const isActive = p.key === activeTab;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setActiveTab(p.key)}
                className="flex items-center gap-2.5 rounded-xl p-3.5 transition-all"
                style={
                  isActive
                    ? { border: `2px solid ${p.color}`, backgroundColor: p.tint, boxShadow: `0 0 0 3px ${p.color}33` }
                    : { border: "1px solid hsl(var(--border))", backgroundColor: "transparent" }
                }
              >
                {p.Icon ? (
                  <span style={{ color: p.color, display: "inline-flex" }}>
                    <p.Icon className="h-6 w-6" />
                  </span>
                ) : (
                  <span className="text-base font-bold tracking-tight" style={{ color: isActive ? p.darkText : p.color }}>
                    OLX
                  </span>
                )}
                <span className="text-[15px] font-medium" style={isActive ? { color: p.darkText } : undefined}>
                  {p.label}
                </span>
                {isActive && <Check className="h-[18px] w-[18px] ml-auto" style={{ color: p.color }} />}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {loadingFormat === activeTab ? (
            <div className="space-y-2 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se generează pentru {active.label}...
              </div>
              <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded-md bg-muted animate-pulse" />
            </div>
          ) : errorFormat === activeTab ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Nu am putut genera textul.</p>
              <Button variant="outline" onClick={() => generate(activeTab)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Încearcă din nou
              </Button>
            </div>
          ) : currentText ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4 max-h-[300px] overflow-y-auto">
                <p className="text-[15px] text-foreground whitespace-pre-wrap leading-relaxed">{currentText}</p>
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={() => generate(activeTab)} className="h-12 rounded-xl">
                  <RefreshCw className="h-[18px] w-[18px] mr-2" />
                  Regenerează
                </Button>
                <button
                  type="button"
                  onClick={() => handleCopy(currentText)}
                  className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-base font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: active.color }}
                >
                  <Copy className="h-5 w-5" />
                  Copiază textul
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">Se pregătește...</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketingModal;
