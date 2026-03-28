import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Upload, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { 
  getAutovitStatus, 
  unpublishFromAutovit, 
  publishToAutovitAndOLX 
} from "@/services/api";
import AutovitStatusBadge from "./AutovitStatusBadge";
import { cn } from "@/lib/utils";

interface AutovitPublishPanelProps {
  listingId: string;
  onStatusChange?: () => void;
}

/**
 * Panou de control simplificat pentru publicarea anunțului pe Autovit și OLX simultan.
 */
const AutovitPublishPanel = ({ listingId, onStatusChange }: AutovitPublishPanelProps) => {
  const [status, setStatus] = useState<{ autovitId: string | null; autovitStatus: string | null }>({
    autovitId: null,
    autovitStatus: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const response = await getAutovitStatus(listingId);
      setStatus({
        autovitId: response.data.autovitId,
        autovitStatus: response.data.autovitStatus,
      });
    } catch (error) {
      console.error("Failed to fetch Autovit status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchStatus();
    }
  }, [listingId]);

  const handlePublish = async () => {
    setIsActionLoading(true);
    try {
      const response = await publishToAutovitAndOLX(listingId);
      toast.success(response.data.message || "Anunțul a fost publicat pe Autovit & OLX!");
      await fetchStatus();
      if (onStatusChange) onStatusChange();
    } catch (error: any) {
      const message = error.response?.data?.message || "A apărut o eroare la publicare.";
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setIsActionLoading(true);
    try {
      await unpublishFromAutovit(listingId);
      toast.success("Anunțul a fost dezactivat de pe platformele externe.");
      await fetchStatus();
      if (onStatusChange) onStatusChange();
    } catch (error: any) {
      const message = error.response?.data?.message || "A apărut o eroare la dezactivare.";
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const isPublished = status.autovitStatus === "active";

  return (
    <Card className={cn(
      "border-card-border bg-card transition-all duration-300",
      isPublished && "border-success/50 shadow-sm shadow-success/10 bg-success/5"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          Publicare Autovit / OLX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm">Se verifică statusul sincronizării...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <AutovitStatusBadge 
                    autovitId={status.autovitId} 
                    autovitStatus={status.autovitStatus} 
                />
                
                {isPublished && (
                    <Badge className="bg-success text-success-foreground py-1 px-3 flex items-center gap-1.5 font-bold animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="w-4 h-4" />
                        ✓ Publicat pe Autovit & OLX
                    </Badge>
                )}
            </div>

            <div className="pt-2">
              {!isPublished ? (
                <Button 
                  onClick={handlePublish}
                  disabled={isActionLoading}
                  size="lg"
                  className="w-full sm:w-auto bg-success hover:bg-success/90 text-success-foreground font-bold shadow-md transition-all active:scale-95"
                >
                  {isActionLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Se publică...
                    </>
                  ) : (
                    <>
                        <Upload className="w-5 h-5 mr-2" />
                        Publică pe Autovit & OLX
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={handleDeactivate}
                  disabled={isActionLoading}
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                >
                  {isActionLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Se dezactivează...
                    </>
                  ) : (
                    <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Dezactivează
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutovitPublishPanel;