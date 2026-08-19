import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Loader2 } from "lucide-react";
import api, { toggleMessageRead } from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { getLeadAgeBand } from "@/lib/date";
import { roCount } from "@/lib/plural";
import {
  LeadDetailPanel,
  STATUS_LABELS,
  STATUS_COLORS,
  TYPE_LABELS,
  TYPE_COLORS,
} from "@/components/leads/LeadDetailPanel";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import MessagesHeader, {
  MessagesSortOption,
  LeadTypeFilter,
  LeadStatusFilter,
} from "@/components/messages/MessagesHeader";

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: LeadTypeFilter;
  status: LeadStatusFilter;
  lostReason: string | null;
  reminderAt: string | null;
  listingId: string | null;
  listing?: {
    id: string;
    title: string;
  };
}

interface MessageCounts {
  actionNeeded: number;
  unread: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export function isDeFacut(m: Message): boolean {
  if (m.status === "WON" || m.status === "LOST") return false;
  const band = getLeadAgeBand(m.createdAt);
  return band === "noi" || band === "neatinse";
}

const MessagesPage = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [counts, setCounts] = useState<MessageCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeLeadId = searchParams.get("lead");
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  // Tab state: "action" (De făcut) or "all" (Toate)
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"action" | "all">(() => {
    return tabParam === "all" ? "all" : "action";
  });

  // Filter & sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<LeadTypeFilter[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatusFilter[]>([]);
  const [sortBy, setSortBy] = useState<MessagesSortOption>("newest");

  const fetchCounts = async () => {
    try {
      const res = await api.get("/messages/counts");
      setCounts(res.data);
    } catch (e) {
      console.error("Eroare la preluarea statisticilor:", e);
    }
  };

