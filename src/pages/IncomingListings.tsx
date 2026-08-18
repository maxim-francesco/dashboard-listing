import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Truck } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getIncomingListings } from "@/services/api";
import ListingCard from "@/components/listings/ListingCard";
import ListingsHeader, { SortOption, SortOptionItem } from "@/components/listings/ListingsHeader";
import GenerateCatalogModal from "@/components/modals/GenerateCatalogModal";
import { roCount } from "@/lib/plural";

const INCOMING_SORT_OPTIONS: SortOptionItem[] = [
  { value: "age_desc", label: "Vechime: cele mai vechi" },
  { value: "age_asc", label: "Vechime: cele mai noi" },
];

export default function IncomingListings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("age_desc");
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const { data: listings = [], isLoading } = useQuery<any[]>({
    queryKey: ["incomingListings"],
    queryFn: async () => {
      const data = await getIncomingListings();
      return data.map((l: any) => ({ ...l, status: l.status ?? "INCOMING" }));
    },
    refetchOnWindowFocus: false,
  });

  const filteredListings = listings
    .filter((listing: any) =>
      listing.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "age_asc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "age_desc":
        default:
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });

  const countText = roCount(filteredListings.length, "mașină", "mașini");

  return (
    <div className="space-y-4 max-w-[390px] mx-auto md:max-w-full pb-24">
      <ListingsHeader
        title="Sosesc în curând"
        countText={countText}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOptions={INCOMING_SORT_OPTIONS}
        primaryActionHref="/listings/new?status=INCOMING"
        primaryActionLabel="Adaugă mașină care sosește"
        overflowMenuItems={
          <DropdownMenuItem
            onSelect={() => setIsCatalogModalOpen(true)}
            onClick={() => setIsCatalogModalOpen(true)}
            className="cursor-pointer text-[13px]"
          >
            Generează catalog PDF
          </DropdownMenuItem>
        }
      />

      <div className="px-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Truck className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-[15px] font-medium text-foreground">Nicio mașină care sosește.</h3>
            <p className="text-xs text-muted-foreground mt-1">Mașinile marcate „Sosește" apar aici.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredListings.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} segment="instoc" />
            ))}
          </div>
        )}
      </div>

      <GenerateCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        fixedSegment="incoming"
      />
    </div>
  );
}
