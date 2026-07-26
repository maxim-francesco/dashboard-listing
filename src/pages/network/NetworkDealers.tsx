import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, X, Phone, MessageSquare, Loader2 } from "lucide-react";
import { getNetworkDealers, getOrCreateConversation, NetworkDealer } from "@/services/api";
import { roCount } from "@/lib/plural";
import { norm } from "@/lib/normalize";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";

const getInitials = (name?: string | null) => {
  if (!name) return "";
  const cleanName = name.trim();
  if (!cleanName) return "";
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function NetworkDealers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const { data: dealers, isLoading, isError, error } = useQuery<NetworkDealer[]>({
    queryKey: ["network-dealers"],
    queryFn: getNetworkDealers,
  });

  const mutation = useMutation({
    mutationFn: (dealerId: string) =>
      getOrCreateConversation({ otherBusinessId: dealerId, contextType: "GENERAL" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/network/messages/${data.id}`);
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.message || "Eroare la crearea conversației.";
      toast.error(errMsg);
    },
  });

  const sortedDealers = dealers
    ? [...dealers].sort((a, b) =>
        a.name.localeCompare(b.name, "ro", { sensitivity: "base" })
      )
    : [];

  const filteredDealers = sortedDealers.filter((dealer) => {
    const normName = norm(dealer.name);
    const normCity = norm(dealer.city || "");
    const normQuery = norm(query);
    return normName.includes(normQuery) || normCity.includes(normQuery);
  });

  return (
    <div className="space-y-4 box-border w-full pb-24">
      {/* HEADER */}
      <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/network")}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 rounded-full shrink-0"
            aria-label="Înapoi"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold">Dealeri</h1>
        </div>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Sună sau scrie oricărui dealer din rețea.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-[15px] text-muted-foreground">Se încarcă...</span>
        </div>
      ) : isError ? (
        isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[15px] text-center">
            A apărut o eroare la încărcarea dealerilor. Vă rugăm să încercați din nou.
          </div>
        )
      ) : sortedDealers.length === 0 ? (
        /* EMPTY STATE: NO DEALERS AT ALL */
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[15px] text-foreground">Nu există alți dealeri în rețea.</p>
        </div>
      ) : (
        <>
          {/* SEARCH BOX */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Caută după nume sau oraș"
              className="w-full min-h-[44px] text-[15px] bg-card border border-border rounded-xl pl-10 pr-10 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full"
                aria-label="Șterge căutarea"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* COUNT LINE */}
          <div className="text-[13px] text-muted-foreground">
            {query.trim() === ""
              ? `${roCount(sortedDealers.length, "dealer", "dealeri")} în rețea`
              : `${roCount(filteredDealers.length, "rezultat", "rezultate")}`}
          </div>

          {filteredDealers.length === 0 ? (
            /* EMPTY STATE: QUERY MATCHES NOTHING */
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
              <p className="text-[15px] text-foreground">
                Niciun dealer nu se potrivește cu «{query}».
              </p>
              <button
                onClick={() => setQuery("")}
                className="text-primary text-[15px] font-medium hover:underline h-11 flex items-center justify-start w-fit"
              >
                Șterge căutarea
              </button>
            </div>
          ) : (
            /* LIST */
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex flex-col">
                {filteredDealers.map((dealer, idx) => {
                  const initials = getInitials(dealer.name);
                  const isPending = mutation.isPending && mutation.variables === dealer.id;

                  return (
                    <div
                      key={dealer.id}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 gap-3 min-h-[64px]",
                        idx > 0 ? "border-t border-border" : ""
                      )}
                    >
                      {/* Initials circle */}
                      <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold shrink-0 text-sm">
                        {initials}
                      </div>

                      {/* Middle block */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-medium truncate text-foreground">
                          {dealer.name}
                        </div>
                        {dealer.city && (
                          <div className="text-[13px] text-muted-foreground truncate mt-0.5">
                            {dealer.city}
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {dealer.contactPhone && (
                          <a
                            href={`tel:${dealer.contactPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-11 h-11 rounded-full bg-success-light text-success flex items-center justify-center shrink-0"
                            aria-label={`Sună pe ${dealer.name}`}
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            mutation.mutate(dealer.id);
                          }}
                          disabled={isPending}
                          className="w-11 h-11 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0"
                          aria-label={`Scrie lui ${dealer.name}`}
                        >
                          {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <MessageSquare className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
