import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Copy, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";

type Format = "facebook" | "whatsapp" | "olx" | "instagram";

const FORMATS: { key: Format; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "olx", label: "OLX" },
  { key: "instagram", label: "Instagram" },
];

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  // câmpurile curente ale formularului + featureIds, exact ca la generate-description
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

  // când se deschide modalul sau se schimbă tabul, generează dacă nu avem deja rezultat
  useEffect(() => {
    if (isOpen && !results[activeTab] && loadingFormat !== activeTab) {
      generate(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  // resetează la închidere ca să repornim proaspăt data viitoare
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-popover border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary-light">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Generează marketing
          </DialogTitle>
          <DialogDescription>
            Text gata de publicat, generat din datele mașinii. Alege canalul.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Format)}>
          <TabsList className="grid grid-cols-4 w-full">
            {FORMATS.map((f) => (
              <TabsTrigger key={f.key} value={f.key}>{f.label}</TabsTrigger>
            ))}
          </TabsList>

          {FORMATS.map((f) => (
            <TabsContent key={f.key} value={f.key} className="mt-4">
              {loadingFormat === f.key ? (
                <div className="space-y-2 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se generează pentru {f.label}...
                  </div>
                  <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
                  <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
                  <div className="h-4 w-3/4 rounded-md bg-muted animate-pulse" />
                </div>
              ) : errorFormat === f.key ? (
                <div className="py-4 text-sm text-muted-foreground">
                  Nu am putut genera textul. Încearcă din nou.
                </div>
              ) : results[f.key] ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-background p-4 max-h-[320px] overflow-y-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{results[f.key]}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => generate(f.key)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerează
                    </Button>
                    <Button size="sm" onClick={() => handleCopy(results[f.key]!)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiază
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-sm text-muted-foreground">Se pregătește...</div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MarketingModal;
