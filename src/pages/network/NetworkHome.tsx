import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Car,
  Truck,
  Building2,
  MessageSquare,
  ChevronRight,
  Settings,
  Handshake,
} from "lucide-react";
import { getNetworkSummary, NetworkSummary, NetworkActionItem } from "@/services/api";
import { formatEur } from "@/lib/format";
import { relativeTime, relativeDay } from "@/lib/relativeTime";
import { roCount } from "@/lib/plural";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";
import NetworkHeader from "@/components/network/NetworkHeader";
import { CARD } from "@/components/today/cardRecipe";
import { cn } from "@/lib/utils";

export default function NetworkHome() {
  const { data, isLoading, isError, error } = useQuery<NetworkSummary>({
    queryKey: ["network-summary"],
    queryFn: getNetworkSummary,
  });

  const actionItems = data?.actionItems ?? [];
  const counts = data?.counts ?? {
    pendingNegotiations: 0,
    unreadMessages: 0,
    newTransportInterests: 0,
    browseCars: 0,
    myExposedCars: 0,
    browseRuns: 0,
    myRuns: 0,
    dealers: 0,
    conversations: 0,
  };

  const countText = roCount(actionItems.length, "solicitare de răspuns", "solicitări de răspuns");

  const settingsAction = (
    <Link
      to="/network/setari"
      aria-label="Setări rețea"
      className="w-11 h-11 lg:w-9 lg:h-9 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0"
    >
      <Settings className="w-5 h-5 lg:w-4 lg:h-4 text-foreground" />
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <NetworkHeader
          title="Rețea"
          countText="Se încarcă..."
          actions={settingsAction}
        />
        <div className="flex items-center justify-center py-12">
          <span className="text-[13px] text-muted-foreground">Se încarcă...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <NetworkHeader
          title="Rețea"
          countText="Eroare"
          actions={settingsAction}
        />
        {isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[13px] text-center">
            A apărut o eroare la încărcarea datelor de rețea. Vă rugăm să încercați din nou.
          </div>
        )}
      </div>
    );
  }

  const negotiations = actionItems
    .filter((i): i is Extract<NetworkActionItem, { type: "NEGOTIATION" }> => i.type === "NEGOTIATION")
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  const messages = actionItems
    .filter((i): i is Extract<NetworkActionItem, { type: "MESSAGE" }> => i.type === "MESSAGE")
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  const transports = actionItems
    .filter((i): i is Extract<NetworkActionItem, { type: "TRANSPORT_INTEREST" }> => i.type === "TRANSPORT_INTEREST")
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  const hasActionItems = actionItems.length > 0;

  return (
    <div className="space-y-6 box-border w-full pb-24">
      {/* HEADER */}
      <NetworkHeader
        title="Rețea"
        countText={countText}
        actions={settingsAction}
      />

      {/* SECTION ONE: ACTION QUEUE */}
      {!hasActionItems ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              De răspuns
            </span>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
              0
            </span>
          </div>
          <div className={cn(CARD, "p-4 text-center")}>
            <p className="text-[13px] text-muted-foreground">
              Nicio solicitare de răspuns în acest moment. Aici vor apărea propunerile de negociere, mesajele și cererile de transport primite de la alți dealeri.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. NEGOTIATIONS (Money on the table) */}
          {negotiations.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Handshake className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                    Negocieri
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
                  {negotiations.length}
                </span>
              </div>
              <div className={cn(CARD, "overflow-hidden")}>
                {negotiations.map((item, index) => {
                  const trimmedCarTitle = item.carTitle?.trim() || "";
                  let verdictText = "";
                  if (item.amount !== null) {
                    verdictText = formatEur(item.amount);
                  } else if (item.proposalKind === "EXCHANGE") {
                    verdictText = "Schimb";
                  } else {
                    verdictText = "Propunere";
                  }

                  let roleVerb = "";
                  if (item.role === "SELLER") {
                    roleVerb = "oferă";
                  } else if (item.role === "BUYER") {
                    roleVerb = "cere";
                  }

                  return (
                    <Fragment key={item.id}>
                      {index > 0 && <div className="border-t border-border/40 ml-4" />}
                      <Link
                        to="/network/cars"
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left select-none"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[15px] font-medium text-foreground truncate">
                              {item.dealerName} {roleVerb ? <span className="text-muted-foreground font-normal text-[13px]">{roleVerb}</span> : null}
                            </span>
                            <span className="text-[15px] font-semibold text-foreground tabular-nums text-right shrink-0">
                              {verdictText}
                            </span>
                          </div>
                          <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                            {relativeTime(item.when)}
                            {trimmedCarTitle ? ` · ${trimmedCarTitle}` : ""}
                            {item.proposalKind === "EXCHANGE" && item.amount !== null ? " · Schimb" : ""}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Link>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. MESSAGES */}
          {messages.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MessageSquare className="w-4 h-4 text-success shrink-0" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                    Mesaje dealeri
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
                  {messages.length}
                </span>
              </div>
              <div className={cn(CARD, "overflow-hidden")}>
                {messages.map((item, index) => (
                  <Fragment key={item.id}>
                    {index > 0 && <div className="border-t border-border/40 ml-4" />}
                    <Link
                      to="/network/messages"
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left select-none"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[15px] font-medium text-foreground truncate">
                              {item.dealerName}
                            </span>
                            {item.unreadCount > 1 && (
                              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center shrink-0 tabular-nums">
                                {item.unreadCount}
                              </span>
                            )}
                          </div>
                          <span className="text-[12px] text-muted-foreground text-right shrink-0 tabular-nums">
                            {relativeTime(item.when)}
                          </span>
                        </div>
                        <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                          {item.preview.trim()}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </Link>
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {/* 3. TRANSPORT INTERESTS */}
          {transports.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Truck className="w-4 h-4 text-warning shrink-0" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                    Cereri transport
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
                  {transports.length}
                </span>
              </div>
              <div className={cn(CARD, "overflow-hidden")}>
                {transports.map((item, index) => (
                  <Fragment key={item.id}>
                    {index > 0 && <div className="border-t border-border/40 ml-4" />}
                    <Link
                      to="/network/transport"
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left select-none"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[15px] font-medium text-foreground truncate">
                            {item.fromCity} → {item.toCity}
                          </span>
                          <span className="text-[13px] font-medium text-foreground text-right shrink-0 tabular-nums">
                            {roCount(item.interestedCount, "dealer interesat", "dealeri interesați")}
                          </span>
                        </div>
                        <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                          Plecare {relativeDay(item.departureDate)} · {relativeTime(item.when)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </Link>
                  </Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION TWO: THE FOUR AREA LINKS */}
      <div className={cn(CARD, "overflow-hidden")}>
        {/* 1. Mașini */}
        <Link
          to="/network/cars"
          className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors min-h-[52px] w-full text-left select-none"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Car className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium text-foreground leading-snug truncate">
                Mașini
              </div>
              <div className="text-[12px] text-muted-foreground leading-tight truncate mt-0.5">
                {counts.browseCars} de la colegi · {counts.myExposedCars} expuse
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[13px] text-muted-foreground tabular-nums font-medium">
              {counts.browseCars}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </Link>

        {/* Separator */}
        <div className="border-t border-border/40 ml-12" />

        {/* 2. Transport */}
        <Link
          to="/network/transport"
          className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors min-h-[52px] w-full text-left select-none"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Truck className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium text-foreground leading-snug truncate">
                Transport
              </div>
              <div className="text-[12px] text-muted-foreground leading-tight truncate mt-0.5">
                {counts.browseRuns} curse colegi · {counts.myRuns} ale tale
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {counts.newTransportInterests > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shrink-0 tabular-nums">
                {counts.newTransportInterests}
              </span>
            )}
            <span className="text-[13px] text-muted-foreground tabular-nums font-medium">
              {counts.browseRuns}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </Link>

        {/* Separator */}
        <div className="border-t border-border/40 ml-12" />

        {/* 3. Dealeri */}
        <Link
          to="/network/dealers"
          className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors min-h-[52px] w-full text-left select-none"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium text-foreground leading-snug truncate">
                Dealeri
              </div>
              <div className="text-[12px] text-muted-foreground leading-tight truncate mt-0.5">
                {roCount(counts.dealers, "dealer partener", "dealeri parteneri")} în rețea
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[13px] text-muted-foreground tabular-nums font-medium">
              {counts.dealers}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </Link>

        {/* Separator */}
        <div className="border-t border-border/40 ml-12" />

        {/* 4. Mesaje dealeri */}
        <Link
          to="/network/messages"
          className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors min-h-[52px] w-full text-left select-none"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium text-foreground leading-snug truncate">
                Mesaje dealeri
              </div>
              <div className="text-[12px] text-muted-foreground leading-tight truncate mt-0.5">
                {counts.unreadMessages > 0
                  ? `${roCount(counts.unreadMessages, "mesaj necitit", "mesaje necitite")} din ${counts.conversations} conversații`
                  : `${roCount(counts.conversations, "conversație", "conversații")}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {counts.unreadMessages > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shrink-0 tabular-nums">
                {counts.unreadMessages}
              </span>
            )}
            <span className="text-[13px] text-muted-foreground tabular-nums font-medium">
              {counts.conversations}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}
