import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { getCustomers, CustomerListItem } from "@/services/api";
import CustomerRow, { getDeadline, CUSTOMER_COLS } from "@/components/customers/CustomerRow";
import CustomersMenu from "@/components/customers/CustomersMenu";
import { getLeadAgeBand } from "@/lib/date";
import CustomersHeader, {
  CustomersSortOption,
  LeadTypeFilter,
  DeadlineFilter,
  matchesLeadTypes,
  matchesDeadline,
} from "@/components/customers/CustomersHeader";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { roCount } from "@/lib/plural";
import { isInLucru } from "@/hooks/useInLucruCount";

const CustomersPage = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<CustomersSortOption>("recent");
  const [selectedTypes, setSelectedTypes] = useState<LeadTypeFilter[]>([]);
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlineFilter | null>(null);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [showOldActiveLeads, setShowOldActiveLeads] = useState(false);

  const { data: customers = [], isLoading } = useQuery<CustomerListItem[]>({
    queryKey: ['customers'],
    queryFn: getCustomers,
    refetchOnWindowFocus: false,
  });

  const inLucruCustomers = useMemo(() => {
    return customers.filter(isInLucru);
  }, [customers]);

  const baseCustomers = useMemo(() => {
    let list: CustomerListItem[] = [];
    if (filter === "inlucru") {
      list = inLucruCustomers;
    } else if (filter === "active") {
      list = customers.filter((c) => Boolean(c.openLead));
    } else if (filter === "noi") {
      list = customers.filter((c) => c.hasUnreadLead === true || (c.openLead && !c.openLead.isRead));
    } else if (filter === "contact") {
      list = customers.filter((c) => c.leadTypes?.includes("GENERAL"));
    } else if (filter === "stock") {
      list = customers.filter((c) => c.leadTypes?.includes("STOCK"));
    } else if (filter === "order") {
      list = customers.filter((c) => c.leadTypes?.includes("ORDER"));
    } else if (filter === "buyback") {
      list = customers.filter((c) => c.leadTypes?.includes("BUYBACK"));
    } else if (filter === "financing") {
      list = customers.filter((c) => c.leadTypes?.includes("FINANCING"));
    } else if (filter === "appointments") {
      list = customers.filter((c) => c.nextAppointment != null);
    } else if (filter === "offers") {
      list = customers.filter((c) => c.pendingOffer != null);
    } else if (filter === "reservations") {
      list = customers.filter((c) => c.activeReservation != null);
    } else {
      list = customers;
    }

    const term = search.toLowerCase().trim();
    if (!term) return list;

    const cleanSearch = term.replace(/\D/g, "");
    return list.filter((c) => {
      const cleanPhone = c.phone.replace(/\D/g, "");
      const nameMatch = c.name.toLowerCase().includes(term);
      const phoneMatch = (cleanSearch ? cleanPhone.includes(cleanSearch) : false) || c.phone.includes(term);
      return nameMatch || phoneMatch;
    });
  }, [customers, inLucruCustomers, search, filter]);

  const inLucruGrouped = useMemo(() => {
    if (filter !== "inlucru") return [];

    const list = baseCustomers.filter(
      (c) => matchesLeadTypes(c, selectedTypes) && matchesDeadline(c, selectedDeadline)
    );

    const needsAttentionList: CustomerListItem[] = [];
    const restList: CustomerListItem[] = [];

    for (const c of list) {
      const isUnread = !!(c.openLead && !c.openLead.isRead);
      const deadline = getDeadline(c);
      const isUrgent =
        matchesDeadline(c, "expirat") || matchesDeadline(c, "azi_maine");

      if (isUnread || isUrgent) {
        needsAttentionList.push(c);
      } else {
        restList.push(c);
      }
    }

    // Sort needsAttentionList: unread-first, then by deadline
    needsAttentionList.sort((a, b) => {
      const isUnreadA = !!(a.openLead && !a.openLead.isRead);
      const isUnreadB = !!(b.openLead && !b.openLead.isRead);

      if (isUnreadA !== isUnreadB) {
        return isUnreadA ? -1 : 1;
      }

      const dA = getDeadline(a);
      const dB = getDeadline(b);
      const tA = dA ? dA.getTime() : Infinity;
      const tB = dB ? dB.getTime() : Infinity;
      return tA - tB;
    });

    // Sort restList: by deadline
    restList.sort((a, b) => {
      const dA = getDeadline(a);
      const dB = getDeadline(b);
      const tA = dA ? dA.getTime() : Infinity;
      const tB = dB ? dB.getTime() : Infinity;
      return tA - tB;
    });

    const groups: { id: "attention" | "rest"; label: string; customers: CustomerListItem[] }[] = [];

    if (needsAttentionList.length > 0) {
      groups.push({
        id: "attention",
        label: "Necesită atenție",
        customers: needsAttentionList,
      });
    }

    if (restList.length > 0) {
      groups.push({
        id: "rest",
        label: "Restul",
        customers: restList,
      });
    }

    return groups;
  }, [baseCustomers, filter, selectedTypes, selectedDeadline]);

  const inLucruFilteredCount = useMemo(() => {
    return inLucruGrouped.reduce((acc, g) => acc + g.customers.length, 0);
  }, [inLucruGrouped]);

  const activeGrouped = useMemo(() => {
    if (filter !== "active") return [];

    const list = baseCustomers.filter(
      (c) => matchesLeadTypes(c, selectedTypes) && matchesDeadline(c, selectedDeadline)
    );

    const noiList: CustomerListItem[] = [];
    const neatinseList: CustomerListItem[] = [];
    const vechiList: CustomerListItem[] = [];

    for (const c of list) {
      if (!c.openLead) continue;
      const band = getLeadAgeBand(c.openLead.createdAt);
      if (band === "noi") {
        noiList.push(c);
      } else if (band === "neatinse") {
        neatinseList.push(c);
      } else {
        vechiList.push(c);
      }
    }

    // Sort within each group: oldest lead first (ascending createdAt)
    const sortByOldest = (a: CustomerListItem, b: CustomerListItem) => {
      const tA = a.openLead ? new Date(a.openLead.createdAt).getTime() : 0;
      const tB = b.openLead ? new Date(b.openLead.createdAt).getTime() : 0;
      return tA - tB;
    };

    noiList.sort(sortByOldest);
    neatinseList.sort(sortByOldest);
    vechiList.sort(sortByOldest);

    const groups: { id: "noi" | "neatinse" | "vechi"; label: string; customers: CustomerListItem[] }[] = [];

    if (noiList.length > 0) {
      groups.push({
        id: "noi",
        label: "Noi",
        customers: noiList,
      });
    }

    if (neatinseList.length > 0) {
      groups.push({
        id: "neatinse",
        label: "Neatinse",
        customers: neatinseList,
      });
    }

    if (vechiList.length > 0) {
      groups.push({
        id: "vechi",
        label: "Vechi",
        customers: vechiList,
      });
    }

    return groups;
  }, [baseCustomers, filter, selectedTypes, selectedDeadline]);

  const activeVisibleGroups = useMemo(() => {
    if (filter !== "active") return [];
    return showOldActiveLeads
      ? activeGrouped
      : activeGrouped.filter((g) => g.id !== "vechi");
  }, [activeGrouped, showOldActiveLeads, filter]);

  const vechiGroup = useMemo(() => {
    return activeGrouped.find((g) => g.id === "vechi");
  }, [activeGrouped]);

  const activeVisibleCount = useMemo(() => {
    return activeVisibleGroups.reduce((acc, g) => acc + g.customers.length, 0);
  }, [activeVisibleGroups]);

  const totiFiltered = useMemo(() => {
    if (!filter || filter === "inlucru" || filter === "active") return [];

    let list = baseCustomers.filter(
      (c) => matchesLeadTypes(c, selectedTypes) && matchesDeadline(c, selectedDeadline)
    );

    if (sortBy === "deadline_asc") {
      return [...list].sort((a, b) => {
        const dA = getDeadline(a);
        const dB = getDeadline(b);
        const tA = dA ? dA.getTime() : Infinity;
        const tB = dB ? dB.getTime() : Infinity;
        if (tA !== tB) return tA - tB;
        return 0;
      });
    }

    if (sortBy === "name_asc") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, "ro", { sensitivity: "base" }));
    }

    return list;
  }, [baseCustomers, selectedTypes, selectedDeadline, sortBy, filter]);

  const getPageTitle = () => {
    if (filter === "inlucru") return "În lucru";
    if (filter === "active") return "Cereri active";
    if (filter === "noi") return "Cereri noi";
    if (filter === "contact") return "Contact";
    if (filter === "stock") return "Interesat mașină";
    if (filter === "order") return "Mașini la comandă";
    if (filter === "buyback") return "Buy-back";
    if (filter === "financing") return "Finanțare";
    if (filter === "appointments") return "Programări";
    if (filter === "offers") return "Oferte trimise";
    if (filter === "reservations") return "Rezervări active";
    if (filter === "all") return "Toți clienții";
    return "Clienți";
  };

  const countText = useMemo(() => {
    if (filter === "inlucru") return roCount(inLucruFilteredCount, "client", "clienți");
    if (filter === "active") return roCount(activeVisibleCount, "client", "clienți");
    return roCount(totiFiltered.length, "client", "clienți");
  }, [filter, inLucruFilteredCount, activeVisibleCount, totiFiltered.length]);

  const searchPlaceholder = useMemo(() => {
    if (filter === "inlucru") return "Caută în clienții în lucru...";
    if (filter === "active") return "Caută în cereri active...";
    return "Caută după nume sau telefon...";
  }, [filter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-[13px] text-muted-foreground">Se încarcă clienții...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-[15px] text-muted-foreground text-center py-8">
        Clienții apar automat din mesaje, oferte, rezervări și contracte.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {!filter ? (
        <CustomersMenu customers={customers} />
      ) : (
        <>
          <CustomersHeader
            title={getPageTitle()}
            countText={countText}
            searchQuery={search}
            onSearchQueryChange={setSearch}
            searchPlaceholder={searchPlaceholder}
            showSort={filter !== "inlucru" && filter !== "active"}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            selectedTypes={selectedTypes}
            onSelectedTypesChange={setSelectedTypes}
            selectedDeadline={selectedDeadline}
            onSelectedDeadlineChange={setSelectedDeadline}
            baseCustomers={baseCustomers}
            onNewLead={() => setIsNewLeadOpen(true)}
          />

          {/* Desktop Column Header */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 border border-transparent text-[11px] tracking-wide font-medium uppercase text-muted-foreground select-none">
            <div data-col="avatar" className={`${CUSTOMER_COLS.avatar} shrink-0`} />
            <div data-col="name" className={CUSTOMER_COLS.name}>Client</div>
            <div data-col="phone" className={`${CUSTOMER_COLS.phone} shrink-0`}>Telefon</div>
            <div data-col="type" className={`${CUSTOMER_COLS.type} shrink-0 flex justify-center`}>Tip</div>
            <div data-col="detail" className={`${CUSTOMER_COLS.detail} shrink-0`}>Detaliu</div>
            <div data-col="amount" className={`${CUSTOMER_COLS.amount} shrink-0 text-right`}>Sumă</div>
            <div data-col="deadline" className={`${CUSTOMER_COLS.deadline} shrink-0 text-right`}>Termen</div>
            <div data-col="call" className={`${CUSTOMER_COLS.call} shrink-0 flex justify-end`} />
          </div>

          {/* View 1: In lucru */}
          {filter === "inlucru" && (
            <>
              {inLucruGrouped.length === 0 ? (
                <div className="text-[15px] text-muted-foreground text-center py-8">
                  {search.trim()
                    ? `Niciun client găsit pentru „${search}” în lista de lucru.`
                    : "Niciun client în lucru. Clienții cu lead-uri deschise sau termene active apar aici."}
                </div>
              ) : (
                <div className="space-y-4 lg:space-y-3">
                  {inLucruGrouped.map((group) => (
                    <div key={group.id} className="space-y-1.5">
                      <div className="flex items-center justify-between px-3 py-1 text-[11px] uppercase tracking-wide font-medium select-none">
                        <span className={group.id === "attention" ? "text-destructive font-semibold" : "text-muted-foreground"}>
                          {group.label}
                        </span>
                        <span className="text-[13px] text-muted-foreground tabular-nums font-normal">
                          {group.customers.length}
                        </span>
                      </div>

                      <div className="bg-card border border-border rounded-xl overflow-hidden lg:bg-transparent lg:border-0 lg:rounded-none lg:overflow-visible lg:space-y-1">
                        {group.customers.map((customer, index) => (
                          <div key={customer.phone} className={index > 0 ? "border-t border-border lg:border-t-0" : ""}>
                            <CustomerRow customer={customer} variant="plain" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* View 2: Active leads grouped */}
          {filter === "active" && (
            <>
              {activeGrouped.length === 0 ? (
                <div className="text-[15px] text-muted-foreground text-center py-8">
                  {search.trim()
                    ? `Niciun client găsit pentru „${search}” în cereri active.`
                    : "Niciun client cu cereri active."}
                </div>
              ) : (
                <div className="space-y-4 lg:space-y-3">
                  {activeVisibleGroups.map((group) => (
                    <div key={group.id} className="space-y-1.5">
                      <div className="flex items-center justify-between px-3 py-1 text-[11px] uppercase tracking-wide font-medium select-none">
                        <span className="text-muted-foreground">
                          {group.label}
                        </span>
                        <span className="text-[13px] text-muted-foreground tabular-nums font-normal">
                          {group.customers.length}
                        </span>
                      </div>

                      <div className="bg-card border border-border rounded-xl overflow-hidden lg:bg-transparent lg:border-0 lg:rounded-none lg:overflow-visible lg:space-y-1">
                        {group.customers.map((customer, index) => (
                          <div key={customer.phone} className={index > 0 ? "border-t border-border lg:border-t-0" : ""}>
                            <CustomerRow customer={customer} variant="plain" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {vechiGroup && !showOldActiveLeads && (
                    <button
                      type="button"
                      onClick={() => setShowOldActiveLeads(true)}
                      className="w-full min-h-[48px] rounded-xl border border-border bg-card text-[14px] font-medium text-foreground hover:bg-accent/40 transition-colors flex items-center justify-center gap-1.5"
                    >
                      Arată cereri vechi ({vechiGroup.customers.length}) <ChevronDown className="w-4 h-4" />
                    </button>
                  )}

                  {vechiGroup && showOldActiveLeads && (
                    <button
                      type="button"
                      onClick={() => setShowOldActiveLeads(false)}
                      className="w-full min-h-[48px] rounded-xl border border-border bg-card text-[14px] font-medium text-muted-foreground hover:bg-accent/40 transition-colors flex items-center justify-center gap-1.5"
                    >
                      Ascunde cereri vechi <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* View 3: Category filter */}
          {filter !== "inlucru" && filter !== "active" && (
            <>
              {totiFiltered.length === 0 ? (
                <div className="text-[15px] text-muted-foreground text-center py-8">
                  {search.trim() ? `Niciun client găsit pentru „${search}”` : "Niciun client în această categorie."}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden lg:bg-transparent lg:border-0 lg:rounded-none lg:overflow-visible lg:space-y-1">
                  {totiFiltered.map((customer, index) => (
                    <div key={customer.phone} className={index > 0 ? "border-t border-border lg:border-t-0" : ""}>
                      <CustomerRow customer={customer} variant="plain" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
      <NewLeadDialog
        open={isNewLeadOpen}
        onOpenChange={setIsNewLeadOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["customers"] });
        }}
      />
    </div>
  );
};

export default CustomersPage;