  const fetchMessages = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await api.get("/messages");
      setMessages(response.data);
    } catch (error) {
      toast.error("Nu s-au putut încărca mesajele.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleMessageUpdated = () => {
    fetchMessages(false);
    fetchCounts();
    queryClient.invalidateQueries({ queryKey: ["message-counts"] });
  };

  useEffect(() => {
    const initFetch = async () => {
      setIsLoading(true);
      await Promise.all([fetchMessages(false), fetchCounts()]);
      setIsLoading(false);
    };
    initFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectMessage = async (message: Message) => {
    const params = new URLSearchParams(searchParams);
    params.set("lead", message.id);
    setSearchParams(params);

    if (!message.isRead) {
      try {
        await toggleMessageRead(message.id, true);
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
        );
        fetchCounts();
        queryClient.invalidateQueries({ queryKey: ["message-counts"] });
      } catch (error) {
        // Eroare silențioasă
      }
    }
  };

  const handleClosePanel = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("lead");
    setSearchParams(params);
  };

  const handleNavigateLead = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("lead", id);
    setSearchParams(params);
  };

  const handleTabChange = (newTab: "action" | "all") => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams);
    if (newTab === "all") {
      params.set("tab", "all");
    } else {
      params.delete("tab");
    }
    setSearchParams(params);
  };

  // Base list per active tab
  const deFacutMessages = useMemo(() => {
    return messages.filter(isDeFacut);
  }, [messages]);

  const baseTabMessages = useMemo(() => {
    return activeTab === "action" ? deFacutMessages : messages;
  }, [activeTab, deFacutMessages, messages]);

  // Base messages for filter sheet counts (relative to active tab and search query)
  const baseMessagesForSheet = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return baseTabMessages;
    return baseTabMessages.filter((m) => {
      const nameMatch = m.name?.toLowerCase().includes(query);
      const phoneMatch = m.phone?.toLowerCase().includes(query);
      const messageMatch = m.message?.toLowerCase().includes(query);
      const listingMatch = m.listing?.title?.toLowerCase().includes(query);
      return nameMatch || phoneMatch || messageMatch || listingMatch;
    });
  }, [baseTabMessages, searchQuery]);

  // Messages matching filters
  const filteredMessages = useMemo(() => {
    return baseMessagesForSheet.filter((m) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(m.type)) {
        return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(m.status)) {
        return false;
      }
      return true;
    });
  }, [baseMessagesForSheet, selectedTypes, selectedStatuses]);

  // Sorted messages
  const sortedMessages = useMemo(() => {
    return [...filteredMessages].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "", "ro", { sensitivity: "base" });
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredMessages, sortBy]);

  const isOlderThan2Hours = (createdAtString: string) => {
    const date = new Date(createdAtString);
    const diffMs = new Date().getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 2;
  };

  const getRowClass = (m: Message) => {
    let cls = "border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors ";
    if (m.status === "LOST") {
      cls += "opacity-60 ";
    } else if (!m.isRead && isOlderThan2Hours(m.createdAt)) {
      cls += "bg-rose-50/50 dark:bg-rose-950/10 ";
    }
    return cls;
  };

  const getStatusPillClass = (status: string) => {
    if (status === "LOST") return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300";
    return STATUS_COLORS[status] || "bg-muted text-foreground";
  };

  const getEmptyStateMessage = () => {
    if (searchQuery.trim()) {
      return `Niciun lead găsit pentru „${searchQuery.trim()}”.`;
    }
    if (selectedTypes.length > 0 || selectedStatuses.length > 0) {
      return "Niciun lead nu corespunde filtrelor selectate.";
    }
    if (activeTab === "action") {
      return "Niciun lead de făcut în acest moment.";
    }
    return "Niciun lead înregistrat în sistem.";
  };

  const countText = `${deFacutMessages.length} de făcut · ${roCount(messages.length, "lead", "lead-uri")}`;

  return (
    <div className="space-y-4 min-w-0 w-full overflow-hidden pb-24">
      {/* Header section */}
      <MessagesHeader
        title="Lead-uri"
        countText={countText}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        selectedTypes={selectedTypes}
        onSelectedTypesChange={setSelectedTypes}
        selectedStatuses={selectedStatuses}
        onSelectedStatusesChange={setSelectedStatuses}
        baseMessages={baseMessagesForSheet}
      />

      {/* Segmented Control Tabs */}
      <div className="grid grid-cols-2 p-1 bg-muted/60 border border-border rounded-lg">
        <button
          type="button"
          onClick={() => handleTabChange("action")}
          className={cn(
            "min-h-[44px] lg:min-h-[36px] flex items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-all cursor-pointer select-none",
            activeTab === "action"
              ? "bg-card text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>De făcut</span>
          <span
            className={cn(
              "text-[11px] px-1.5 py-0.5 rounded-full font-medium tabular-nums",
              activeTab === "action"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {deFacutMessages.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("all")}
          className={cn(
            "min-h-[44px] lg:min-h-[36px] flex items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-all cursor-pointer select-none",
            activeTab === "all"
              ? "bg-card text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Toate</span>
          <span
            className={cn(
              "text-[11px] px-1.5 py-0.5 rounded-full font-medium tabular-nums",
              activeTab === "all"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {messages.length}
          </span>
        </button>
      </div>

      {/* Main content area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : sortedMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <Mail className="w-12 h-12 mb-4 opacity-50" />
          <h3 className="text-[17px] font-semibold text-foreground">Niciun lead găsit</h3>
          <p className="text-[13px] text-muted-foreground mt-1">{getEmptyStateMessage()}</p>
        </div>
      ) : isMobile ? (
        /* Mobile list: One bordered container, rows separated by hairline */
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {sortedMessages.map((message, index) => {
            const isSelected = activeLeadId === message.id;
            const ageBand = getLeadAgeBand(message.createdAt);
            const isVechi = ageBand === "vechi";

            return (
              <div
                key={message.id}
                onClick={() => handleSelectMessage(message)}
                className={cn(
                  "min-h-[48px] px-3.5 py-2.5 flex flex-col justify-center gap-1 cursor-pointer transition-colors select-none hover:bg-muted/50",
                  index > 0 && "border-t border-border",
                  isSelected && "bg-primary/10"
                )}
              >
                {/* Line 1: unread dot, name, relative time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {!message.isRead && (
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          isVechi
                            ? "bg-destructive animate-pulse"
                            : "bg-primary"
                        )}
                      />
                    )}
                    <span className="text-[15px] font-medium text-foreground truncate">
                      {message.name || "Fără nume"}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "text-[12px] tabular-nums shrink-0 ml-2",
                      isVechi ? "text-destructive font-medium" : "text-muted-foreground"
                    )}
                  >
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                      locale: ro,
                    })}
                  </span>
                </div>

                {/* Line 2: type pill, linked car title or phrase, status pill (if not NEW) */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0",
                      TYPE_COLORS[message.type] || "bg-muted text-foreground"
                    )}
                  >
                    {TYPE_LABELS[message.type] || message.type}
                  </span>

                  <span className="text-[13px] text-muted-foreground truncate flex-1 min-w-0">
                    {message.listing?.title || "Fără mașină"}
                  </span>

                  {message.status !== "NEW" && (
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ml-auto",
                        getStatusPillClass(message.status)
                      )}
                    >
                      {STATUS_LABELS[message.status] || message.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop dense table layout (preserved intact) */
        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-6">
                  Client
                </th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Mașină
                </th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-6">
                  Primit
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMessages.map((message) => {
                const isSelected = activeLeadId === message.id;
                const rowClass = getRowClass(message) + (isSelected ? "bg-primary-light/40 " : "");
                const isRed = !message.isRead && isOlderThan2Hours(message.createdAt) && message.status !== "LOST";
                const timeClass = `text-xs text-right pr-6 whitespace-nowrap ${
                  isRed ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-muted-foreground"
                }`;

                return (
                  <tr
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={rowClass}
                  >
                    {/* Contact info with indicators */}
                    <td className="p-3 pl-6">
                      <div className="flex items-center gap-2">
                        {!message.isRead ? (
                          isRed ? (
                            <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500 flex-shrink-0 animate-pulse" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-transparent flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {message.name}
                          </div>
                          {message.phone && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {message.phone}
                            </div>
                          )}
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1",
                            TYPE_COLORS[message.type] || "bg-muted text-foreground"
                          )}>
                            {TYPE_LABELS[message.type]}
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Associated Car name */}
                    <td className="p-3 text-sm text-foreground max-w-[240px] truncate">
                      {message.listing ? (
                        message.listing.title
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Status badge */}
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusPillClass(message.status)}`}>
                        {STATUS_LABELS[message.status]}
                      </span>
                    </td>
                    {/* Relative arrival time */}
                    <td className={timeClass}>
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                        locale: ro,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sheet Panel */}
      <LeadDetailPanel
        messageId={activeLeadId}
        onClose={handleClosePanel}
        onMessageUpdated={handleMessageUpdated}
        orderedIds={sortedMessages.map((m) => m.id)}
        onNavigate={handleNavigateLead}
      />

      <NewLeadDialog
        open={isNewLeadOpen}
        onOpenChange={setIsNewLeadOpen}
        onSuccess={(newLeadId) => {
          handleMessageUpdated();
          const params = new URLSearchParams(searchParams);
          params.set("lead", newLeadId);
          setSearchParams(params);
        }}
      />
    </div>
  );
};

export default MessagesPage;
