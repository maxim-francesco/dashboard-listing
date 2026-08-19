import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InitialsAvatar from "@/components/ui/InitialsAvatar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Mail,
  Trash2,
  Plus,
  Loader2,
  ImageIcon,
  ExternalLink,
  Clock,
  Link2Off,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MailOpen,
  Sparkles,
  Send,
  MoreVertical,
  Calendar as CalendarIcon,
  Car,
} from "lucide-react";
import {
  getMessageDetail,
  updateMessageStatus,
  updateMessage,
  createMessageNote,
  updateMessageReminder,
  getActiveListings,
  toggleMessageRead,
  deleteMessage,
  MessageDetail,
  MessageActivity,
  suggestReply
} from "@/services/api";
import { format, formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizeRoPhone, waLink, telLink } from "@/utils/phone";
import { cn } from "@/lib/utils";
import { LeadStatusSheet, LeadStatus } from "./LeadStatusSheet";
import { LeadCarSheet } from "./LeadCarSheet";
import { LeadInteresSheet, LeadType } from "./LeadInteresSheet";
import { LeadReminderSheet } from "./LeadReminderSheet";

export {
  TYPE_LABELS,
  STATUS_LABELS,
  LOST_REASON_LABELS,
  TYPE_COLORS,
  STATUS_COLORS,
} from "./leadConstants";
import {
  TYPE_LABELS,
  STATUS_LABELS,
  LOST_REASON_LABELS,
  TYPE_COLORS,
  STATUS_COLORS,
} from "./leadConstants";

interface LeadDetailPanelProps {
  messageId: string | null;
  onClose: () => void;
  onMessageUpdated?: () => void;
  orderedIds?: string[];
  onNavigate?: (id: string) => void;
}

