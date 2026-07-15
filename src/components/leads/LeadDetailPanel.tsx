import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
  MailOpen
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
  MessageActivity
} from "@/services/api";
import { format, formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizeRoPhone, waLink, telLink } from "@/utils/phone";

export const TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  STOCK: "Stoc",
  ORDER: "Comandă",
  BUYBACK: "Buyback",
};

export const STATUS_LABELS: Record<string, string> = {
  NEW: "Nou",
  CONTACTED: "Contactat",
  VIEWING: "Vizionare",
  OFFER: "Ofertă",
  WON: "Câștigat",
  LOST: "Pierdut",
};

export const LOST_REASON_LABELS: Record<string, string> = {
  PRICE: "Preț",
  BOUGHT_ELSEWHERE: "A cumpărat din altă parte",
  UNREACHABLE: "Nu răspunde",
  NOT_SERIOUS: "Neserios",
  OTHER: "Alt motiv",
};

const TYPE_COLORS: Record<string, string> = {
  GENERAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  STOCK: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  ORDER: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  BUYBACK: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  CONTACTED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  VIEWING: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  OFFER: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  WON: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  LOST: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

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
  const isMobile = useIsMobile();
  const [lead, setLead] = useState<MessageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  // Note state
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Lost Reason state
  const [lostReasonOpen, setLostReasonOpen] = useState(false);
  const [tempLostReason, setTempLostReason] = useState<string>("");

  useEffect(() => {
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

  const handleStatusChange = async (newStatus: 'NEW' | 'CONTACTED' | 'VIEWING' | 'OFFER' | 'WON' | 'LOST') => {
    if (!lead) return;
    
    if (newStatus === "LOST") {
      setTempLostReason("PRICE"); // default selection
      setLostReasonOpen(true);
      return;
    }

    try {
      await updateMessageStatus(lead.id, { status: newStatus });
      if (newStatus === "WON") {
        toast.success("Marcat ca Câștigat. Îl găsești în tab-ul «Câștigate».");
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
      toast.success("Marcat ca Pierdut. Îl găsești în tab-ul «Pierdute».");
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

  const handleTypeChange = async (newType: 'GENERAL' | 'STOCK' | 'ORDER' | 'BUYBACK') => {
    if (!lead) return;

    const hasLinkedListing = !!(lead.listingId || lead.listing?.id);
    const shouldUnlink = newType !== "STOCK" && hasLinkedListing;

    if (shouldUnlink) {
      const confirmed = window.confirm("Schimbi interesul — dezleg anunțul asociat?");
      if (!confirmed) return;
    }

    try {
      const payload: any = { type: newType };
      if (shouldUnlink) {
        payload.listingId = null;
      }

      await updateMessage(lead.id, payload);

      if (shouldUnlink) {
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

  // Delete message from details panel
  const handleDeleteLocal = async () => {
    if (!lead) return;
    if (!window.confirm(`Ești sigur că vrei să ștergi mesajul de la ${lead.name}? Această acțiune nu poate fi anulată.`)) {
      return;
    }
    try {
      await deleteMessage(lead.id);
      toast.success("Mesajul a fost șters.");
      if (onMessageUpdated) onMessageUpdated();
      onClose();
    } catch (error) {
      toast.error("Nu s-a putut șterge mesajul.");
    }
  };

  // Navigation handlers
  const currentIndex = orderedIds && messageId ? orderedIds.indexOf(messageId) : -1;
  const hasPrev = orderedIds && currentIndex > 0;
  const hasNext = orderedIds && currentIndex < orderedIds.length - 1;

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

  // Initials generator for avatar
  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Quick Action normalization helpers
  const carTitle = lead?.listing?.title || "";
  const waMessage = carTitle 
    ? `Bună ziua, ați întrebat de ${carTitle} de la noi...`
    : "Bună ziua...";
  const waUrl = lead?.phone ? waLink(lead.phone, waMessage) : "";


  // Date utilities
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

  // Local renderers for layout sections
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
      <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-card-border bg-card">
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
            {lead.listing.publicUrl && (
              <a
                href={lead.listing.publicUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 font-medium"
              >
                <span>Vezi anunțul</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
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
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Interes</h3>
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
                onClick={() => handleStatusChange(k as any)}
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
            className="border-destructive text-destructive hover:bg-destructive-light h-11 md:h-9 text-base md:text-xs px-4 md:px-3 flex items-center justify-center"
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
    <Dialog open={!!messageId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={contentClass}>
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            
            {/* Name / Avatar / Phone details */}
            <div className="flex items-center gap-3 min-w-0">
              {lead && (
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {getInitials(lead.name)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                  {isLoading ? "Se încarcă..." : lead?.name || "Detalii Lead"}
                </h2>
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
                    className="w-11 h-11 md:w-9 md:h-9 border-destructive text-destructive hover:bg-destructive-light flex items-center justify-center"
                    onClick={handleDeleteLocal}
                    title="Șterge mesaj"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Tappable close area (w-11 h-11 is exactly 44px) */}
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
              /* Mobile stacked view */
              <div className="p-6 space-y-6">
                {/* Initial contact message */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mesaj inițial</h3>
                  <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{lead.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Trimis {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ro })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Interes section (Mobile) */}
                {renderInteresSection()}

                {/* Car card section */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Autovehicul asociat</h3>
                  {renderCarSection()}
                </div>

                {/* Pipeline Status section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pipeline Status</h3>
                  </div>
                  {renderPipelineSection()}
                </div>
                {/* Reminder section */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recontactare (Reminder)</h3>
                  {renderReminderSection()}
                </div>

                {/* Notes section */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</h3>
                  {renderNotesSection()}
                </div>

                {/* Activity timeline section */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Istoric Activitate</h3>
                  {renderTimelineSection()}
                </div>
              </div>
            ) : (
              /* Desktop: Two-column grid with divider */
              <div className="grid grid-cols-2 divide-x divide-border min-h-full">
                
                {/* LEFT Column */}
                <div className="p-6 space-y-6">
                  {/* Quick Actions Row */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Acțiuni rapide</h3>
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
                        onClick={() => window.open(waUrl, "_blank")}
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
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pipeline</h3>
                    {renderPipelineSection()}
                  </div>

                  {/* Initial message */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mesaj inițial</h3>
                    <div className="p-4 bg-muted rounded-xl border border-border">
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{lead.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Trimis {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ro })}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Reminder */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recontactare</h3>
                    {renderReminderSection()}
                  </div>
                </div>

                {/* RIGHT Column */}
                <div className="p-6 space-y-6">
                  {/* Interes */}
                  {renderInteresSection()}

                  {/* Car Card */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mașină</h3>
                    {renderCarSection()}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</h3>
                    {renderNotesSection()}
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Istoric</h3>
                    {renderTimelineSection()}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Sticky Mobile Actions Bar (only on mobile) */}
        {isMobile && lead && !isLoading && (
          <div className="sticky bottom-0 z-10 bg-background border-t border-border p-4 flex gap-3 flex-shrink-0">
            <Button
              variant="outline"
              className="flex-1 h-12 flex items-center justify-center gap-2 border-border text-foreground text-sm font-semibold rounded-lg"
              disabled={!lead.phone}
              onClick={() => window.open(telLink(lead.phone), "_self")}
            >
              <Phone className="w-4 h-4" />
              <span>Sună</span>
            </Button>
            <Button
              className="flex-[2] h-12 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-semibold rounded-lg border-none"
              disabled={!lead.phone}
              onClick={() => window.open(waUrl, "_blank")}
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 flex items-center justify-center gap-2 border-border text-foreground text-sm font-semibold rounded-lg"
              disabled={!lead.email}
              onClick={() => window.open(`mailto:${lead.email}`, "_self")}
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};
