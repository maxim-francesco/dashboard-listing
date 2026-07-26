import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Repeat, MessageSquare, Truck, ChevronRight } from "lucide-react";

interface Negotiation {
  awaitingMyResponse: boolean;
  counterparty: {
    name: string;
  };
  status: string;
}

interface Conversation {
  unreadCount: number;
  otherDealer: {
    name: string;
  };
  lastMessageAt: string;
}

interface TransportRun {
  interestCount: number;
}

export default function NetworkPulse() {
  const navigate = useNavigate();

  const { data: negotiations, isLoading: loadingNegs } = useQuery<Negotiation[]>({
    queryKey: ["network", "negotiations"],
    queryFn: async () => {
      const response = await api.get("/network/trade/negotiations");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const { data: conversations, isLoading: loadingConvs } = useQuery<Conversation[]>({
    queryKey: ["network", "conversations"],
    queryFn: async () => {
      const response = await api.get("/network/conversations");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const { data: myRuns, isLoading: loadingRuns } = useQuery<TransportRun[]>({
    queryKey: ["network", "my-runs"],
    queryFn: async () => {
      const response = await api.get("/network/transport/mine");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (loadingNegs || loadingConvs || loadingRuns) {
    return null;
  }

  const awaitingCount = (negotiations || []).filter((n) => n.awaitingMyResponse).length;
  const unreadCount = (conversations || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const interestCount = (myRuns || []).reduce((acc, r) => acc + (r.interestCount || 0), 0);

  if (awaitingCount === 0 && unreadCount === 0 && interestCount === 0) {
    return null;
  }

  const unreadConvs = (conversations || []).filter((c) => c.unreadCount > 0);
  const unreadText =
    unreadCount === 1
      ? `1 mesaj nou${unreadConvs.length === 1 ? ` de la ${unreadConvs[0].otherDealer.name}` : ""}`
      : `${unreadCount} mesaje noi${unreadConvs.length === 1 ? ` de la ${unreadConvs[0].otherDealer.name}` : ""}`;

  const rows: React.ReactNode[] = [];

  if (awaitingCount > 0) {
    rows.push(
      <div
        key="awaiting"
        onClick={() => navigate("/network")}
        className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="w-[38px] h-[38px] rounded-[10px] bg-primary-light flex items-center justify-center shrink-0">
          <Repeat className="h-5 w-5 text-primary" />
        </div>
        <span className="text-[15px] flex-1 min-w-0 text-foreground truncate">
          {awaitingCount === 1
            ? "1 propunere așteaptă răspunsul tău"
            : `${awaitingCount} propuneri așteaptă răspunsul tău`}
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    );
  }

  if (unreadCount > 0) {
    rows.push(
      <div
        key="unread"
        onClick={() => navigate("/network")}
        className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="w-[38px] h-[38px] rounded-[10px] bg-muted flex items-center justify-center shrink-0">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className="text-[15px] flex-1 min-w-0 text-foreground truncate">
          {unreadText}
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    );
  }

  if (interestCount > 0) {
    rows.push(
      <div
        key="interest"
        onClick={() => navigate("/network")}
        className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="w-[38px] h-[38px] rounded-[10px] bg-muted flex items-center justify-center shrink-0">
          <Truck className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className="text-[15px] flex-1 min-w-0 text-foreground truncate">
          {interestCount === 1
            ? "1 dealer vrea loc în cursa ta"
            : `${interestCount} dealeri vor loc în cursele tale`}
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mt-1 mb-2.5 px-0.5">
        <span className="text-[17px] font-semibold text-foreground">Rețea</span>
        <button
          onClick={() => navigate("/network")}
          className="text-[13px] text-primary hover:text-primary-hover font-medium cursor-pointer"
        >
          Deschide rețeaua
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {rows.map((row, idx) => (
          <div key={idx} className={idx > 0 ? "border-t border-border" : ""}>
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}
