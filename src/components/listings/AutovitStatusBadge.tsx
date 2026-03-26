import React from "react";
import { Badge } from "@/components/ui/badge";
import { CloudOff, Pause, Check, Cloud } from "lucide-react";

interface AutovitStatusBadgeProps {
  autovitId: string | null;
  autovitStatus: string | null;
}

/**
 * Componentă pentru afișarea statusului unui anunț pe platforma Autovit.
 */
const AutovitStatusBadge = ({ autovitId, autovitStatus }: AutovitStatusBadgeProps) => {
  // Cazul 1: Anunțul nu a fost trimis/sincronizat încă
  if (!autovitId) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1.5 bg-muted text-muted-foreground border-border font-medium">
        <CloudOff className="w-3.5 h-3.5" />
        <span>Nesincronizat</span>
      </Badge>
    );
  }

  // Cazul 2: Anunțul este pe Autovit dar este marcat ca inactiv
  if (autovitStatus === "inactive") {
    return (
      <Badge className="flex items-center gap-1.5 bg-warning-light text-warning border border-warning/20 font-medium">
        <Pause className="w-3.5 h-3.5 fill-current" />
        <span>Inactiv pe Autovit</span>
      </Badge>
    );
  }

  // Cazul 3: Anunțul este public și activ pe Autovit
  if (autovitStatus === "active") {
    return (
      <Badge className="flex items-center gap-1.5 bg-success-light text-success border border-success/20 font-medium">
        <Check className="w-3.5 h-3.5" />
        <span>Activ pe Autovit</span>
      </Badge>
    );
  }

  // Fallback pentru statusuri neprevăzute dar cu ID existent
  return (
    <Badge variant="outline" className="flex items-center gap-1.5 font-medium">
      <Cloud className="w-3.5 h-3.5" />
      <span>Sincronizat (ID: {autovitId})</span>
    </Badge>
  );
};

export default AutovitStatusBadge;