export const LeadDetailPanel = ({
  messageId,
  onClose,
  onMessageUpdated,
  orderedIds = [],
  onNavigate,
}: LeadDetailPanelProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [lead, setLead] = useState<MessageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Mobile Bottom Sheets
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [carSheetOpen, setCarSheetOpen] = useState(false);
  const [interesSheetOpen, setInteresSheetOpen] = useState(false);
  const [reminderSheetOpen, setReminderSheetOpen] = useState(false);

  // Mobile Collapsibles (both closed on open)
  const [notesOpen, setNotesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // AlertDialogs for replacing window.confirm
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [pendingType, setPendingType] = useState<LeadType | null>(null);
  
  // Note state
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Lost Reason state for desktop fallback
  const [lostReasonOpen, setLostReasonOpen] = useState(false);
  const [tempLostReason, setTempLostReason] = useState<string>("");

  // AI Reply state & mutation
  const [aiReply, setAiReply] = useState<string>("");
  const replyMutation = useMutation({
    mutationFn: () => suggestReply(lead!.id),
    onSuccess: (data) => setAiReply(data.reply),
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Nu s-a putut genera răspunsul.");
    },
  });

  useEffect(() => {
    setAiReply("");
    setNotesOpen(false);
    setHistoryOpen(false);
    if (messageId) {
      loadLeadDetail();
      loadActiveListings();
    } else {
      setLead(null);
      setLostReasonOpen(false);
      setTempLostReason("");
    }
  }, [messageId]);

  const loadLeadDetail = async () => {
    if (!messageId) return;
    setIsLoading(true);
    try {
      const data = await getMessageDetail(messageId);
      setLead(data);
      
      // Auto mark read if unread
      if (!data.isRead) {
        await toggleMessageRead(messageId, true);
        if (onMessageUpdated) {
          onMessageUpdated();
        }
        // Locally update status so it reflects read immediately
        setLead(prev => prev ? { ...prev, isRead: true } : null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Eroare la încărcarea detaliilor lead-ului.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveListings = async () => {
    setListingsLoading(true);
    try {
      const data = await getActiveListings();
      setListings(data);
    } catch (error) {
      console.error("Eroare la preluarea anunțurilor active:", error);
    } finally {
      setListingsLoading(false);
    }
  };

  const handleStatusChange = async (
    newStatus: LeadStatus,
    lostReason?: string
  ) => {
    if (!lead) return;
    
    if (newStatus === "LOST") {
      try {
        await updateMessageStatus(lead.id, {
          status: "LOST",
          lostReason: (lostReason || "PRICE") as any,
        });
        toast.success("Marcat ca Pierdut.");
        if (onMessageUpdated) onMessageUpdated();
        loadLeadDetail();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Eroare la salvarea statusului Pierdut.");
      }
      return;
    }

    try {
      await updateMessageStatus(lead.id, { status: newStatus });
      if (newStatus === "WON") {
        toast.success("Marcat ca Câștigat.");
      } else {
        toast.success(`Status schimbat în ${STATUS_LABELS[newStatus]}`);
      }
      if (onMessageUpdated) onMessageUpdated();
      loadLeadDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Eroare la actualizarea statusului.");
    }
  };

  const handleConfirmLostStatus = async () => {
    if (!lead || !tempLostReason) return;
    try {
      await updateMessageStatus(lead.id, {
        status: "LOST",
        lostReason: tempLostReason as any
      });
      toast.success("Marcat ca Pierdut.");
      setLostReasonOpen(false);
      if (onMessageUpdated) onMessageUpdated();
      loadLeadDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Eroare la salvarea statusului Pierdut.");
    }
  };

  const handleLinkListing = async (listingId: string | null) => {
    if (!lead) return;
    try {
      await updateMessage(lead.id, { listingId });
      toast.success(listingId ? "Anunț legat cu succes" : "Anunț dezlegat cu succes");
      if (onMessageUpdated) onMessageUpdated();
      loadLeadDetail();
      setComboboxOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Eroare la actualizarea anunțului asociat.");
    }
  };

  const handleTypeChange = async (newType: LeadType) => {
    if (!lead) return;

    const hasLinkedListing = !!(lead.listingId || lead.listing?.id);
    const shouldUnlink = newType !== "STOCK" && hasLinkedListing;

    if (shouldUnlink) {
      setPendingType(newType);
      setUnlinkDialogOpen(true);
      return;
    }

    executeTypeChange(newType, false);
  };

  const executeTypeChange = async (newType: LeadType, unlinkCar: boolean) => {
    if (!lead) return;
    try {
      const payload: any = { type: newType };
      if (unlinkCar) {
        payload.listingId = null;
      }

      await updateMessage(lead.id, payload);

      if (unlinkCar) {
        toast.success("Interes modificat și autovehiculul a fost dezlegat.");
      } else {
        toast.success(`Interes modificat în ${TYPE_LABELS[newType]}`);
      }

      if (onMessageUpdated) onMessageUpdated();
      loadLeadDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Eroare la actualizarea interesului.");
    }
  };

  const handleConfirmUnlinkAndTypeChange = async () => {
    if (pendingType) {
      await executeTypeChange(pendingType, true);
      setPendingType(null);
    }
    setUnlinkDialogOpen(false);
  };

  const handleReminderChange = async (val: string) => {
    if (!lead) return;
    if (!val) return;
    const isoString = new Date(val).toISOString();
    try {
      await updateMessageReminder(lead.id, { reminderAt: isoString });
      toast.success("Reminder setat cu succes.");
      if (onMessageUpdated) onMessageUpdated();
      loadLeadDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Eroare la setarea reminderului.");
    }
  };

  const handleClearReminder = async () => {
    if (!lead) return;
    try {
      await updateMessageReminder(lead.id, { reminderAt: null });
      toast.success("Reminder șters.");
      if (onMessageUpdated) onMessageUpdated();
      loadLeadDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Eroare la ștergerea reminderului.");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      await createMessageNote(lead.id, { body: newNote.trim() });
      toast.success("Notă adăugată.");
      setNewNote("");
      loadLeadDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Eroare la adăugarea notei.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Toggle read state from details panel
  const handleToggleReadLocal = async () => {
    if (!lead) return;
    const newStatus = !lead.isRead;
    try {
      await toggleMessageRead(lead.id, newStatus);
      toast.success(newStatus ? "Mesaj marcat ca citit." : "Mesaj marcat ca necitit.");
      if (onMessageUpdated) onMessageUpdated();
      setLead(prev => prev ? { ...prev, isRead: newStatus } : null);
    } catch (error) {
      toast.error("Nu s-a putut actualiza statusul.");
    }
  };

  // Delete message from details panel with AlertDialog
  const handleConfirmDelete = async () => {
    if (!lead || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteMessage(lead.id);
      toast.success("Mesajul a fost șters.");
      if (onMessageUpdated) onMessageUpdated();
      setDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      toast.error("Nu s-a putut șterge mesajul.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Navigation handlers
  const currentIndex = orderedIds && messageId ? orderedIds.indexOf(messageId) : -1;
  const hasPrev = orderedIds && currentIndex > 0;
  const hasNext = orderedIds && currentIndex >= 0 && currentIndex < orderedIds.length - 1;

  const handlePrev = () => {
    if (hasPrev && onNavigate && orderedIds) {
      onNavigate(orderedIds[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate && orderedIds) {
      onNavigate(orderedIds[currentIndex + 1]);
    }
  };

  // Quick Action normalization helpers
  const carTitle = lead?.listing?.title || "";
  const waMessage = carTitle 
    ? `Bună ziua, ați întrebat de ${carTitle} de la noi...`
    : "Bună ziua...";
  const waText = aiReply.trim() ? aiReply : waMessage;
  const waUrlFinal = lead?.phone ? waLink(lead.phone, waText) : "";

  // Date utilities for desktop input
  const formatInputDateTime = (isoString: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Helper to render activities in Romanian
  const renderActivityContent = (act: MessageActivity) => {
    switch (act.kind) {
      case "CREATED":
        return <span className="font-medium text-foreground">Lead creat prin formularul de contact.</span>;
      case "STATUS_CHANGED":
        return (
          <span>
            Status schimbat din <span className="font-medium text-foreground">{STATUS_LABELS[act.fromValue || ""] || act.fromValue}</span> în{" "}
            <span className="font-medium text-foreground">{STATUS_LABELS[act.toValue || ""] || act.toValue}</span>.
          </span>
        );
      case "TYPE_CHANGED":
        return (
          <span>
            Tip lead schimbat din <span className="font-medium text-foreground">{TYPE_LABELS[act.fromValue || ""] || act.fromValue}</span> în{" "}
            <span className="font-medium text-foreground">{TYPE_LABELS[act.toValue || ""] || act.toValue}</span>.
          </span>
        );
      case "LINKED_LISTING":
        return act.toValue ? (
          <span>Anunț legat de lead.</span>
        ) : (
          <span>Anunț dezlegat de lead.</span>
        );
      case "REMINDER_SET":
        return (
          <span>
            Reminder setat pentru{" "}
            <span className="font-medium text-foreground">
              {act.toValue ? format(new Date(act.toValue), "dd MMM yyyy, HH:mm", { locale: ro }) : ""}
            </span>.
          </span>
        );
      case "REMINDER_CLEARED":
        return <span>Reminder șters.</span>;
      case "NOTE":
        return (
          <div className="mt-1 p-2 bg-secondary text-secondary-foreground rounded text-sm break-words whitespace-pre-wrap">
            {act.body}
          </div>
        );
      default:
        return <span>Activitate înregistrată.</span>;
    }
  };

  // Filter notes
  const notes = lead?.activities
    ? [...lead.activities].filter((act) => act.kind === "NOTE").reverse()
    : [];

  const renderAiReplySection = () => {
    if (!lead) return null;
    const replyText = aiReply.trim();
    const replyWaUrl = lead.phone && replyText ? waLink(lead.phone, aiReply) : "";
    return (
      <div className="space-y-3 mt-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Răspuns rapid AI</h3>
        </div>

        {!aiReply && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary/5 text-[13px]"
            onClick={() => replyMutation.mutate()}
            disabled={replyMutation.isPending}
          >
            {replyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Se generează...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Propune răspuns</span>
              </>
            )}
          </Button>
        )}

        {aiReply && (
          <div className="space-y-2 rounded-xl border border-border bg-background p-3">
            <label htmlFor="lead-ai-reply-textarea" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block">
              Răspuns propus (editează dacă vrei)
            </label>
            <Textarea
              id="lead-ai-reply-textarea"
              name="lead-ai-reply-textarea"
              value={aiReply}
              onChange={(e) => setAiReply(e.target.value)}
              className="text-[13px] min-h-[110px] border-border bg-background"
              rows={5}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-[2] min-h-[44px] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-[13px] rounded-lg border-none disabled:opacity-50"
                disabled={!lead.phone || !replyText}
                onClick={() => replyWaUrl && window.open(replyWaUrl, "_blank")}
              >
                <Send className="w-4 h-4" />
                <span>Trimite pe WhatsApp</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] px-3 flex items-center justify-center gap-2 border-border text-muted-foreground hover:bg-secondary text-[13px] rounded-lg"
                onClick={() => replyMutation.mutate()}
                disabled={replyMutation.isPending}
                title="Regenerează"
              >
                {replyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span className="text-[12px]">Regenerează</span>
              </Button>
            </div>
            {!lead.phone && (
              <p className="text-[11px] text-muted-foreground">Acest lead nu are număr de telefon salvat.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Local renderers for Desktop layout sections
  const renderCarSection = () => {
    if (!lead) return null;

    if (lead.type !== "STOCK") {
      let hintText = "";
      if (lead.type === "ORDER") {
        hintText = "Client caută o mașină pe care nu o ai în stoc. Detaliile cererii sunt în mesajul inițial.";
      } else if (lead.type === "BUYBACK") {
        hintText = "Clientul vrea să-și vândă mașina. Detaliile sunt în mesajul inițial.";
      } else {
        hintText = "Mesaj de contact general, fără o mașină anume.";
      }
      return (
        <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground leading-relaxed">
          {hintText}
        </div>
      );
    }

    return lead.listing ? (
      <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex gap-3">
          {lead.listing.images && lead.listing.images.length > 0 ? (
            <img
              src={lead.listing.images[0].url}
              alt={lead.listing.title}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate max-w-[200px]">
              {lead.listing.title}
            </h4>
            <p className="text-sm font-medium text-primary mt-1">
              {lead.listing.price
                ? new Intl.NumberFormat("ro-RO", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(lead.listing.price)
                : "Preț nespecificat"}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => navigate(`/listings/${lead.listing.id}/edit`)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                <span>Editează anunțul</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              {lead.listing.publicUrl && !lead.listing.publicUrl.includes("example.com") && (
                <a
                  href={lead.listing.publicUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline font-medium"
                >
                  <span>Vezi public</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive flex items-center justify-center flex-shrink-0"
          onClick={() => handleLinkListing(null)}
          title="Dezactivează legătura"
        >
          <Link2Off className="w-4 h-4" />
        </Button>
      </div>
    ) : (
      <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">Niciun anunț conectat de acest lead.</p>
        
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboboxOpen}
              className="w-full justify-between text-xs border-border"
              disabled={listingsLoading}
            >
              {listingsLoading ? "Se încarcă anunțurile..." : "Leagă un anunț"}
              <span className="opacity-50 text-[10px]">▼</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[380px] sm:w-[430px] p-0 bg-popover border-border z-[100]">
            <Command className="w-full">
              <CommandInput placeholder="Căutare anunț după titlu..." className="border-none focus:ring-0" />
              <CommandList className="max-h-[250px] overflow-y-auto">
                <CommandEmpty>Nu s-a găsit niciun anunț.</CommandEmpty>
                <CommandGroup>
                  {listings.map((l) => (
                    <CommandItem
                      key={l.id}
                      value={l.title}
                      onSelect={() => handleLinkListing(l.id)}
                      className="text-foreground hover:bg-secondary cursor-pointer flex items-center justify-between p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {l.images && l.images.length > 0 ? (
                          <img src={l.images[0].url} alt="" className="w-8 h-8 object-cover rounded" />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                        )}
                        <span>{l.title}</span>
                      </div>
                      <span className="font-semibold text-primary">
                        {l.price ? `${l.price} EUR` : ""}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const renderInteresSection = () => {
    if (!lead) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Interes</h3>
        <Select
          value={lead.type}
          onValueChange={(val) => handleTypeChange(val as any)}
        >
          <SelectTrigger className="w-full h-11 md:h-10 text-base md:text-xs bg-background border-border">
            <SelectValue placeholder="Selectează tip interes" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="GENERAL" className="text-base md:text-xs">Contact general</SelectItem>
            <SelectItem value="STOCK" className="text-base md:text-xs">Mașină din stoc</SelectItem>
            <SelectItem value="ORDER" className="text-base md:text-xs">Mașină la comandă</SelectItem>
            <SelectItem value="BUYBACK" className="text-base md:text-xs">Buyback</SelectItem>
            <SelectItem value="FINANCING" className="text-base md:text-xs">Finanțare</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderPipelineSection = () => {
    if (!lead) return null;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5 md:flex md:flex-wrap md:gap-2">
          {Object.entries(STATUS_LABELS).map(([k, v]) => {
            const isActive = lead.status === k;
            return (
              <Button
                key={k}
                type="button"
                variant={isActive ? "default" : "outline"}
                onClick={() => {
                  if (k === "LOST") {
                    setTempLostReason("PRICE");
                    setLostReasonOpen(true);
                  } else {
                    handleStatusChange(k as any);
                  }
                }}
                className={`h-11 md:h-8 text-sm md:text-xs font-semibold px-4 md:px-3 rounded-xl md:rounded-full w-full md:w-auto ${
                  isActive
                    ? ""
                    : "border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </Button>
            );
          })}
        </div>

        {(lostReasonOpen || lead.status === "LOST") && (
          <div className="mt-3 p-4 border border-rose-100 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400">
              {lostReasonOpen ? "Selectează motivul pierderii" : "Motivul pierderii"}
            </h4>
            {lostReasonOpen ? (
              <div className="flex gap-2">
                <Select
                  value={tempLostReason}
                  onValueChange={(val) => setTempLostReason(val)}
                >
                  <SelectTrigger className="flex-1 h-11 md:h-9 text-base md:text-xs border-rose-200">
                    <SelectValue placeholder="Alege motivul" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOST_REASON_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-base md:text-xs">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleConfirmLostStatus}
                  className="bg-rose-600 hover:bg-rose-700 text-white h-11 md:h-9 text-base md:text-xs px-4 md:px-3"
                >
                  Confirmă
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLostReasonOpen(false);
                    setTempLostReason("");
                  }}
                  className="h-11 md:h-9 text-base md:text-xs border-border px-4 md:px-3"
                >
                  Anulează
                </Button>
              </div>
            ) : (
              <p className="text-sm font-medium text-rose-900 dark:text-rose-300">
                {LOST_REASON_LABELS[lead.lostReason || ""] || lead.lostReason}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderReminderSection = () => {
    if (!lead) return null;
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            id="desktop-reminder-input"
            name="desktop-reminder-input"
            type="datetime-local"
            value={formatInputDateTime(lead.reminderAt)}
            onChange={(e) => handleReminderChange(e.target.value)}
            className="h-11 md:h-9 text-base md:text-xs border-border pr-8 bg-background"
          />
        </div>
        {lead.reminderAt && (
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10 h-11 md:h-9 text-base md:text-xs px-4 md:px-3 flex items-center justify-center"
            onClick={handleClearReminder}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Șterge reminder
          </Button>
        )}
      </div>
    );
  };

  const renderNotesSection = () => {
    return (
      <div className="space-y-4">
        <form onSubmit={handleAddNote} className="space-y-2">
          <Textarea
            id="lead-note-input"
            name="lead-note-input"
            placeholder="Scrie o notă nouă..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="text-base md:text-xs min-h-[80px] border-border bg-background"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingNote || !newNote.trim()}
              className="h-11 md:h-8 text-base md:text-xs px-4 md:px-3 flex items-center"
            >
              {isSubmittingNote ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 mr-1.5" />
              )}
              Adaugă notă
            </Button>
          </div>
        </form>

        {notes.length > 0 ? (
          <div className="space-y-3 mt-3">
            {notes.map((n) => (
              <div key={n.id} className="p-3 bg-secondary rounded-lg border border-border text-xs">
                <p className="text-secondary-foreground break-words whitespace-pre-wrap">{n.body}</p>
                <p className="text-[10px] text-muted-foreground mt-2 text-right">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ro })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Nicio notă adăugată încă.</p>
        )}
      </div>
    );
  };

  const renderTimelineSection = () => {
    if (!lead) return null;
    return lead.activities && lead.activities.length > 0 ? (
      <div className="relative pl-4 border-l border-border space-y-4 text-xs">
        {lead.activities.map((act) => (
          <div key={act.id} className="relative text-left">
            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-border border border-background flex-shrink-0" />
            <div className="text-muted-foreground">
              {renderActivityContent(act)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {format(new Date(act.createdAt), "dd MMM yyyy, HH:mm", { locale: ro })}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-muted-foreground italic">Nicio activitate înregistrată.</p>
    );
  };

  const contentClass = isMobile
    ? "w-screen h-screen max-w-none border-none p-0 gap-0 flex flex-col bg-background shadow-none z-50 left-0 top-0 translate-x-0 translate-y-0 [&>button]:hidden"
    : "sm:max-w-3xl w-[92vw] max-h-[88vh] h-[88vh] flex flex-col p-0 gap-0 border border-border bg-background shadow-2xl z-50 [&>button]:hidden sm:rounded-2xl overflow-hidden";

  return (
    <>
      <Dialog open={!!messageId} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className={contentClass}>
          
          {/* Header */}
          {isMobile ? (
            /* Mobile Header: Close on left, Name over phone in middle, Overflow on right */
            <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
              {/* 1. Close button on the left */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted text-foreground shrink-0"
                aria-label="Închide"
              >
                <X className="w-5 h-5" />
              </Button>

              {/* 2. Name over phone in the middle */}
              <div className="flex-1 min-w-0 text-center">
                <DialogTitle className="text-[17px] font-semibold text-foreground truncate leading-tight">
                  {isLoading ? "Se încarcă..." : lead?.name || "Detalii Lead"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detalii și acțiuni pentru lead
                </DialogDescription>
                {lead?.phone && (
                  <p className="text-[13px] text-muted-foreground truncate leading-tight mt-0.5 tabular-nums">
                    {lead.phone}
                  </p>
                )}
              </div>

              {/* 3. Overflow menu on the right */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted text-foreground shrink-0"
                    aria-label="Mai multe opțiuni"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border min-w-[200px]">
                  {lead?.email && (
                    <DropdownMenuItem
                      onClick={() => window.open(`mailto:${lead.email}`, "_self")}
                      className="cursor-pointer text-[13px] flex items-center gap-2.5 py-2.5"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Trimite email</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleToggleReadLocal}
                    className="cursor-pointer text-[13px] flex items-center gap-2.5 py-2.5"
                  >
                    {lead?.isRead ? (
                      <>
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>Marchează necitit</span>
                      </>
                    ) : (
                      <>
                        <MailOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>Marchează citit</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="cursor-pointer text-[13px] flex items-center gap-2.5 py-2.5 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Șterge lead</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            /* Desktop Sticky Header - preserved exactly */
            <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex flex-col gap-2 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                
                {/* Name / Avatar / Phone details */}
                <div className="flex items-center gap-3 min-w-0">
                  {lead && (
                    <InitialsAvatar name={lead.name} className="w-10 h-10" />
                  )}
                  <div className="min-w-0">
                    <DialogTitle className="text-base font-bold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                      {isLoading ? "Se încarcă..." : lead?.name || "Detalii Lead"}
                    </DialogTitle>
                    <DialogDescription className="sr-only">Detalii și acțiuni pentru lead</DialogDescription>
                    {lead?.phone && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{lead.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Prev/Next and Actions Toolbars */}
                <div className="flex items-center gap-1">
                  {/* Navigation chevrons */}
                  <div className="flex items-center gap-0.5 mr-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-11 h-11 md:w-9 md:h-9 border-border flex items-center justify-center"
                      disabled={!hasPrev}
                      onClick={handlePrev}
                      title="Precedentul lead"
                    >
                      <ChevronLeft className="w-4.5 h-4.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-11 h-11 md:w-9 md:h-9 border-border flex items-center justify-center"
                      disabled={!hasNext}
                      onClick={handleNext}
                      title="Următorul lead"
                    >
                      <ChevronRight className="w-4.5 h-4.5" />
                    </Button>
                  </div>

                  {/* Status and operations */}
                  {!isLoading && lead && (
                    <>
                      <div className="hidden sm:flex items-center gap-2 mr-2">
                        <Badge className={`${STATUS_COLORS[lead.status] || "bg-muted text-foreground"} px-2.5 py-0.5 text-[11px] font-semibold border-none`}>
                          {STATUS_LABELS[lead.status]}
                        </Badge>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        className="w-11 h-11 md:w-9 md:h-9 border-border flex items-center justify-center"
                        onClick={handleToggleReadLocal}
                        title={lead.isRead ? "Marchează necitit" : "Marchează citit"}
                      >
                        {lead.isRead ? (
                          <MailOpen className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Mail className="w-4 h-4 text-primary fill-current" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-11 h-11 md:w-9 md:h-9 border-destructive text-destructive hover:bg-destructive/10 flex items-center justify-center"
                        onClick={() => setDeleteDialogOpen(true)}
                        title="Șterge mesaj"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  {/* Tappable close area */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-secondary text-foreground ml-1"
                    aria-label="Închide"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

              </div>
            </div>
          )}

          {/* Scrollable Body */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center bg-background">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !lead ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-muted-foreground bg-background">
              Nu s-au putut încărca detaliile lead-ului.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto bg-background">
              {isMobile ? (
                /* NEW REBUILT Mobile Layout */
                <div className="p-4 space-y-3.5">
                  
                  {/* 1. Status Row: single row showing status pill, opens bottom sheet */}
                  <button
                    type="button"
                    data-action="open-status-sheet"
                    onClick={() => setStatusSheetOpen(true)}
                    className="w-full min-h-[52px] px-4 py-2.5 bg-card border border-border rounded-xl flex items-center justify-between gap-3 text-left hover:bg-muted/50 transition-colors cursor-pointer select-none"
                  >
                    <span className="text-[13px] font-medium text-foreground">
                      Status
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "px-2.5 py-0.5 text-[11px] font-semibold border-none shrink-0",
                          STATUS_COLORS[lead.status] || "bg-muted text-foreground"
                        )}
                      >
                        {STATUS_LABELS[lead.status]}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </button>

                  {/* 2. Message Card: type pill, relative time, message body, AI reply affordance */}
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    {/* Top row: Type pill and relative time */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        className={cn(
                          "px-2.5 py-0.5 text-[11px] font-semibold border-none shrink-0",
                          TYPE_COLORS[lead.type] || "bg-muted text-foreground"
                        )}
                      >
                        {TYPE_LABELS[lead.type] || lead.type}
                      </Badge>
                      <span className="text-[12px] text-muted-foreground flex items-center gap-1 tabular-nums">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {formatDistanceToNow(new Date(lead.createdAt), {
                            addSuffix: true,
                            locale: ro,
                          })}
                        </span>
                      </span>
                    </div>

                    {/* Message Body */}
                    <p className="text-[14px] text-foreground whitespace-pre-wrap break-words leading-relaxed">
                      {lead.message}
                    </p>

                    {/* AI Reply single line / in-place expansion */}
                    <div className="pt-2 border-t border-border">
                      {!aiReply ? (
                        <button
                          type="button"
                          onClick={() => replyMutation.mutate()}
                          disabled={replyMutation.isPending}
                          className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/50 text-[13px] text-primary font-medium flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            {replyMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-primary shrink-0" />
                            )}
                            <span>
                              {replyMutation.isPending ? "Se generează răspunsul AI..." : "Răspuns rapid AI"}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">Propune</span>
                        </button>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <label htmlFor="lead-mobile-ai-reply" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block">
                            Răspuns AI generat
                          </label>
                          <Textarea
                            id="lead-mobile-ai-reply"
                            name="lead-mobile-ai-reply"
                            value={aiReply}
                            onChange={(e) => setAiReply(e.target.value)}
                            className="text-[13px] min-h-[100px] border-border bg-background"
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              className="flex-[2] min-h-[44px] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-[13px] rounded-lg border-none disabled:opacity-50"
                              disabled={!lead.phone || !aiReply.trim()}
                              onClick={() => {
                                const url = waLink(lead.phone, aiReply.trim());
                                if (url) window.open(url, "_blank");
                              }}
                            >
                              <Send className="w-4 h-4" />
                              <span>Trimite pe WhatsApp</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] px-3 flex items-center justify-center gap-1.5 border-border text-muted-foreground hover:bg-secondary text-[12px] rounded-lg"
                              onClick={() => replyMutation.mutate()}
                              disabled={replyMutation.isPending}
                            >
                              {replyMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                              <span>Regenerează</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. One Settings-style Card holding 3 rows (Car, Interes, Reminder) */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {/* Row 1: Linked Car */}
                    <button
                      type="button"
                      data-action="open-car-sheet"
                      onClick={() => setCarSheetOpen(true)}
                      className="w-full min-h-[52px] px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-muted/50 transition-colors cursor-pointer select-none"
                    >
                      <span className="text-[13px] font-medium text-foreground">
                        Autovehicul
                      </span>
                      <div className="flex items-center gap-2 min-w-0 max-w-[220px]">
                        {lead.listing ? (
                          <>
                            {lead.listing.images && lead.listing.images.length > 0 ? (
                              <img
                                src={lead.listing.images[0].url}
                                alt={lead.listing.title}
                                className="w-7 h-7 object-cover rounded shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 bg-muted rounded flex items-center justify-center shrink-0">
                                <Car className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-[13px] text-muted-foreground truncate">
                              {lead.listing.title}
                            </span>
                            {lead.listing.price ? (
                              <span className="text-[13px] font-semibold text-primary tabular-nums shrink-0">
                                {new Intl.NumberFormat("ro-RO", {
                                  style: "currency",
                                  currency: "EUR",
                                  maximumFractionDigits: 0,
                                }).format(lead.listing.price)}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-[13px] text-muted-foreground">
                            Fără mașină
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>

                    {/* Row 2: Interes */}
                    <button
                      type="button"
                      data-action="open-interes-sheet"
                      onClick={() => setInteresSheetOpen(true)}
                      className="w-full min-h-[52px] px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-muted/50 transition-colors cursor-pointer select-none"
                    >
                      <span className="text-[13px] font-medium text-foreground">
                        Interes
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "px-2.5 py-0.5 text-[11px] font-semibold border-none shrink-0",
                            TYPE_COLORS[lead.type] || "bg-muted text-foreground"
                          )}
                        >
                          {TYPE_LABELS[lead.type] || lead.type}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>

                    {/* Row 3: Recontactare */}
                    <button
                      type="button"
                      data-action="open-reminder-sheet"
                      onClick={() => setReminderSheetOpen(true)}
                      className="w-full min-h-[52px] px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-muted/50 transition-colors cursor-pointer select-none"
                    >
                      <span className="text-[13px] font-medium text-foreground">
                        Recontactare
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                          {lead.reminderAt
                            ? format(new Date(lead.reminderAt), "d MMM, HH:mm", { locale: ro })
                            : "Fără reminder"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                  </div>

                  {/* 4. Note collapsible card (closed on open) */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      data-action="toggle-notes"
                      onClick={() => setNotesOpen((v) => !v)}
                      className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-muted/50 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                          Note
                        </span>
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                          {notes.length}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          notesOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {notesOpen && (
                      <div className="p-4 border-t border-border space-y-3">
                        <form onSubmit={handleAddNote} className="space-y-2">
                          <Textarea
                            id="mobile-lead-new-note"
                            name="mobile-lead-new-note"
                            placeholder="Scrie o notă nouă..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="text-[13px] min-h-[72px] border-border bg-background"
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              size="sm"
                              disabled={isSubmittingNote || !newNote.trim()}
                              className="min-h-[44px] text-[13px] px-4 flex items-center font-medium"
                            >
                              {isSubmittingNote ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4 mr-1.5" />
                              )}
                              Adaugă notă
                            </Button>
                          </div>
                        </form>

                        {notes.length > 0 ? (
                          <div className="space-y-2.5 pt-1">
                            {notes.map((n) => (
                              <div
                                key={n.id}
                                className="p-3 bg-secondary/50 rounded-lg border border-border text-[13px]"
                              >
                                <p className="text-secondary-foreground break-words whitespace-pre-wrap">
                                  {n.body}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-2 text-right">
                                  {formatDistanceToNow(new Date(n.createdAt), {
                                    addSuffix: true,
                                    locale: ro,
                                  })}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[13px] text-muted-foreground italic">
                            Nicio notă adăugată încă.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 5. Istoric collapsible card (closed on open) */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      data-action="toggle-history"
                      onClick={() => setHistoryOpen((v) => !v)}
                      className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-muted/50 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                          Istoric activitate
                        </span>
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                          {lead.activities?.length || 0}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          historyOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {historyOpen && (
                      <div className="p-4 border-t border-border">
                        {lead.activities && lead.activities.length > 0 ? (
                          <div className="relative pl-4 border-l border-border space-y-3 text-[13px]">
                            {lead.activities.map((act) => (
                              <div key={act.id} className="relative text-left">
                                <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-border border border-background flex-shrink-0" />
                                <div className="text-muted-foreground">
                                  {renderActivityContent(act)}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {format(new Date(act.createdAt), "dd MMM yyyy, HH:mm", {
                                    locale: ro,
                                  })}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[13px] text-muted-foreground italic">
                            Nicio activitate înregistrată.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 6. Pagination row: Prev, "N din M", Next */}
                  {orderedIds.length > 0 && (
                    <div className="flex items-center justify-between gap-3 pt-2 pb-2">
                      <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={!hasPrev}
                        className="min-h-[44px] px-3.5 border-border flex items-center gap-1.5 text-[13px] font-medium text-foreground rounded-lg"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Precedent</span>
                      </Button>

                      <span className="text-[13px] text-muted-foreground tabular-nums font-medium">
                        {currentIndex >= 0 ? `${currentIndex + 1} din ${orderedIds.length}` : ""}
                      </span>

                      <Button
                        variant="outline"
                        onClick={handleNext}
                        disabled={!hasNext}
                        className="min-h-[44px] px-3.5 border-border flex items-center gap-1.5 text-[13px] font-medium text-foreground rounded-lg"
                      >
                        <span>Următor</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                </div>
              ) : (
                /* Desktop: Two-column grid with divider (unchanged) */
                <div className="grid grid-cols-2 divide-x divide-border min-h-full">
                  
                  {/* LEFT Column */}
                  <div className="p-6 space-y-6">
                    {/* Quick Actions Row */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Acțiuni rapide</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant="outline"
                          className="flex flex-col items-center justify-center h-16 py-2 gap-1 border-border hover:bg-secondary"
                          disabled={!lead.phone}
                          onClick={() => window.open(telLink(lead.phone), "_self")}
                        >
                          <Phone className="w-4 h-4" />
                          <span className="text-xs">Sună</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col items-center justify-center h-16 py-2 gap-1 border-border hover:bg-secondary"
                          disabled={!lead.phone}
                          onClick={() => window.open(waUrlFinal, "_blank")}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-xs">WhatsApp</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col items-center justify-center h-16 py-2 gap-1 border-border hover:bg-secondary"
                          disabled={!lead.email}
                          onClick={() => window.open(`mailto:${lead.email}`, "_self")}
                        >
                          <Mail className="w-4 h-4" />
                          <span className="text-xs">Email</span>
                        </Button>
                      </div>
                    </div>

                    {/* Pipeline Status */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Pipeline</h3>
                      {renderPipelineSection()}
                    </div>

                    {/* Initial message */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Mesaj inițial</h3>
                      <div className="p-4 bg-muted rounded-xl border border-border">
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{lead.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Trimis {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ro })}
                          </span>
                        </p>
                      </div>
                      {renderAiReplySection()}
                    </div>

                    {/* Reminder */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Recontactare</h3>
                      {renderReminderSection()}
                    </div>
                  </div>

                  {/* RIGHT Column */}
                  <div className="p-6 space-y-6">
                    {/* Interes */}
                    {renderInteresSection()}

                    {/* Car Card */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Mașină</h3>
                      {renderCarSection()}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Note</h3>
                      {renderNotesSection()}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Istoric</h3>
                      {renderTimelineSection()}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Sticky Mobile Actions Bar (only on mobile): Sună and WhatsApp (WhatsApp wider) */}
          {isMobile && lead && !isLoading && (
            <div className="sticky bottom-0 z-10 bg-background border-t border-border p-4 flex gap-3 flex-shrink-0">
              <Button
                variant="outline"
                className="flex-1 min-h-[44px] h-12 flex items-center justify-center gap-2 border-border text-foreground text-[14px] font-semibold rounded-lg"
                disabled={!lead.phone}
                onClick={() => window.open(telLink(lead.phone), "_self")}
              >
                <Phone className="w-4 h-4" />
                <span>Sună</span>
              </Button>
              <Button
                className="flex-[2] min-h-[44px] h-12 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[14px] font-semibold rounded-lg border-none disabled:opacity-50"
                disabled={!lead.phone}
                onClick={() => window.open(waUrlFinal, "_blank")}
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </Button>
            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* Sub-Sheets for Mobile */}
      {lead && (
        <>
          <LeadStatusSheet
            isOpen={statusSheetOpen}
            onClose={() => setStatusSheetOpen(false)}
            currentStatus={lead.status as LeadStatus}
            currentLostReason={lead.lostReason}
            onSelectStatus={handleStatusChange}
          />

          <LeadCarSheet
            isOpen={carSheetOpen}
            onClose={() => setCarSheetOpen(false)}
            currentListingId={lead.listingId}
            currentListing={lead.listing}
            listings={listings}
            listingsLoading={listingsLoading}
            onSelectListing={handleLinkListing}
          />

          <LeadInteresSheet
            isOpen={interesSheetOpen}
            onClose={() => setInteresSheetOpen(false)}
            currentType={lead.type as LeadType}
            onSelectType={handleTypeChange}
          />

          <LeadReminderSheet
            isOpen={reminderSheetOpen}
            onClose={() => setReminderSheetOpen(false)}
            currentReminderAt={lead.reminderAt}
            onSaveReminder={handleReminderChange}
            onClearReminder={handleClearReminder}
          />
        </>
      )}

      {/* Alert Dialog for Delete Confirmation (replacing window.confirm) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border rounded-xl max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[17px] font-semibold text-foreground text-left">
              Ștergi acest lead?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground text-left">
              Ești sigur că vrei să ștergi mesajul de la {lead?.name}? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              className="flex-1 min-h-[44px] mt-0 border-border text-[13px]"
            >
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[13px] font-semibold"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Șterge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for Unlinking Car on Type Change (replacing window.confirm) */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent className="bg-card border-border rounded-xl max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[17px] font-semibold text-foreground text-left">
              Dezleagă anunțul asociat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground text-left">
              Schimbi interesul — dorești să dezlegi autovehiculul asociat de acest lead?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => setPendingType(null)}
              className="flex-1 min-h-[44px] mt-0 border-border text-[13px]"
            >
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUnlinkAndTypeChange}
              className="flex-1 min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] font-semibold"
            >
              Dezleagă și schimbă
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
