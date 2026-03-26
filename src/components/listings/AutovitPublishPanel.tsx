import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Upload, EyeOff, Share2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { 
  getAutovitStatus, 
  publishToAutovit, 
  unpublishFromAutovit, 
  exportToOLX 
} from "@/services/api";
import AutovitStatusBadge from "./AutovitStatusBadge";

interface AutovitPublishPanelProps {
  listingId: string;
  onStatusChange?: () => void;
}

/**
 * Panou de control pentru publicarea și gestionarea statusului anunțului pe Autovit și OLX.
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

  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    setIsActionLoading(true);
    try {
      await action();
      toast.success(successMessage);
      await fetchStatus();
      if (onStatusChange) onStatusChange();
    } catch (error: any) {
      const message = error.response?.data?.message || "A apărut o eroare în timpul procesării cererii.";
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <Card className="border-card-border bg-card">
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
          <>
            <AutovitStatusBadge 
              autovitId={status.autovitId} 
              autovitStatus={status.autovitStatus} 
            />

            <div className="flex flex-wrap gap-2 pt-2">
              {(!status.autovitStatus || status.autovitStatus === "inactive") ? (
                <Button 
                  onClick={() => handleAction(() => publishToAutovit(listingId), "Anunțul a fost publicat cu succes pe Autovit!")}
                  disabled={isActionLoading}
                  size="sm"
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Publică pe Autovit
                </Button>
              ) : status.autovitStatus === "active" ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => handleAction(() => unpublishFromAutovit(listingId), "Anunțul a fost dezactivat de pe Autovit.")}
                    disabled={isActionLoading}
                    size="sm"
                    className="border-border hover:bg-secondary text-foreground"
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <EyeOff className="w-4 h-4 mr-2" />
                    )}
                    Dezactivează Autovit
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={() => handleAction(() => exportToOLX(listingId), "Anunțul a fost exportat cu succes pe OLX!")}
                    disabled={isActionLoading}
                    size="sm"
                    className="border-border hover:bg-secondary text-foreground"
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4 mr-2" />
                    )}
                    Exportă pe OLX
                  </Button>
                </>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AutovitPublishPanel;
