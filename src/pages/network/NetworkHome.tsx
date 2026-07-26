import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Car, Truck, Building2, MessageSquare, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { getNetworkSummary, NetworkSummary, NetworkActionItem } from "@/services/api";
import { formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { relativeTime, relativeDay } from "@/lib/relativeTime";
import { roCount } from "@/lib/plural";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";

const capitalizeFirst = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function NetworkHome() {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery<NetworkSummary>({
    queryKey: ["network-summary"],
    queryFn: getNetworkSummary,
  });

  const dateLabel = capitalizeFirst(format(new Date(), "EEEE, d MMMM", { locale: ro }));

  if (isLoading) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight">Rețea</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {dateLabel}
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <span className="text-[15px] text-muted-foreground">Se încarcă...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight">Rețea</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {dateLabel}
          </p>
        </div>
        {isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm text-center">
            A apărut o eroare la încărcarea datelor de rețea. Vă rugăm să încercați din nou.
          </div>
        )}
      </div>
    );
  }

  const { counts, actionItems } = data || {
    counts: {
      pendingNegotiations: 0,
      unreadMessages: 0,
      newTransportInterests: 0,
      browseCars: 0,
      myExposedCars: 0,
      browseRuns: 0,
      myRuns: 0,
      dealers: 0,
      conversations: 0,
    },
    actionItems: [],
  };

  const sortedActionItems = actionItems
    ? [...actionItems].sort((a, b) => {
        const typeOrder = { NEGOTIATION: 0, TRANSPORT_INTEREST: 1, MESSAGE: 2 };
        const orderA = typeOrder[a.type] ?? 99;
        const orderB = typeOrder[b.type] ?? 99;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.when).getTime() - new Date(a.when).getTime();
      })
    : [];

  const getRowData = (item: NetworkActionItem) => {
    let l1 = "";
    let l2 = "";
    let targetPath = "";

    if (item.type === "NEGOTIATION") {
      targetPath = "/network/cars";
      if (item.amount === null) {
        l1 = `${item.dealerName} a trimis o propunere`;
      } else {
        const formattedAmount = formatEur(item.amount);
        if (item.role === "SELLER") {
          l1 = `${item.dealerName} oferă ${formattedAmount}`;
        } else {
          l1 = `${item.dealerName} cere ${formattedAmount}`;
        }
      }
      if (item.proposalKind === "EXCHANGE") {
        l1 += " (schimb)";
      }

      if (item.carTitle) {
        l2 = `${relativeTime(item.when)} · ${item.carTitle}`;
      } else {
        l2 = relativeTime(item.when);
      }
    } else if (item.type === "MESSAGE") {
      targetPath = "/network/messages";
      l1 = `${item.dealerName} ți-a scris`;
      l2 = `${relativeTime(item.when)} · ${item.preview}`;
    } else if (item.type === "TRANSPORT_INTEREST") {
      targetPath = "/network/transport";
      l1 = item.interestedCount === 1 ? "1 dealer interesat" : `${item.interestedCount} dealeri interesați`;
      l2 = `${item.fromCity} → ${item.toCity} · pleacă ${relativeDay(item.departureDate)}`;
    }

    return { l1, l2, targetPath };
  };

  return (
    <div className="space-y-6 box-border w-full pb-24">
      {/* HEADING */}
      <div>
        <h1 className="text-[20px] font-semibold leading-tight">Rețea</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {dateLabel}
        </p>
      </div>

      {/* ACTION CARD */}
      {sortedActionItems && sortedActionItems.length > 0 && (
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="p-4 pb-3">
            <h2 className="text-[17px] font-semibold text-foreground">De răspuns</h2>
          </div>
          <div>
            {sortedActionItems.map((item, idx) => {
              const { l1, l2, targetPath } = getRowData(item);
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(targetPath)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 gap-3 cursor-pointer hover:bg-muted/50 transition-colors min-h-[64px]",
                    idx > 0 ? "border-t border-border" : ""
                  )}
                >
                  <div className="flex-1 min-w-0">
                    {item.type === "MESSAGE" ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[15px] font-medium text-foreground truncate">
                          {item.dealerName} ți-a scris
                        </span>
                        {item.unreadCount > 1 && (
                          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shrink-0">
                            {item.unreadCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[15px] font-medium text-foreground truncate">
                        {l1}
                      </div>
                    )}
                    <div className="text-[13px] text-muted-foreground truncate">
                      {l2}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NAVIGATION ROWS */}
      <div className="flex flex-col gap-[10px]">
        {/* Row 1 */}
        <Link
          to="/network/cars"
          className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl min-h-[64px] hover:bg-muted/50 transition-colors w-full"
        >
          <Car className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium text-foreground truncate">Mașini</div>
            <div className="text-[13px] text-muted-foreground truncate">
              {counts.browseCars} de la colegi · {counts.myExposedCars} ale tale
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>

        {/* Row 2 */}
        <Link
          to="/network/transport"
          className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl min-h-[64px] hover:bg-muted/50 transition-colors w-full"
        >
          <Truck className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium text-foreground truncate">Transport</div>
            <div className="text-[13px] text-muted-foreground truncate">
              {counts.browseRuns} curse · {counts.myRuns} ale tale
            </div>
          </div>
          {counts.newTransportInterests > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shrink-0 mr-1">
              {counts.newTransportInterests}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>

        {/* Row 3 */}
        <Link
          to="/network/dealers"
          className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl min-h-[64px] hover:bg-muted/50 transition-colors w-full"
        >
          <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium text-foreground truncate">Dealeri</div>
            <div className="text-[13px] text-muted-foreground truncate">
              {roCount(counts.dealers, "dealer", "dealeri")} în rețea
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>

        {/* Row 4 */}
        <Link
          to="/network/messages"
          className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl min-h-[64px] hover:bg-muted/50 transition-colors w-full"
        >
          <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium text-foreground truncate">Mesaje dealeri</div>
            <div className="text-[13px] text-muted-foreground truncate">
              {counts.unreadMessages > 0
                ? roCount(counts.unreadMessages, "necitit", "necitite")
                : roCount(counts.conversations, "conversație", "conversații")}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>
      </div>

    </div>
  );
}
