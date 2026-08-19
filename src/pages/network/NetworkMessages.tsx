import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getConversations, ConversationSummary } from "@/services/api";
import { relativeTime } from "@/lib/relativeTime";
import { roCount } from "@/lib/plural";
import { cn } from "@/lib/utils";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";
import NetworkHeader from "@/components/network/NetworkHeader";
import { CARD } from "@/components/today/cardRecipe";

export default function NetworkMessages() {
  const { data: conversations, isLoading, isError, error } = useQuery<ConversationSummary[]>({
    queryKey: ["conversations"],
    queryFn: getConversations,
    refetchInterval: 15000,
  });

  const totalCount = conversations?.length ?? 0;
  const unreadCount = conversations?.reduce((acc, c) => acc + (c.unreadCount || 0), 0) ?? 0;
  const countText = unreadCount > 0
    ? `${roCount(unreadCount, "mesaj necitit", "mesaje necitite")} din ${roCount(totalCount, "conversație", "conversații")}`
    : roCount(totalCount, "conversație", "conversații");

  if (isLoading) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <NetworkHeader
          title="Mesaje dealeri"
          countText="Se încarcă..."
          backHref="/network"
          backAriaLabel="Înapoi la rețea"
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
          title="Mesaje dealeri"
          countText="Eroare"
          backHref="/network"
          backAriaLabel="Înapoi la rețea"
        />
        {isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[13px] text-center">
            A apărut o eroare la încărcarea conversațiilor. Vă rugăm să încercați din nou.
          </div>
        )}
      </div>
    );
  }

  const sortedConversations = conversations
    ? [...conversations].sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
        const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
        return timeB - timeA;
      })
    : [];

  return (
    <div className="space-y-6 box-border w-full pb-24">
      {/* HEADER */}
      <NetworkHeader
        title="Mesaje dealeri"
        countText={countText}
        backHref="/network"
        backAriaLabel="Înapoi la rețea"
      />

      {sortedConversations.length === 0 ? (
        /* EMPTY STATE */
        <div className={cn(CARD, "p-6 text-center space-y-3")}>
          <p className="text-[13px] text-muted-foreground">
            Nu ai nicio conversație cu alți dealeri.
          </p>
          <div className="flex justify-center">
            <Link
              to="/network/dealers"
              className="text-[13px] text-primary hover:underline font-medium inline-flex items-center justify-center min-h-[44px] px-3"
            >
              Vezi dealerii din rețea
            </Link>
          </div>
        </div>
      ) : (
        /* LIST */
        <div className={cn(CARD, "overflow-hidden")}>
          {sortedConversations.map((conv, idx) => {
            const lastMsg = conv.lastMessage;
            const hasUnread = conv.unreadCount > 0;
            const prefix = lastMsg?.fromMe ? "Tu: " : "";

            return (
              <Fragment key={conv.id}>
                {idx > 0 && <div className="border-t border-border/40 ml-4" />}
                <Link
                  to={`/network/messages/${conv.id}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left select-none"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={cn(
                            "text-[15px] truncate",
                            hasUnread
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground"
                          )}
                        >
                          {conv.otherDealer?.name || "Dealer necunoscut"}
                        </span>
                        {hasUnread && (
                          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center shrink-0 tabular-nums">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <span className="text-[12px] text-muted-foreground text-right shrink-0 tabular-nums">
                          {relativeTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                      {lastMsg ? (
                        <>
                          {prefix}
                          {lastMsg.body.trim()}
                        </>
                      ) : (
                        "Încă niciun mesaj"
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
