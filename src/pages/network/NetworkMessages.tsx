import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getConversations, ConversationSummary } from "@/services/api";
import { relativeTime } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";
import InitialsAvatar from "@/components/ui/InitialsAvatar";

export default function NetworkMessages() {
  const navigate = useNavigate();

  const { data: conversations, isLoading, isError, error } = useQuery<ConversationSummary[]>({
    queryKey: ["conversations"],
    queryFn: getConversations,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6 box-border w-full pb-24">
      {/* HEADER */}
      <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/network")}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 rounded-full shrink-0"
            aria-label="Înapoi"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold">Mesaje dealeri</h1>
        </div>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Conversațiile tale cu ceilalți dealeri.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-[15px] text-muted-foreground">Se încarcă...</span>
        </div>
      ) : isError ? (
        isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[15px] text-center">
            A apărut o eroare la încărcarea conversațiilor. Vă rugăm să încercați din nou.
          </div>
        )
      ) : !conversations || conversations.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[15px] text-foreground">Nu ai nicio conversație cu alți dealeri.</p>
          <Link to="/network/dealers" className="text-[15px] text-primary hover:underline font-medium">
            Vezi dealerii din rețea
          </Link>
        </div>
      ) : (
        /* LIST */
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex flex-col">
            {conversations.map((conv, idx) => {
              const lastMsg = conv.lastMessage;
              const hasUnread = conv.unreadCount > 0;
              const prefix = lastMsg?.fromMe ? "Tu: " : "";

              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/network/messages/${conv.id}`)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 gap-3 cursor-pointer hover:bg-muted/50 transition-colors min-h-[64px]",
                    idx > 0 ? "border-t border-border" : ""
                  )}
                >
                  {/* Initials circle */}
                  <InitialsAvatar name={conv.otherDealer?.name} />

                  {/* Dealer info & last message preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={cn(
                          "text-[15px] truncate",
                          hasUnread ? "font-semibold" : "font-medium"
                        )}
                      >
                        {conv.otherDealer?.name || "Dealer necunoscut"}
                      </span>
                      {hasUnread && (
                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] text-muted-foreground truncate mt-0.5">
                      {lastMsg ? (
                        <>
                          {relativeTime(lastMsg.createdAt)}
                          {" · "}
                          {prefix}
                          {lastMsg.body}
                        </>
                      ) : (
                        "Încă niciun mesaj"
                      )}
                    </div>
                  </div>

                  {/* Chevron Right */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
