import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Send, Phone } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "react-hot-toast";
import {
  getConversations,
  getConversationMessages,
  sendConversationMessage,
  ConversationSummary,
  DealerMessage
} from "@/services/api";
import { cn } from "@/lib/utils";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";
import DealerDetailSheet from "@/components/network/DealerDetailSheet";

const isDifferentDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
};

const getDayLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) return "azi";
  if (isYesterday(d)) return "ieri";
  return format(d, "d MMMM", { locale: ro });
};

export default function NetworkThread() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [isDealerSheetOpen, setIsDealerSheetOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Get conversations list to find current details
  const { data: conversations, isLoading: isConvLoading, isError: isConvError, error: convError } = useQuery<ConversationSummary[]>({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const conversation = conversations?.find((c) => c.id === conversationId);

  // 2. Get messages for this conversation
  const { data: messages, isLoading: isMsgsLoading, isError: isMsgsError, error: msgsError } = useQuery<DealerMessage[]>({
    queryKey: ["conversation-messages", conversationId],
    queryFn: () => getConversationMessages(conversationId!),
    refetchInterval: 5000,
    enabled: !!conversationId,
  });

  // 3. Mutation to send a message
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (body: string) => sendConversationMessage(conversationId!, { body }),
    onSuccess: () => {
      setMessageText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.message || "Eroare la trimiterea mesajului.";
      toast.error(errMsg);
    },
  });

  // 4. Invalidation on cleanup (when unmounting or navigating away)
  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["network-summary"] });
    };
  }, [queryClient]);

  // 5. Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    if (messages) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // 6. Manage height of textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(44, Math.min(textarea.scrollHeight, 120))}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [messageText]);

  const handleSend = () => {
    if (!messageText.trim() || isSending) return;
    sendMessage(messageText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOffline = (isConvError && isForbidden(convError)) || (isMsgsError && isForbidden(msgsError));

  if (isOffline) {
    return (
      <div className="flex flex-col w-full min-h-[calc(100dvh-10rem)] min-h-0 relative">
        {/* HEADER */}
        <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/network/messages")}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 rounded-full shrink-0"
            aria-label="Înapoi"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-semibold truncate leading-tight">
              Mesaje
            </h1>
          </div>
        </div>
        <div className="mt-4">
          <NetworkOffline />
        </div>
      </div>
    );
  }

  if (isConvLoading && !conversation) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-[15px] text-muted-foreground">Se încarcă...</span>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[15px] text-center">
        Conversația nu a fost găsită.
      </div>
    );
  }

  // Subtitle logic
  const city = conversation.otherDealer?.city;
  const subtitleParts: string[] = [];
  if (city) {
    subtitleParts.push(city);
  }
  if (conversation.contextType === "TRADE") {
    subtitleParts.push("despre o mașină");
  } else if (conversation.contextType === "TRANSPORT") {
    subtitleParts.push("despre un transport");
  }
  const subtitle = subtitleParts.join(" · ");

  return (
    <div className="flex flex-col w-full min-h-[calc(100dvh-10rem)] min-h-0 relative">
      {/* HEADER */}
      <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 flex items-center gap-3 border-b border-border/40">
        <button
          type="button"
          onClick={() => navigate("/network/messages")}
          className="w-11 h-11 border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-muted/50 shrink-0 min-h-[44px] min-w-[44px] transition-colors"
          aria-label="Înapoi la mesaje"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Dealer name as pressable button */}
        <button
          type="button"
          onClick={() => setIsDealerSheetOpen(true)}
          className="flex-1 min-w-0 min-h-[44px] py-1 text-left flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-lg"
          aria-label={`Vezi profilul dealerului ${conversation.otherDealer?.name}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[17px] font-semibold text-foreground truncate leading-tight">
                {conversation.otherDealer?.name}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
            {subtitle && (
              <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </button>

        {conversation.otherDealer?.contactPhone && (
          <a
            href={`tel:${conversation.otherDealer.contactPhone}`}
            className="w-11 h-11 border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-muted shrink-0 min-h-[44px] min-w-[44px] transition-colors"
            aria-label={`Sună pe ${conversation.otherDealer.name}`}
          >
            <Phone className="w-5 h-5" />
          </a>
        )}
      </div>

      {/* MESSAGE LIST */}
      <div className="flex flex-col gap-3 min-w-0 w-full flex-1 mt-4">
        {isMsgsLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-[15px] text-muted-foreground">Se încarcă mesajele...</span>
          </div>
        ) : isMsgsError ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[15px] text-center">
            A apărut o eroare la încărcarea mesajelor.
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-[15px] text-muted-foreground">Încă niciun mesaj. Scrie primul.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full pb-4">
            {messages.map((msg, idx) => {
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showSeparator =
                !prevMsg || isDifferentDay(new Date(prevMsg.createdAt), new Date(msg.createdAt));
              const timeStr = format(new Date(msg.createdAt), "HH:mm");

              return (
                <div key={msg.id} className="flex flex-col gap-1 w-full min-w-0">
                  {showSeparator && (
                    <div className="flex justify-center my-3">
                      <span className="text-[12px] text-muted-foreground font-medium">
                        {getDayLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex flex-col max-w-[80%] gap-1 min-w-0",
                      msg.fromMe ? "self-end items-end ml-auto" : "self-start items-start mr-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 text-[15px] [overflow-wrap:anywhere] whitespace-pre-wrap",
                        msg.fromMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-foreground"
                      )}
                    >
                      {msg.body}
                    </div>
                    <span
                      className={cn(
                        "text-[12px] text-muted-foreground px-1",
                        msg.fromMe ? "self-end" : "self-start"
                      )}
                    >
                      {timeStr}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* COMPOSER */}
      <div className="sticky bottom-16 lg:bottom-0 -mx-4 px-4 py-3 bg-admin-bg border-t border-border flex items-end gap-2 z-20 mt-auto">
        <textarea
          ref={textareaRef}
          id="network-thread-message-input"
          name="message"
          rows={1}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrie un mesaj…"
          className="flex-1 text-[15px] text-foreground placeholder:text-muted-foreground bg-card border border-border rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] max-h-[120px] overflow-y-auto"
        />
        <button
          type="button"
          disabled={!messageText.trim() || isSending}
          onClick={handleSend}
          className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Trimite"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* DEALER DETAIL SHEET */}
      <DealerDetailSheet
        dealer={conversation.otherDealer}
        isOpen={isDealerSheetOpen}
        onClose={() => setIsDealerSheetOpen(false)}
        hideMessageAction={true}
      />
    </div>
  );
}
