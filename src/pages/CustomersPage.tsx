import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Check } from "lucide-react";
import { getCustomers, CustomerListItem } from "@/services/api";
import CustomerRow, { getDeadline, getBucket, Bucket } from "@/components/customers/CustomerRow";
import { Input } from "@/components/ui/input";
import { formatEur } from "@/lib/format";
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
      return `${customers.length} ${customers.length === 1 ? "persoană" : "persoane"}`;
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

    const groupsMap: Record<Bucket, CustomerListItem[]> = {
      expirat: [],
      azi: [],
      maine: [],
      saptamana: [],
      tarziu: [],
    };

    for (const c of list) {
      const deadline = getDeadline(c);
      const bucket = getBucket(deadline);
      groupsMap[bucket].push(c);
    }

    for (const bucket of BUCKET_ORDER) {
      groupsMap[bucket].sort((a, b) => {
        const dA = getDeadline(a);
        const dB = getDeadline(b);
        const tA = dA ? dA.getTime() : Infinity;
        const tB = dB ? dB.getTime() : Infinity;
        return tA - tB;
      });
    }

    const groups: { bucket: Bucket; label: string; customers: CustomerListItem[] }[] = [];
    for (const bucket of BUCKET_ORDER) {
      if (groupsMap[bucket].length > 0) {
        groups.push({
          bucket,
          label: BUCKET_LABELS[bucket],
          customers: groupsMap[bucket],
        });
      }
    }
    return groups;
  }, [activeSegment, inLucruCustomers, search]);

  const totiFiltered = useMemo(() => {
    if (activeSegment !== "toti") return [];

    const sorted = [...customers].sort((a, b) => {
      return a.name.localeCompare(b.name, "ro", { sensitivity: "base" });
    });

    const term = search.toLowerCase().trim();
    if (!term) return sorted;

    const cleanSearch = term.replace(/\D/g, "");

    return sorted.filter((c) => {
      const cleanPhone = c.phone.replace(/\D/g, "");
      const nameMatch = c.name.toLowerCase().includes(term);
      const phoneMatch = (cleanSearch ? cleanPhone.includes(cleanSearch) : false) || c.phone.includes(term);
      return nameMatch || phoneMatch;
    });
  }, [activeSegment, customers, search]);

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
      <div>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Clienți</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSegment("inlucru")}
            className={`flex-1 h-11 rounded-lg text-[15px] font-medium transition-colors ${
              activeSegment === "inlucru"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            În lucru ({inLucruCount})
          </button>
          <button
            onClick={() => setActiveSegment("toti")}
            className={`flex-1 h-11 rounded-lg text-[15px] font-medium transition-colors ${
              activeSegment === "toti"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            Toți ({customers.length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Caută după nume sau telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-input text-foreground h-11"
          />
        </div>
      </div>

      {activeSegment === "inlucru" && inLucruCount === 0 && !search.trim() ? (
        <div className="bg-success-light rounded-xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-success text-success-foreground flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-success">Nimic în lucru</h3>
            <p className="text-sm text-success">Nicio rezervare, ofertă sau programare activă.</p>
          </div>
        </div>
      ) : (activeSegment === "inlucru" ? inLucruGrouped.length === 0 : totiFiltered.length === 0) ? (
        <div className="text-[15px] text-muted-foreground text-center py-8">
          Niciun client găsit pentru „{search}"
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {activeSegment === "inlucru" ? (
            inLucruGrouped.map((group, groupIndex) => (
              <div key={group.bucket}>
                <div className={getHeaderClasses(group.bucket, groupIndex === 0)}>
                  {group.label}
                </div>
                {group.customers.map((customer) => (
                  <div key={customer.phone} className="border-t border-border">
                    {/* Rendered with variant action: filled button, no-day prefix in appointment lead, show line 3 */}
                    <CustomerRow customer={customer} variant="action" />
                  </div>
                ))}
              </div>
            ))
          ) : (
            totiFiltered.map((customer, index) => (
              <div key={customer.phone} className={index > 0 ? "border-t border-border" : ""}>
                {/* Rendered with variant plain: tinted button, day prefix in appointment lead (e.g. mâine), hide line 3 */}
                <CustomerRow customer={customer} variant="plain" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
