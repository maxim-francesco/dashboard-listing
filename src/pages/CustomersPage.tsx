import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Check } from "lucide-react";
import { getCustomers, CustomerListItem } from "@/services/api";
import CustomerRow, { getDeadline, getBucket, Bucket } from "@/components/customers/CustomerRow";
import CustomersMenu from "@/components/customers/CustomersMenu";
import { Input } from "@/components/ui/input";
import { formatEur } from "@/lib/format";
import { roCount } from "@/lib/plural";
import { isInLucru } from "@/hooks/useInLucruCount";

const BUCKET_ORDER: Bucket[] = ["expirat", "azi", "maine", "saptamana", "tarziu"];
const BUCKET_LABELS: Record<Bucket, string> = {
  expirat: "expirate",
  azi: "azi",
  maine: "mâine",
  saptamana: "săptămâna asta",
  tarziu: "mai târziu",
};

const getHeaderClasses = (bucket: Bucket, isFirst: boolean) => {
  const base = `px-3.5 py-1.5 text-[11px] tracking-wide font-medium uppercase ${isFirst ? "" : "border-t border-border"}`;
  if (bucket === "expirat") {
    return `${base} bg-destructive/10 text-destructive`;
  }
  if (bucket === "azi" || bucket === "maine") {
    return `${base} bg-warning-light text-warning`;
  }
  return `${base} bg-muted text-muted-foreground`;
};

const CustomersPage = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");
  const [search, setSearch] = useState("");
  const [activeSegment, setActiveSegment] = useState<"inlucru" | "toti">("inlucru");

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
    if (activeSegment === "inlucru") {
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
    } else {
      return roCount(customers.length, "persoană", "persoane");
    }
  }, [activeSegment, urgente, avans, inLucruCount, customers.length]);

  const inLucruGrouped = useMemo(() => {
    if (activeSegment !== "inlucru") return [];

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

    const groups: { id: "attention" | "rest"; label: string; headerClass: string; customers: CustomerListItem[] }[] = [];

    if (needsAttentionList.length > 0) {
      groups.push({
        id: "attention",
        label: "Necesită atenție",
        headerClass: "bg-destructive/10 text-destructive",
        customers: needsAttentionList,
      });
    }

    if (restList.length > 0) {
      groups.push({
        id: "rest",
        label: "Restul",
        headerClass: "bg-muted text-muted-foreground",
        customers: restList,
      });
    }

    return groups;
  }, [activeSegment, inLucruCustomers, search]);

  const totiFiltered = useMemo(() => {
    if (filter) {
      let list = customers;
      if (filter === "noi") {
        list = customers.filter((c) => c.hasUnreadLead === true);
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
      } else if (filter === "all") {
        list = customers;
      }

      const term = search.toLowerCase().trim();
      if (term) {
        const cleanSearch = term.replace(/\D/g, "");
        list = list.filter((c) => {
          const cleanPhone = c.phone.replace(/\D/g, "");
          const nameMatch = c.name.toLowerCase().includes(term);
          const phoneMatch = (cleanSearch ? cleanPhone.includes(cleanSearch) : false) || c.phone.includes(term);
          return nameMatch || phoneMatch;
        });
      }

      return list;
    }

    if (activeSegment !== "toti") return [];

    const sorted = customers;

    const term = search.toLowerCase().trim();
    if (!term) return sorted;

    const cleanSearch = term.replace(/\D/g, "");

    return sorted.filter((c) => {
      const cleanPhone = c.phone.replace(/\D/g, "");
      const nameMatch = c.name.toLowerCase().includes(term);
      const phoneMatch = (cleanSearch ? cleanPhone.includes(cleanSearch) : false) || c.phone.includes(term);
      return nameMatch || phoneMatch;
    });
  }, [activeSegment, customers, search, filter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Se încarcă clienții...</p>
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
          <div>
            <Link to="/customers" className="inline-flex items-center text-[13px] text-primary hover:underline mb-1">
              ← Înapoi la categorii
            </Link>
            <h1 className="text-[20px] font-semibold text-foreground leading-tight">
              {filter === "noi" && "Cereri noi"}
              {filter === "financing" && "Finanțare"}
              {filter === "order" && "Mașini la comandă"}
              {filter === "appointments" && "Programări"}
              {filter === "offers" && "Oferte trimise"}
              {filter === "reservations" && "Rezervări active"}
              {filter === "all" && "Toți clienții"}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {roCount(totiFiltered.length, "client", "clienți")}
            </p>
          </div>

          <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="customer-search"
                name="customer-search"
                placeholder="Caută după nume sau telefon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background border-input text-foreground h-11"
              />
            </div>
          </div>

          {totiFiltered.length === 0 ? (
            <div className="text-[15px] text-muted-foreground text-center py-8">
              {search.trim() ? `Niciun client găsit pentru „${search}”` : "Niciun client în această categorie."}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {totiFiltered.map((customer, index) => (
                <div key={customer.phone} className={index > 0 ? "border-t border-border" : ""}>
                  {/* Rendered with variant plain: tinted button, day prefix in appointment lead (e.g. mâine), hide line 3 */}
                  <CustomerRow customer={customer} variant="plain" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomersPage;
