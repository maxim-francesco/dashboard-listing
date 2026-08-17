import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import api, { toggleMessageRead } from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  LeadDetailPanel,
  STATUS_LABELS,
  STATUS_COLORS,
  TYPE_LABELS,
  TYPE_COLORS,
} from "@/components/leads/LeadDetailPanel";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";


interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: "GENERAL" | "STOCK" | "ORDER" | "BUYBACK" | "FINANCING";
  status: "NEW" | "CONTACTED" | "VIEWING" | "OFFER" | "WON" | "LOST";
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

const MessagesPage = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [counts, setCounts] = useState<MessageCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeLeadId = searchParams.get("lead");
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  // Filter states
  const [activeTab, setActiveTab] = useState<"action" | "all" | "FINANCING" | "NEW" | "CONTACTED" | "VIEWING" | "OFFER" | "WON" | "LOST">("action");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(() => {
    const t = searchParams.get("type");
    return t ? t.toUpperCase() : "ALL";
  });


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
        fetchCounts(); // update counts
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

  // Helper check for actionNeeded logic
  const isActionNeeded = (m: Message) => {
    if (m.status === "NEW") return true;
    if (m.reminderAt && m.status !== "WON" && m.status !== "LOST") {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      return new Date(m.reminderAt) <= endOfToday;
    }
    return false;
  };

  // Client-side filtering logic
  const filteredByTab = messages.filter((m) => {
    if (activeTab === "action") return isActionNeeded(m);
    if (activeTab === "all") return true;
    if (activeTab === "FINANCING") return m.type === "FINANCING";
    return m.status === activeTab;
  });

  const filteredMessages = filteredByTab.filter((m) => {
    // Search query filtering
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const nameMatch = m.name?.toLowerCase().includes(query);
      const phoneMatch = m.phone?.toLowerCase().includes(query);
      const messageMatch = m.message?.toLowerCase().includes(query);
      if (!nameMatch && !phoneMatch && !messageMatch) return false;
    }
    // Type dropdown filtering
    if (typeFilter !== "ALL") {
      if (m.type !== typeFilter) return false;
    }
    return true;
  });


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
    switch (activeTab) {
      case "action":
        return "Niciun lead care necesită acțiune.";
      case "all":
        return "Niciun lead înregistrat în sistem.";
      case "FINANCING":
        return "Niciun lead de finanțare.";
      case "NEW":
        return "Niciun lead nou.";
      case "CONTACTED":
        return "Niciun lead contactat.";
      case "VIEWING":
        return "Niciun lead în vizionare.";
      case "OFFER":
        return "Niciun lead cu ofertă propusă.";
      case "WON":
        return "Niciun lead câștigat încă.";
      case "LOST":
        return "Niciun lead pierdut.";
      default:
        return "Niciun lead găsit.";
    }
  };

  const tabs = [
    { id: "action", label: "Necesită acțiune", count: counts?.actionNeeded ?? 0 },
    { id: "all", label: "Toate", count: messages.length },
    { id: "FINANCING", label: "Finanțare", count: counts?.byType?.FINANCING ?? messages.filter((m) => m.type === "FINANCING").length },
    { id: "NEW", label: "Noi", count: counts?.byStatus?.NEW ?? 0 },
    { id: "CONTACTED", label: "Contactate", count: counts?.byStatus?.CONTACTED ?? 0 },
    { id: "VIEWING", label: "Vizionare", count: counts?.byStatus?.VIEWING ?? 0 },
    { id: "OFFER", label: "Ofertă", count: counts?.byStatus?.OFFER ?? 0 },
    { id: "WON", label: "Câștigate", count: counts?.byStatus?.WON ?? 0 },
    { id: "LOST", label: "Pierdute", count: counts?.byStatus?.LOST ?? 0 },
  ];

  return (
    <div className="space-y-6 min-w-0 w-full overflow-hidden">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead-uri</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {messages.length} lead-uri, {messages.filter((m) => !m.isRead).length} necitite
          </p>
        </div>
        <Button onClick={() => setIsNewLeadOpen(true)} className="hidden md:inline-flex bg-primary hover:bg-primary-hover text-primary-foreground font-semibold flex-shrink-0">
          + Lead nou
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border gap-2 mt-4 scrollbar-none pb-px whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-3 pt-2 px-3 text-sm font-medium border-b-2 transition-all relative flex items-center gap-1.5 whitespace-nowrap flex-shrink-0",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
              tab.id === "WON" && "md:ml-auto"
            )}
          >
            <span>{tab.label}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : tab.id === "WON"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : tab.id === "LOST"
                    ? "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300"
                    : "bg-secondary text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Caută după nume, telefon sau text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 md:h-10 text-base md:text-sm pl-9"
          />
          <span className="absolute left-3 top-3 text-muted-foreground text-xs">🔍</span>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px] h-11 md:h-10 text-base md:text-sm bg-background border-border">
            <SelectValue placeholder="Filtrează după tip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toate tipurile</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main content area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <Mail className="w-12 h-12 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">Niciun lead găsit</h3>
          <p className="text-sm mt-1">{getEmptyStateMessage()}</p>
        </div>
      ) : isMobile ? (
        /* Mobile stacked layout */
        <div className="space-y-3 pb-24">
          {filteredMessages.map((message) => {
            const isSelected = activeLeadId === message.id;
            const isRed = !message.isRead && isOlderThan2Hours(message.createdAt) && message.status !== "LOST";
            
            let itemBg = "bg-card border border-border rounded-xl p-4 cursor-pointer transition-colors ";
            if (isSelected) {
              itemBg += "border-primary bg-primary-light/20 ";
            } else if (isRed) {
              itemBg += "bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-950/30 ";
            } else if (message.status === "LOST") {
              itemBg += "opacity-60 ";
            }

            return (
              <div
                key={message.id}
                onClick={() => handleSelectMessage(message)}
                className={itemBg}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!message.isRead ? (
                      isRed ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 dark:bg-rose-500 flex-shrink-0 animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                      )
                    ) : null}
                    <div className="font-semibold text-foreground text-sm">{message.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      TYPE_COLORS[message.type] || "bg-muted text-foreground"
                    )}>
                      {TYPE_LABELS[message.type]}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusPillClass(message.status)}`}>
                      {STATUS_LABELS[message.status]}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  {message.phone && <div>📞 {message.phone}</div>}
                  {message.listing && <div>🚗 {message.listing.title}</div>}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span />
                  <span className={isRed ? "text-rose-600 dark:text-rose-400 font-semibold" : ""}>
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                      locale: ro,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop dense table layout */
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
              {filteredMessages.map((message) => {
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
        orderedIds={filteredMessages.map((m) => m.id)}
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

      {/* Mobile Floating Action Button (FAB) */}
      {isMobile && (
        <Button
          onClick={() => setIsNewLeadOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg flex items-center justify-center z-40 border-none"
          title="Adaugă lead nou"
        >
          <span className="text-2xl font-bold">+</span>
        </Button>
      )}
    </div>

  );
};

export default MessagesPage;
