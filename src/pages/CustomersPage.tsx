import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Plus } from "lucide-react";
import { getCustomers, CustomerListItem } from "@/services/api";
import CustomerRow, { getDeadline, getBucket, CUSTOMER_COLS } from "@/components/customers/CustomerRow";
import CustomersMenu from "@/components/customers/CustomersMenu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { formatEur } from "@/lib/format";
import { roCount } from "@/lib/plural";
import { isInLucru } from "@/hooks/useInLucruCount";

const CustomersPage = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");
  const [search, setSearch] = useState("");
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  const { data: customers = [], isLoading } = useQuery<CustomerListItem[]>({
    queryKey: ['customers'],
    queryFn: getCustomers,
    refetchOnWindowFocus: false,
  });

  const inLucruCustomers = useMemo(() => {
    return customers.filter(isInLucru);
  }, [customers]);

  const inLucruCount = inLucruCustomers.length;

  const { urgente, avans } = useMemo(() => {
    let countUrgente = 0;
    let sumAvans = 0;
    for (const c of customers) {
      const deadline = getDeadline(c);
      if (deadline) {
        const bucket = getBucket(deadline);
        if (bucket === "expirat" || bucket === "azi" || bucket === "maine") {
          countUrgente++;
        }
      }
      if (c.activeReservation && c.activeReservation.depositAmount != null) {
        sumAvans += c.activeReservation.depositAmount;
      }
    }
    return { urgente: countUrgente, avans: sumAvans };
  }, [customers]);

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (urgente > 0) {
      parts.push(`${urgente} ${urgente === 1 ? "termen" : "termene"} până mâine`);
    }
    if (avans > 0) {
      parts.push(`${formatEur(avans)} avans în casă`);
    }
    if (parts.length === 0) {
      parts.push(`${inLucruCount} în lucru`);
    }
    return parts.join(" · ");
  }, [urgente, avans, inLucruCount]);

  const inLucruGrouped = useMemo(() => {
    if (filter !== "inlucru") return [];

    const term = search.toLowerCase().trim();
    let list = inLucruCustomers;
    if (term) {
      const cleanSearch = term.replace(/\D/g, "");
      list = list.filter((c) => {
        const cleanPhone = c.phone.replace(/\D/g, "");
        const nameMatch = c.name.toLowerCase().includes(term);
        const phoneMatch = (cleanSearch ? cleanPhone.includes(cleanSearch) : false) || c.phone.includes(term);
        return nameMatch || phoneMatch;
      });
    }

    const needsAttentionList: CustomerListItem[] = [];
    const restList: CustomerListItem[] = [];

    for (const c of list) {
      const isUnread = !!(c.openLead && !c.openLead.isRead);
      const deadline = getDeadline(c);
      const bucket = getBucket(deadline);
      const isUrgent = bucket === "expirat" || bucket === "azi" || bucket === "maine";

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
  }, [inLucruCustomers, search, filter]);

  const totiFiltered = useMemo(() => {
    if (!filter || filter === "inlucru") return [];

    let list = customers;
    if (filter === "noi") {
      list = customers.filter((c) => c.hasUnreadLead === true || (c.openLead && !c.openLead.isRead));
    } else if (filter === "financing") {
      list = customers.filter((c) => c.leadTypes?.includes("FINANCING"));
    } else if (filter === "order") {
      list = customers.filter((c) => c.leadTypes?.includes("ORDER"));
    } else if (filter === "appointments") {
      list = customers.filter((c) => c.nextAppointment != null);
    } else if (filter === "offers") {
      list = customers.filter((c) => c.pendingOffer != null);
    } else if (filter === "reservations") {
      list = customers.filter((c) => c.activeReservation != null);
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
  }, [customers, search, filter]);

  const getPageTitle = () => {
    if (filter === "inlucru") return "În lucru";
    if (filter === "noi") return "Cereri noi";
    if (filter === "financing") return "Finanțare";
    if (filter === "order") return "Mașini la comandă";
    if (filter === "appointments") return "Programări";
    if (filter === "offers") return "Oferte trimise";
    if (filter === "reservations") return "Rezervări active";
    if (filter === "all") return "Toți clienții";
    return "Clienți";
  };

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
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                to="/customers"
                className="inline-flex items-center text-[13px] text-primary hover:underline mb-1 lg:hidden"
              >
                ← Înapoi la categorii
              </Link>
              <h1 className="text-[20px] font-semibold text-foreground leading-tight">
                {getPageTitle()}
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {filter === "inlucru" ? subtitle : roCount(totiFiltered.length, "client", "clienți")}
              </p>
            </div>
            <Button
              onClick={() => setIsNewLeadOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[13px] h-9 px-3 rounded-lg flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Lead nou</span>
            </Button>
          </div>

          {/* Search Input */}
          <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-2 lg:mx-0 lg:px-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="customer-search"
                name="customer-search"
                placeholder={
                  filter === "inlucru"
                    ? "Caută în clienții în lucru..."
                    : "Caută după nume sau telefon..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background border-input text-foreground h-11 text-[15px]"
              />
            </div>
          </div>

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

          {/* View 2: Category filter */}
          {filter !== "inlucru" && (
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
          queryClient.invalidateQueries({ queryKey: ["message-counts"] });
        }}
      />
    </div>
  );
};

export default CustomersPage;

