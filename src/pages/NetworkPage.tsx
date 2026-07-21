import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { 
  Loader2, 
  MapPin, 
  Phone, 
  Mail, 
  Network, 
  Calendar, 
  Plus, 
  Trash2,
  ChevronLeft,
  ArrowLeftRight,
  Car
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRANSPORT_COUNTRIES, TRANSPORT_TYPE_LABELS, countryLabel } from "@/lib/transportConstants";
import { cn } from "@/lib/utils";
import {
  getNetworkDealers,
  getNetworkSettings,
  updateNetworkSettings,
  getTransportRuns,
  getMyTransportRuns,
  createTransportRun,
  expressTransportInterest,
  updateTransportRun,
  deleteTransportRun,
  getConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendConversationMessage,
  NetworkDealer,
  NetworkSettings,
  TransportRun,
  // B2B Trade API
  getSlowStock,
  exposeTradeListing,
  getMyTradeListings,
  browseTradeListings,
  updateTradeListing,
  unexposeTradeListing,
  SlowStockItem,
  TradeListing
} from "@/services/api";

import { useTransportInterestsCount } from "@/hooks/useTransportInterestsCount";
import { useConversationsUnreadCount } from "@/hooks/useConversationsUnreadCount";
import { useIsMobile } from "@/hooks/use-mobile";
import TransportInterestModal from "@/components/modals/TransportInterestModal";
import PostTransportRunModal from "@/components/modals/PostTransportRunModal";
import ViewInterestsModal from "@/components/modals/ViewInterestsModal";
import ExposeTradeModal from "@/components/modals/ExposeTradeModal";
import SelectCarToExposeModal from "@/components/modals/SelectCarToExposeModal";
import { useNavigate } from "react-router-dom";

