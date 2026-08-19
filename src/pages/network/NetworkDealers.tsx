import { Fragment, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Phone,
  MessageSquare,
  Loader2,
  ChevronRight,
  Building2,
  MapPin,
  Mail,
} from "lucide-react";
import { getNetworkDealers, getOrCreateConversation, NetworkDealer } from "@/services/api";
import { roCount } from "@/lib/plural";
import { norm } from "@/lib/normalize";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { isForbidden } from "@/lib/isForbidden";
import NetworkOffline from "@/components/network/NetworkOffline";
import NetworkHeader from "@/components/network/NetworkHeader";
import { Input } from "@/components/ui/input";
import { CARD } from "@/components/today/cardRecipe";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function NetworkDealers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedDealer, setSelectedDealer] = useState<NetworkDealer | null>(null);

  const { data: dealers, isLoading, isError, error } = useQuery<NetworkDealer[]>({
    queryKey: ["network-dealers"],
    queryFn: getNetworkDealers,
  });

  const mutation = useMutation({
    mutationFn: (dealerId: string) =>
      getOrCreateConversation({ otherBusinessId: dealerId, contextType: "GENERAL" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedDealer(null);
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

  const countText =
    query.trim() === ""
      ? `${roCount(sortedDealers.length, "dealer", "dealeri")} în rețea`
      : `${roCount(filteredDealers.length, "rezultat", "rezultate")} din ${sortedDealers.length}`;

  const searchElement = (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        name="dealers-search"
        aria-label="Caută după nume sau oraș"
        placeholder="Caută după nume sau oraș..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 pr-9 bg-card border-border rounded-lg w-full h-11 text-[15px] focus-visible:ring-0 focus-visible:border-border"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Șterge căutarea"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <NetworkHeader
          title="Dealeri"
          countText="Se încarcă..."
          backHref="/network"
          backAriaLabel="Înapoi la rețea"
        />
        <div className="flex items-center justify-center py-12">
          <span className="text-[13px] text-muted-foreground">Se încarcă...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 box-border w-full pb-24">
        <NetworkHeader
          title="Dealeri"
          countText="Eroare"
          backHref="/network"
          backAriaLabel="Înapoi la rețea"
        />
        {isForbidden(error) ? (
          <NetworkOffline />
        ) : (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[13px] text-center">
            A apărut o eroare la încărcarea dealerilor. Vă rugăm să încercați din nou.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 box-border w-full pb-24">
      {/* HEADER */}
      <NetworkHeader
        title="Dealeri"
        countText={countText}
        backHref="/network"
        backAriaLabel="Înapoi la rețea"
      >
        {sortedDealers.length > 0 && searchElement}
      </NetworkHeader>

      {sortedDealers.length === 0 ? (
        /* EMPTY STATE: NO DEALERS AT ALL */
        <div className={cn(CARD, "p-6 text-center")}>
          <p className="text-[13px] text-muted-foreground">Nu există alți dealeri în rețea.</p>
        </div>
      ) : filteredDealers.length === 0 ? (
        /* EMPTY STATE: QUERY MATCHES NOTHING */
        <div className={cn(CARD, "p-6 text-center space-y-3")}>
          <p className="text-[13px] text-muted-foreground">
            Niciun dealer nu se potrivește cu «{query}».
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-primary text-[13px] font-medium hover:underline min-h-[44px] px-3 flex items-center justify-center"
            >
              Șterge căutarea
            </button>
          </div>
        </div>
      ) : (
        /* LIST */
        <div className={cn(CARD, "overflow-hidden")}>
          {filteredDealers.map((dealer, idx) => (
            <Fragment key={dealer.id}>
              {idx > 0 && <div className="border-t border-border/40 ml-4" />}
              <button
                type="button"
                onClick={() => setSelectedDealer(dealer)}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left select-none"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-[15px] font-medium text-foreground truncate">
                    {dealer.name}
                  </div>
                  {dealer.city && (
                    <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                      {dealer.city}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </Fragment>
          ))}
        </div>
      )}

      {/* DEALER DETAIL SHEET */}
      <Sheet
        open={!!selectedDealer}
        onOpenChange={(open) => {
          if (!open) setSelectedDealer(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="bg-card border-border rounded-t-xl p-4 space-y-4 max-h-[85vh] overflow-y-auto"
        >
          {selectedDealer && (
            <>
              <SheetHeader className="pb-2 border-b border-border text-left">
                <SheetTitle className="text-[17px] font-semibold text-foreground truncate">
                  {selectedDealer.name}
                </SheetTitle>
                <SheetDescription className="text-[12px] text-muted-foreground truncate">
                  {selectedDealer.city || "Dealer partener în rețea"}
                </SheetDescription>
              </SheetHeader>

              {/* DETAILS BLOCK */}
              <div className="space-y-2.5 text-[13px] bg-background/50 p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Companie</span>
                  </div>
                  <span className="font-medium text-foreground text-right truncate">
                    {selectedDealer.name}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Oraș</span>
                  </div>
                  <span className="text-foreground text-right truncate">
                    {selectedDealer.city || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>Telefon</span>
                  </div>
                  {selectedDealer.contactPhone ? (
                    <a
                      href={`tel:${selectedDealer.contactPhone}`}
                      className="font-medium text-primary hover:underline text-right tabular-nums"
                    >
                      {selectedDealer.contactPhone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                {selectedDealer.contactEmail && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>Email</span>
                    </div>
                    <a
                      href={`mailto:${selectedDealer.contactEmail}`}
                      className="font-medium text-primary hover:underline text-right truncate max-w-[200px]"
                    >
                      {selectedDealer.contactEmail}
                    </a>
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 pt-2 border-t border-border">
                {selectedDealer.contactPhone && (
                  <a
                    href={`tel:${selectedDealer.contactPhone}`}
                    className="flex-1 min-h-[44px] h-11 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-medium text-[14px] flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>Sună</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => mutation.mutate(selectedDealer.id)}
                  disabled={mutation.isPending}
                  className="flex-1 min-h-[44px] h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[14px] flex items-center justify-center gap-2 transition-colors"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  <span>Scrie mesaj</span>
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