const profileFormSchema = z.object({
  city: z.string().max(200).optional().or(z.literal('')),
  networkDisplayName: z.string().max(200).optional().or(z.literal('')),
  networkContactPhone: z.string().max(200).optional().or(z.literal('')),
  networkContactEmail: z.string().max(200).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const NetworkPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Tab & Modal State
  const [filters, setFilters] = useState<{
    fromCity: string;
    toCity: string;
    kind?: 'OFFER' | 'REQUEST';
    fromCountry?: string;
  }>({ fromCity: "", toCity: "" });
  const [interestModalRun, setInterestModalRun] = useState<TransportRun | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [viewInterestsRun, setViewInterestsRun] = useState<TransportRun | null>(null);
  const [revealedRuns, setRevealedRuns] = useState<Record<string, boolean>>({});
  // Hook for unseen interest counts
  const { count: transportCount } = useTransportInterestsCount();

  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("dealers");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState<string>("");

  const { count: unreadMessagesCount } = useConversationsUnreadCount();

  // B2B Trade state
  const [slowStockDays, setSlowStockDays] = useState<number>(60);
  const [tradeFilters, setTradeFilters] = useState<{
    acceptsTrade: boolean;
    priceMax?: number;
    make: string;
  }>({
    acceptsTrade: false,
    priceMax: undefined,
    make: "",
  });
  const [exposeModalOpen, setExposeModalOpen] = useState(false);
  const [exposeModalListing, setExposeModalListing] = useState<SlowStockItem | TradeListing | null>(null);
  const [exposeModalMode, setExposeModalMode] = useState<"create" | "edit">("create");
  const [selectCarModalOpen, setSelectCarModalOpen] = useState(false);

  // Conversations Queries
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    refetchInterval: 15000,
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["conversation-messages", selectedConversationId],
    queryFn: () => getConversationMessages(selectedConversationId!),
    refetchInterval: 5000,
    enabled: !!selectedConversationId,
  });

  const openConversationMutation = useMutation({
    mutationFn: getOrCreateConversation,
    onSuccess: (data) => {
      setActiveTab("messages");
      setSelectedConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversations-unread-count"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Nu s-a putut deschide conversația.");
    }
  });

  const handleOpenConversation = (payload: {
    otherBusinessId: string;
    contextType?: "GENERAL" | "TRANSPORT" | "TRADE";
    contextId?: string | null;
  }) => {
    openConversationMutation.mutate(payload);
  };

  const sendMessageMutation = useMutation({
    mutationFn: ({ body }: { body: string }) =>
      sendConversationMessage(selectedConversationId!, { body }),
    onSuccess: () => {
      setTypedMessage("");
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversations-unread-count"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la trimiterea mesajului.");
    }
  });

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const msg = typedMessage.trim();
    if (!msg) return;
    sendMessageMutation.mutate({ body: msg });
  };

  // Invalidate unread on open
  useEffect(() => {
    if (selectedConversationId) {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversations-unread-count"] });
    }
  }, [selectedConversationId, queryClient]);

  // Queries
  const { data: dealers, isLoading: isLoadingDealers, error: dealersError } = useQuery<NetworkDealer[]>({
    queryKey: ["network-dealers"],
    queryFn: getNetworkDealers,
    retry: false,
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery<NetworkSettings>({
    queryKey: ["network-settings"],
    queryFn: getNetworkSettings,
  });

  const { data: runs, isLoading: isLoadingRuns } = useQuery({
    queryKey: ["transport-runs", filters],
    queryFn: () => getTransportRuns(filters),
  });

  const { data: myRuns, isLoading: isLoadingMyRuns } = useQuery({
    queryKey: ["my-transport-runs"],
    queryFn: getMyTransportRuns,
  });

  // Switch Toggle Mutation
  const switchMutation = useMutation({
    mutationFn: (checked: boolean) => updateNetworkSettings({ networkEnabled: checked }),
    onSuccess: () => {
      toast.success("Setările au fost actualizate.");
      queryClient.invalidateQueries({ queryKey: ["network-dealers"] });
      queryClient.invalidateQueries({ queryKey: ["network-settings"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Nu s-au putut salva setările.");
    }
  });

  // Profile Form Mutation
  const formMutation = useMutation({
    mutationFn: updateNetworkSettings,
    onSuccess: () => {
      toast.success("Profil actualizat.");
      queryClient.invalidateQueries({ queryKey: ["network-dealers"] });
      queryClient.invalidateQueries({ queryKey: ["network-settings"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la actualizarea profilului.");
    }
  });

  // Transport Mutations
  const createRunMutation = useMutation({
    mutationFn: createTransportRun,
    onSuccess: () => {
      toast.success("Cursa a fost postată cu succes.");
      queryClient.invalidateQueries({ queryKey: ["my-transport-runs"] });
      queryClient.invalidateQueries({ queryKey: ["transport-runs"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la crearea cursei.");
    }
  });

  const expressInterestMutation = useMutation({
    mutationFn: ({ runId, payload }: { runId: string; payload: { seatsRequested: number; note?: string | null } }) =>
      expressTransportInterest(runId, payload),
    onSuccess: (_, variables) => {
      toast.success("Interes trimis. Contactează dealerul.");
      setRevealedRuns(prev => ({ ...prev, [variables.runId]: true }));
      queryClient.invalidateQueries({ queryKey: ["transport-runs"] });
    },
    onError: (err: any, variables) => {
      if (err.response?.status === 409) {
        toast.error("Ți-ai exprimat deja interesul pentru această cursă!");
        setRevealedRuns(prev => ({ ...prev, [variables.runId]: true }));
      } else {
        toast.error(err.response?.data?.message || "Eroare la trimiterea interesului.");
      }
    }
  });

  const closeRunMutation = useMutation({
    mutationFn: (runId: string) => updateTransportRun(runId, { status: "CLOSED" }),
    onSuccess: () => {
      toast.success("Cursa a fost închisă.");
      queryClient.invalidateQueries({ queryKey: ["my-transport-runs"] });
      queryClient.invalidateQueries({ queryKey: ["transport-runs"] });
      queryClient.invalidateQueries({ queryKey: ["transport-interests-count"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la închiderea cursei.");
    }
  });

  const deleteRunMutation = useMutation({
    mutationFn: deleteTransportRun,
    onSuccess: () => {
      toast.success("Cursa a fost ștearsă.");
      queryClient.invalidateQueries({ queryKey: ["my-transport-runs"] });
      queryClient.invalidateQueries({ queryKey: ["transport-runs"] });
      queryClient.invalidateQueries({ queryKey: ["transport-interests-count"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la ștergerea cursei.");
    }
  });

  // ── B2B TRADE QUERIES & MUTATIONS ──
  const { data: slowStock, isLoading: isLoadingSlowStock } = useQuery({
    queryKey: ["slow-stock", slowStockDays],
    queryFn: () => getSlowStock(slowStockDays),
  });

  const { data: myTradeListings, isLoading: isLoadingMyTrade } = useQuery({
    queryKey: ["my-trade"],
    queryFn: getMyTradeListings,
  });

  const { data: browseTrade, isLoading: isLoadingBrowseTrade } = useQuery({
    queryKey: ["browse-trade", tradeFilters],
    queryFn: () => browseTradeListings({
      acceptsTrade: tradeFilters.acceptsTrade || undefined,
      priceMax: tradeFilters.priceMax || undefined,
      make: tradeFilters.make || undefined,
    }),
  });

  const exposeMutation = useMutation({
    mutationFn: exposeTradeListing,
    onSuccess: () => {
      toast.success("Vehiculul a fost expus în rețea.");
      queryClient.invalidateQueries({ queryKey: ["slow-stock"] });
      queryClient.invalidateQueries({ queryKey: ["my-trade"] });
      queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
      queryClient.invalidateQueries({ queryKey: ["exposable-cars"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la expunerea vehiculului.");
    }
  });

  const updateTradeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateTradeListing>[1] }) =>
      updateTradeListing(id, payload),
    onSuccess: () => {
      toast.success("Expunerea a fost actualizată.");
      queryClient.invalidateQueries({ queryKey: ["slow-stock"] });
      queryClient.invalidateQueries({ queryKey: ["my-trade"] });
      queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
      queryClient.invalidateQueries({ queryKey: ["exposable-cars"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la actualizarea expunerii.");
    }
  });

  const unexposeMutation = useMutation({
    mutationFn: unexposeTradeListing,
    onSuccess: () => {
      toast.success("Vehiculul a fost retras din rețea.");
      queryClient.invalidateQueries({ queryKey: ["slow-stock"] });
      queryClient.invalidateQueries({ queryKey: ["my-trade"] });
      queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
      queryClient.invalidateQueries({ queryKey: ["exposable-cars"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la retragerea vehiculului.");
    }
  });

  const handleExposeSubmit = (values: any) => {
    if (exposeModalMode === "create") {
      exposeMutation.mutate({
        listingId: exposeModalListing!.listingId,
        b2bPrice: values.b2bPrice,
        acceptsTrade: values.acceptsTrade,
        note: values.note,
      });
    } else {
      updateTradeMutation.mutate({
        id: (exposeModalListing as TradeListing).id,
        payload: {
          b2bPrice: values.b2bPrice,
          acceptsTrade: values.acceptsTrade,
          note: values.note,
        }
      });
    }
  };

  const handleSelectCarPick = (item: SlowStockItem) => {
    setSelectCarModalOpen(false);
    setExposeModalListing(item);
    setExposeModalMode("create");
    setExposeModalOpen(true);
  };

  const handleSelectCarAddNew = () => {
    setSelectCarModalOpen(false);
    navigate("/listings/new");
  };

  // Form setup
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      city: "",
      networkDisplayName: "",
      networkContactPhone: "",
      networkContactEmail: "",
    }
  });

  // Reset form when settings loads
  useEffect(() => {
    if (settings) {
      form.reset({
        city: settings.city || "",
        networkDisplayName: settings.networkDisplayName || "",
        networkContactPhone: settings.networkContactPhone || "",
        networkContactEmail: settings.networkContactEmail || "",
      });
    }
  }, [settings, form]);

  const onSubmit = (values: ProfileFormValues) => {
    formMutation.mutate({
      city: values.city?.trim() || null,
      networkDisplayName: values.networkDisplayName?.trim() || null,
      networkContactPhone: values.networkContactPhone?.trim() || null,
      networkContactEmail: values.networkContactEmail?.trim() || null,
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: ro });
    } catch (e) {
      return dateStr;
    }
  };

  const formatRunDates = (startStr: string, endStr?: string | null) => {
    try {
      const start = new Date(startStr);
      if (!endStr) {
        return format(start, "d MMM yyyy", { locale: ro });
      }
      const end = new Date(endStr);
      if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, "d MMM", { locale: ro })} – ${format(end, "d MMM yyyy", { locale: ro })}`;
      } else {
        return `${format(start, "d MMM yyyy", { locale: ro })} – ${format(end, "d MMM yyyy", { locale: ro })}`;
      }
    } catch (e) {
      return startStr;
    }
  };

  const isForbidden = (dealersError as any)?.response?.status === 403;

  if (isLoadingSettings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rețea Dealeri</h1>
          <p className="text-muted-foreground mt-2">
            Gestionează vizibilitatea și explorează alți dealeri din rețea.
          </p>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rețea Dealeri</h1>
        <p className="text-muted-foreground mt-2">
          Gestionează vizibilitatea și explorează alți dealeri din rețea.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl mb-6">
          <TabsTrigger value="dealers">Dealeri</TabsTrigger>
          <TabsTrigger value="transport" className="flex items-center gap-1.5 justify-center">
            Transport
            {transportCount > 0 && (
              <span className="text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground">
                {transportCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-1.5 justify-center">
            Mesaje
            {unreadMessagesCount > 0 && (
              <span className="text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground">
                {unreadMessagesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="trade" className="flex items-center gap-1.5 justify-center">
            La schimb
          </TabsTrigger>
          <TabsTrigger value="settings">Setările mele</TabsTrigger>
        </TabsList>

        <TabsContent value="dealers" className="space-y-4">
          {isLoadingDealers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : isForbidden ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
              <Network className="w-12 h-12 mb-4 opacity-50 text-muted-foreground" />
              <p className="text-sm">
                Ești în afara rețelei. Activează-te din «Setările mele» ca să vezi ceilalți dealeri.
              </p>
            </div>
          ) : !dealers || dealers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
              <Network className="w-12 h-12 mb-4 opacity-50 text-muted-foreground" />
              <p className="text-sm">Niciun dealer în rețea încă.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dealers.map((dealer) => {
                const hasPhone = !!dealer.contactPhone;
                const hasEmail = !!dealer.contactEmail;
                const hasAnyContact = hasPhone || hasEmail;

                return (
                  <Card key={dealer.id} className="border-border bg-card flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-foreground">{dealer.name}</CardTitle>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                          <span className={!dealer.city ? "text-muted-foreground opacity-75" : ""}>
                            {dealer.city || "Oraș nespecificat"}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-foreground pb-4">
                        {hasPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                            <a href={`tel:${dealer.contactPhone}`} className="hover:underline text-primary">
                              {dealer.contactPhone}
                            </a>
                          </div>
                        )}
                        {hasEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                            <a href={`mailto:${dealer.contactEmail}`} className="hover:underline text-primary">
                              {dealer.contactEmail}
                            </a>
                          </div>
                        )}
                        {!hasAnyContact && (
                          <span className="text-muted-foreground text-xs italic">Fără date de contact</span>
                        )}
                      </CardContent>
                    </div>
                    <div className="px-6 pb-6 pt-0">
                      <Button
                        className="w-full text-xs font-semibold"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenConversation({
                          otherBusinessId: dealer.id,
                          contextType: "GENERAL",
                          contextId: null
                        })}
                      >
                        Conversează
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transport" className="space-y-8">
          {/* Section 1: Curse disponibile */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">Curse disponibile</h3>
              <p className="text-muted-foreground text-sm">
                Caută și solicită transport auto de la alți dealeri din rețea.
              </p>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Tip cursă</label>
                <Tabs 
                  value={filters.kind || "all"} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, kind: val === "all" ? undefined : val as 'OFFER'|'REQUEST' }))} 
                  className="w-full mt-1"
                >
                  <TabsList className="grid w-full grid-cols-3 h-10">
                    <TabsTrigger value="all" className="text-xs">Toate</TabsTrigger>
                    <TabsTrigger value="OFFER" className="text-xs">Ofer</TabsTrigger>
                    <TabsTrigger value="REQUEST" className="text-xs">Caut</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Țară plecare</label>
                <Select
                  value={filters.fromCountry || "all"}
                  onValueChange={(val) => setFilters(prev => ({ ...prev, fromCountry: val === "all" ? undefined : val }))}
                >
                  <SelectTrigger className="bg-background border-input text-foreground h-10 mt-1">
                    <SelectValue placeholder="Toate țările" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Toate țările</SelectItem>
                    {TRANSPORT_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Plecare (Oraș)</label>
                <Input 
                  placeholder="Caută oraș plecare..." 
                  value={filters.fromCity} 
                  onChange={(e) => setFilters(prev => ({ ...prev, fromCity: e.target.value }))}
                  className="bg-background mt-1 h-10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Sosire (Oraș)</label>
                <Input 
                  placeholder="Caută oraș sosire..." 
                  value={filters.toCity} 
                  onChange={(e) => setFilters(prev => ({ ...prev, toCity: e.target.value }))}
                  className="bg-background mt-1 h-10"
                />
              </div>
            </div>

            {/* List */}
            {isLoadingRuns ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !runs || runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
                <Network className="w-12 h-12 mb-4 opacity-50 text-muted-foreground" />
                <p className="text-sm">Nicio cursă disponibilă momentan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {runs.map((run) => (
                  <Card key={run.id} className="border-border bg-card flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-1 items-start mb-2">
                        {run.kind === 'OFFER' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5">
                            Ofer transport
                          </Badge>
                        ) : (
                          <Badge className="bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border-sky-500/20 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5">
                            Caut transport
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg font-bold text-foreground leading-tight">
                          {run.fromCountry ? `${countryLabel(run.fromCountry)} · ` : ''}{run.fromCity} → {run.toCity}
                        </CardTitle>
                        {run.pricePerCar ? (
                          <Badge variant="secondary" className="font-semibold text-xs shrink-0">
                            {run.pricePerCar} €/mașină
                          </Badge>
                        ) : (
                          run.kind === 'OFFER' && (
                            <Badge variant="outline" className="text-muted-foreground text-xs shrink-0">
                              Preț nespecificat
                            </Badge>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                        <Calendar className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span>
                          {run.departureDateEnd 
                            ? formatRunDates(run.departureDate, run.departureDateEnd) 
                            : formatDate(run.departureDate)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-foreground flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                          <span>Locuri disponibile:</span>
                          <span className="font-bold text-foreground">{run.seatsAvailable} / {run.seatsTotal} mașini</span>
                        </div>

                        {run.kind === 'OFFER' && (run.transportType || run.acceptsNonRunning) && (
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {run.transportType && (
                              <Badge variant="outline" className="text-[11px] bg-muted/30 border-border font-medium">
                                {TRANSPORT_TYPE_LABELS[run.transportType] || run.transportType}
                              </Badge>
                            )}
                            {run.acceptsNonRunning && (
                              <Badge variant="outline" className="text-[11px] bg-muted/30 border-border font-medium">
                                Acceptă nefuncționale
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-semibold text-foreground">Postat de: </span>
                          {run.owner?.name || "Dealer"} ({run.owner?.city || "oraș nespecificat"})
                        </div>

                        {run.notes && (
                          <div className="mt-2 text-xs bg-muted/20 p-2.5 rounded border border-border/50 text-muted-foreground italic">
                            {run.notes}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-border/50 space-y-3">
                        <div className="flex gap-2">
                          {revealedRuns[run.id] ? (
                            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2 text-xs flex-1">
                              <div className="font-bold text-primary mb-1">Date de contact dealer:</div>
                              {run.owner?.contactPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <a href={`tel:${run.owner.contactPhone}`} className="hover:underline text-primary font-medium">
                                    {run.owner.contactPhone}
                                  </a>
                                </div>
                              )}
                              {run.owner?.contactEmail && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <a href={`mailto:${run.owner.contactEmail}`} className="hover:underline text-primary font-medium">
                                    {run.owner.contactEmail}
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button
                               className="flex-1 text-xs font-semibold"
                               variant="outline"
                               size="sm"
                               onClick={() => setInterestModalRun(run)}
                            >
                              {run.kind === 'OFFER' ? 'Vreau un loc' : 'Pot transporta'}
                            </Button>
                          )}

                          {run.owner?.id && (
                            <Button
                              className="flex-1 text-xs font-semibold"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenConversation({
                                otherBusinessId: run.owner.id,
                                contextType: "TRANSPORT",
                                contextId: run.id
                              })}
                            >
                              Conversează
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Cursele mele */}
          <div className="space-y-4 border-t border-border pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Cursele mele postate</h3>
                <p className="text-muted-foreground text-sm">Administrează cursele pe care le-ai adăugat în rețea.</p>
              </div>
              <Button onClick={() => setPostModalOpen(true)} className="sm:self-start shrink-0 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Postează cursă
              </Button>
            </div>

            {/* List */}
            {isLoadingMyRuns ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !myRuns || myRuns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
                <Network className="w-12 h-12 mb-4 opacity-50 text-muted-foreground" />
                <p className="text-sm">Nu ai adăugat nicio cursă încă.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRuns.map((run) => (
                  <Card key={run.id} className="border-border bg-card flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-1 items-start mb-2">
                        {run.kind === 'OFFER' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5">
                            Ofer transport
                          </Badge>
                        ) : (
                          <Badge className="bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border-sky-500/20 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5">
                            Caut transport
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg font-bold text-foreground leading-tight">
                          {run.fromCountry ? `${countryLabel(run.fromCountry)} · ` : ''}{run.fromCity} → {run.toCity}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={run.status === "OPEN" ? "default" : "secondary"}>
                            {run.status === "OPEN" ? "Deschisă" : "Închisă"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                        <Calendar className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span>
                          {run.departureDateEnd 
                            ? formatRunDates(run.departureDate, run.departureDateEnd) 
                            : formatDate(run.departureDate)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-foreground flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                          <div>Locuri: <span className="font-bold text-foreground">{run.seatsAvailable} / {run.seatsTotal} mașini</span></div>
                          <div>Preț: <span className="font-bold text-foreground">{run.pricePerCar ? `${run.pricePerCar} €/mașină` : (run.kind === 'OFFER' ? 'Nespecificat' : 'N/A')}</span></div>
                        </div>

                        {run.kind === 'OFFER' && (run.transportType || run.acceptsNonRunning) && (
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {run.transportType && (
                              <Badge variant="outline" className="text-[11px] bg-muted/30 border-border font-medium">
                                {TRANSPORT_TYPE_LABELS[run.transportType] || run.transportType}
                              </Badge>
                            )}
                            {run.acceptsNonRunning && (
                              <Badge variant="outline" className="text-[11px] bg-muted/30 border-border font-medium">
                                Acceptă nefuncționale
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                          <span>Interes exprimat:</span>
                          <span className="font-semibold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {run.interestCount || 0} {run.interestCount === 1 ? 'interes' : 'interese'}
                          </span>
                        </div>

                        {run.notes && (
                          <div className="mt-2 text-xs bg-muted/20 p-2.5 rounded border border-border/50 text-muted-foreground italic">
                            {run.notes}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-border/50 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => setViewInterestsRun(run)}
                        >
                          Interese
                        </Button>

                        {run.status === "OPEN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-600 text-amber-500"
                            onClick={() => {
                              if (window.confirm("Ești sigur că vrei să închizi această cursă?")) {
                                closeRunMutation.mutate(run.id);
                              }
                            }}
                            disabled={closeRunMutation.isPending}
                          >
                            {closeRunMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Închide"}
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs px-3"
                          onClick={() => {
                            if (window.confirm("Ești sigur că vrei să ștergi această cursă? Această acțiune este ireversibilă.")) {
                              deleteRunMutation.mutate(run.id);
                            }
                          }}
                          disabled={deleteRunMutation.isPending}
                        >
                          {deleteRunMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trade" className="space-y-8">
          {/* Section 1 — Stocul meu lent */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">Stocul meu lent</h3>
              <p className="text-muted-foreground text-sm">
                Vehicule din inventar care nu au fost vândute într-o perioadă mai lungă de timp. Expune-le în rețea pentru a primi oferte B2B sau schimburi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border border-border">
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">Prag zile în stoc</h4>
                <p className="text-xs text-muted-foreground">Filtrează mașinile după numărul de zile de când sunt în stoc.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-muted rounded-md p-1 border border-border">
                  {[30, 60, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSlowStockDays(d)}
                      type="button"
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded transition-all",
                        slowStockDays === d 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {d} zile
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={slowStockDays}
                    onChange={(e) => setSlowStockDays(Number(e.target.value))}
                    className="w-20 bg-background border-input text-foreground h-8 text-xs font-semibold"
                    min={1}
                  />
                  <span className="text-xs text-muted-foreground">zile</span>
                </div>
              </div>
            </div>

            {isLoadingSlowStock ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !slowStock || slowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
                <Car className="w-12 h-12 mb-4 opacity-50 text-muted-foreground" />
                <p className="text-sm">Nicio mașină nevândută peste pragul ales.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slowStock.map((item) => {
                  const matchingMyListing = myTradeListings?.find(my => my.listingId === item.listingId);
                  return (
                    <Card key={item.listingId} className="border-border bg-card flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
                      <div className="flex gap-4 p-4">
                        <div className="w-24 h-20 shrink-0 relative bg-muted rounded-md overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                              <Car className="w-6 h-6 opacity-40 mb-0.5" />
                              <span className="text-[9px] italic">Fără imagine</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-foreground text-sm truncate leading-snug group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.year ? `${item.year} · ` : ""}{item.mileage ? `${item.mileage.toLocaleString()} km` : ""}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="font-bold text-sm text-foreground">
                              {item.price ? `${item.price.toLocaleString()} €` : "Preț nespecificat"}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 italic">
                            de {item.daysInStock} zile în stoc
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                        {item.isExposed ? (
                          <>
                            <div className="flex items-center gap-1">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5">
                                Expusă
                              </Badge>
                            </div>
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2.5 font-medium"
                                onClick={() => {
                                  if (matchingMyListing) {
                                    setExposeModalListing(matchingMyListing);
                                    setExposeModalMode("edit");
                                    setExposeModalOpen(true);
                                  } else {
                                    toast.error("Vă rugăm să editați din secțiunea «Expunerile mele»");
                                  }
                                }}
                              >
                                Editează
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2.5 font-medium border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-600 text-amber-500"
                                onClick={() => {
                                  if (matchingMyListing && window.confirm("Ești sigur că vrei să retragi această mașină din rețea?")) {
                                    unexposeMutation.mutate(matchingMyListing.id);
                                  } else if (!matchingMyListing) {
                                    toast.error("Nu s-a găsit înregistrarea expusă.");
                                  }
                                }}
                                disabled={unexposeMutation.isPending}
                              >
                                Retrage
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] text-muted-foreground">Neexpusă în rețea</span>
                            <Button
                              size="sm"
                              className="h-7 text-xs font-semibold px-3"
                              onClick={() => {
                                setExposeModalListing(item);
                                setExposeModalMode("create");
                                setExposeModalOpen(true);
                              }}
                            >
                              Expune în rețea
                            </Button>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2 — Expunerile mele */}
          <div className="space-y-4 border-t border-border pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Expunerile mele</h3>
                <p className="text-muted-foreground text-sm">
                  Vehiculele pe care le-ai expus în rețeaua dealerilor pentru schimburi sau tranzacții B2B.
                </p>
              </div>
              <Button
                onClick={() => setSelectCarModalOpen(true)}
                className="sm:self-start shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Expune o mașină
              </Button>
            </div>

            {isLoadingMyTrade ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !myTradeListings || myTradeListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
                <Car className="w-12 h-12 mb-4 opacity-50 text-muted-foreground" />
                <p className="text-sm">Nu ai nicio mașină expusă momentan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTradeListings.map((item) => (
                  <Card key={item.id} className="border-border bg-card flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex gap-4 p-4">
                      <div className="w-24 h-20 shrink-0 relative bg-muted rounded-md overflow-hidden">
                        {item.car.image ? (
                          <img src={item.car.image} alt={item.car.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Car className="w-6 h-6 opacity-40 mb-0.5" />
                            <span className="text-[9px] italic">Fără imagine</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-foreground text-sm truncate leading-snug group-hover:text-primary transition-colors">
                          {item.car.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.car.year ? `${item.car.year} · ` : ""}{item.car.mileage ? `${item.car.mileage.toLocaleString()} km` : ""}
                        </p>
                        <div className="flex flex-wrap gap-1.5 items-center mt-2">
                          <span className="font-bold text-sm text-foreground">
                            Preț B2B: {item.b2bPrice ? `${item.b2bPrice.toLocaleString()} €` : "—"}
                          </span>
                          {item.acceptsTrade && (
                            <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[9px] font-bold px-1.5 py-0">
                              Schimb
                            </Badge>
                          )}
                        </div>
                        {item.note && (
                          <p className="text-[11px] text-muted-foreground mt-1.5 italic line-clamp-1">
                            "{item.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px] font-semibold">
                          {item.status === "ACTIVE" ? "Activă" : "Închisă"}
                        </Badge>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 font-medium"
                          onClick={() => {
                            setExposeModalListing(item);
                            setExposeModalMode("edit");
                            setExposeModalOpen(true);
                          }}
                        >
                          Editează
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 font-medium border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-600 text-amber-500"
                          onClick={() => {
                            if (window.confirm("Ești sigur că vrei să retragi această mașină din rețea?")) {
                              unexposeMutation.mutate(item.id);
                            }
                          }}
                          disabled={unexposeMutation.isPending}
                        >
                          Retrage
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 3 — Bursa la schimb */}
          <div className="space-y-4 border-t border-border pt-8">
            <div>
              <h3 className="text-xl font-bold text-foreground">Bursa la schimb</h3>
              <p className="text-muted-foreground text-sm">
                Răsfoiește vehiculele expuse de alți dealeri din rețea și propune schimburi sau tranzacții B2B.
              </p>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Marcă</label>
                <Input 
                  placeholder="ex: Volkswagen..." 
                  value={tradeFilters.make} 
                  onChange={(e) => setTradeFilters(prev => ({ ...prev, make: e.target.value }))}
                  className="bg-background h-10"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Preț B2B maxim (€)</label>
                <Input 
                  type="number"
                  placeholder="ex: 20000" 
                  value={tradeFilters.priceMax ?? ""} 
                  onChange={(e) => setTradeFilters(prev => ({ ...prev, priceMax: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  className="bg-background h-10"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5 h-10 shadow-sm">
                  <span className="text-xs font-semibold text-muted-foreground">Doar cu schimb</span>
                  <Switch
                    checked={tradeFilters.acceptsTrade}
                    onCheckedChange={(checked) => setTradeFilters(prev => ({ ...prev, acceptsTrade: checked }))}
                  />
                </div>
              </div>
            </div>

            {isLoadingBrowseTrade ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !browseTrade || browseTrade.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
                <Car className="w-12 h-12 mb-4 opacity-50 text-muted-foreground" />
                <p className="text-sm">Nicio mașină la schimb momentan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {browseTrade.map((item) => (
                  <Card key={item.id} className="border-border bg-card flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
                    <div>
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        {item.car.image ? (
                          <img src={item.car.image} alt={item.car.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Car className="w-10 h-10 opacity-40 mb-1" />
                            <span className="text-[10px] italic">Fără imagine</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          {item.acceptsTrade && (
                            <Badge className="bg-sky-500 text-sky-foreground border-none font-bold text-[10px] tracking-wide uppercase px-2 py-0.5">
                              Acceptă schimb
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                          {item.car.title}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground mt-1 font-medium">
                          {item.car.year ? `${item.car.year} · ` : ""}{item.car.mileage ? `${item.car.mileage.toLocaleString()} km` : ""}
                          {item.car.fuelType ? ` · ${item.car.fuelType}` : ""}{item.car.gearbox ? ` · ${item.car.gearbox}` : ""}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-4">
                        <div className="flex flex-col gap-1.5 p-2.5 rounded bg-muted/40 border border-border/50">
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Preț public:</span>
                            <span className="font-semibold text-foreground">
                              {item.car.price ? `${item.car.price.toLocaleString()} €` : "—"}
                            </span>
                          </div>
                          {item.b2bPrice && (
                            <div className="flex justify-between items-center text-xs font-bold text-emerald-600 bg-emerald-500/5 p-1 rounded">
                              <span>Preț B2B special:</span>
                              <span>{item.b2bPrice.toLocaleString()} €</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="text-muted-foreground">
                            <span className="font-semibold text-foreground">Postat de:</span>{" "}
                            {item.owner?.name || "Dealer rețea"}
                          </div>
                          {item.owner?.city && (
                            <div className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{item.owner.city}</span>
                            </div>
                          )}
                        </div>

                        {item.note && (
                          <div className="text-xs bg-muted/20 p-2 rounded border border-border/50 text-muted-foreground italic line-clamp-2">
                            "{item.note}"
                          </div>
                        )}
                      </CardContent>
                    </div>

                    <div className="px-6 pb-6 pt-0 flex gap-2">
                      {item.owner?.id && (
                        <Button
                          className="flex-1 text-xs font-semibold"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenConversation({
                            otherBusinessId: item.owner.id,
                            contextType: "TRADE",
                            contextId: item.id
                          })}
                        >
                          Conversează
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-base font-semibold text-foreground">Vizibil în rețeaua de dealeri</div>
                  <div className="text-sm text-muted-foreground">
                    Când e dezactivat, nu apari în directorul celorlalți dealeri și nu vezi rețeaua.
                  </div>
                </div>
                <Switch
                  checked={settings?.networkEnabled || false}
                  onCheckedChange={(checked) => {
                    switchMutation.mutate(checked);
                  }}
                  disabled={switchMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Setări Profil Rețea</CardTitle>
              <CardDescription>
                Aceste date sunt afișate în directorul rețelei de dealeri.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Oraș</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: București" {...field} className="bg-background border-input text-foreground h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="networkDisplayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Nume afișat în rețea</FormLabel>
                        <FormControl>
                          <Input placeholder={settings?.name || "Numele afacerii"} {...field} className="bg-background border-input text-foreground h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="networkContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Telefon de contact (rețea)</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: 0722 000 000" {...field} className="bg-background border-input text-foreground h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="networkContactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Email de contact (rețea)</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: contact@dealer.ro" {...field} className="bg-background border-input text-foreground h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={formMutation.isPending} className="mt-4">
                    {formMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvează modificările
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-240px)] min-h-[550px] border border-border rounded-xl overflow-hidden bg-card">
            {/* List (Left column) */}
            <div className={cn(
              "md:col-span-4 border-r border-border flex flex-col h-full bg-card",
              isMobile && selectedConversationId ? "hidden" : "flex"
            )}>
              <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="font-semibold text-foreground">Conversații</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                {isLoadingConversations && !conversations ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : !conversations || conversations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Nicio conversație încă.
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = selectedConversationId === conv.id;
                    const previewText = conv.lastMessage 
                      ? `${conv.lastMessage.fromMe ? "Tu: " : ""}${conv.lastMessage.body}`
                      : "Fără mesaje";
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className={cn(
                          "w-full text-left p-4 transition-colors hover:bg-secondary/40 flex flex-col gap-1.5",
                          isSelected && "bg-secondary/70 hover:bg-secondary/70",
                          conv.unreadCount > 0 && "bg-primary/5 font-semibold"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-foreground text-sm block truncate">
                              {conv.otherDealer.name}
                            </span>
                            {conv.otherDealer.city && (
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {conv.otherDealer.city}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                            {formatDistanceToNow(new Date(conv.lastMessageAt || conv.createdAt), {
                              addSuffix: true,
                              locale: ro,
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-xs text-muted-foreground truncate flex-1">
                            {previewText}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {conv.contextType === "TRANSPORT" && (
                              <Badge className="text-[9px] bg-sky-500/10 text-sky-600 border-sky-500/20 px-1.5 py-0">
                                Transport
                              </Badge>
                            )}
                            {conv.contextType === "TRADE" && (
                              <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5 py-0">
                                Schimb
                              </Badge>
                            )}
                            {conv.unreadCount > 0 && (
                              <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Thread (Right column) */}
            <div className={cn(
              "md:col-span-8 flex flex-col h-full bg-card",
              isMobile && !selectedConversationId ? "hidden" : "flex"
            )}>
              {selectedConversationId ? (
                (() => {
                  const activeConv = conversations?.find((c) => c.id === selectedConversationId);
                  const other = activeConv?.otherDealer;
                  const hasPhone = !!other?.contactPhone;
                  const hasEmail = !!other?.contactEmail;
                  return (
                    <>
                      {/* Thread Header */}
                      <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {isMobile && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedConversationId(null)}
                              className="h-8 w-8 text-muted-foreground mr-1 shrink-0"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </Button>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-foreground text-sm truncate">
                              {other?.name || "Conversație"}
                            </h4>
                            {other?.city && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span>{other.city}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick contacts */}
                        <div className="flex gap-2 shrink-0">
                          {hasPhone && (
                            <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                              <a href={`tel:${other.contactPhone}`} title={other.contactPhone}>
                                <Phone className="w-4 h-4 text-primary" />
                              </a>
                            </Button>
                          )}
                          {hasEmail && (
                            <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                              <a href={`mailto:${other.contactEmail}`} title={other.contactEmail}>
                                <Mail className="w-4 h-4 text-primary" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Message History */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/10 flex flex-col justify-end">
                        <div className="space-y-3 overflow-y-auto flex-1">
                          {isLoadingMessages && !messages ? (
                            <div className="flex justify-center items-center h-full">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                          ) : !messages || messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
                              Scrie un mesaj pentru a începe conversația.
                            </div>
                          ) : (
                            messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={cn(
                                  "flex flex-col max-w-[75%]",
                                  msg.fromMe ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                              >
                                <div
                                  className={cn(
                                    "p-3 px-4 rounded-2xl text-sm break-words whitespace-pre-wrap",
                                    msg.fromMe
                                      ? "bg-primary text-primary-foreground rounded-tr-none"
                                      : "bg-muted text-foreground rounded-tl-none border border-border/50"
                                  )}
                                >
                                  {msg.body}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                  {format(new Date(msg.createdAt), "HH:mm")}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Text Input area */}
                      <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex gap-2">
                        <textarea
                          placeholder="Scrie un mesaj..."
                          value={typedMessage}
                          onChange={(e) => setTypedMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          rows={1}
                          className="flex-1 resize-none bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px] max-h-[120px]"
                        />
                        <Button
                          type="submit"
                          disabled={!typedMessage.trim() || sendMessageMutation.isPending}
                          className="h-10 px-4 flex items-center gap-1.5"
                        >
                          {sendMessageMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>Trimite</span>
                          )}
                        </Button>
                      </form>
                    </>
                  );
                })()
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm p-6">
                  Selectează o conversație din stânga pentru a citi mesajele.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Interest expression modal */}
      <TransportInterestModal
        isOpen={!!interestModalRun}
        onClose={() => setInterestModalRun(null)}
        run={interestModalRun}
        onSubmit={(payload) => {
          if (interestModalRun) {
            expressInterestMutation.mutate({ runId: interestModalRun.id, payload });
          }
        }}
      />

      {/* Post a new run modal */}
      <PostTransportRunModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSubmit={(payload) => {
          createRunMutation.mutate(payload);
        }}
      />

      {/* View interests modal */}
      <ViewInterestsModal
        isOpen={!!viewInterestsRun}
        onClose={() => setViewInterestsRun(null)}
        run={viewInterestsRun}
        onConverse={handleOpenConversation}
      />

      {/* Expose trade modal */}
      <ExposeTradeModal
        isOpen={exposeModalOpen}
        onClose={() => {
          setExposeModalOpen(false);
          setExposeModalListing(null);
        }}
        listing={exposeModalListing}
        mode={exposeModalMode}
        onSubmit={handleExposeSubmit}
      />

      {/* Select car to expose modal */}
      <SelectCarToExposeModal
        isOpen={selectCarModalOpen}
        onClose={() => setSelectCarModalOpen(false)}
        onPick={handleSelectCarPick}
        onAddNew={handleSelectCarAddNew}
      />
    </div>
  );
};

export default NetworkPage;
