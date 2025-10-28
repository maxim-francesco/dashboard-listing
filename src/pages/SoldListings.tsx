
import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ClipboardCheck, ImageIcon, MoreHorizontal, Undo2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import api, { getSoldListings, reactivateListing, deleteListing } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";

interface SoldListing {
  id: string;
  title: string;
  category: {
    name: string;
  };
  sellingPrice: number;
  soldAt: string | null;
  images?: { url: string }[];
}

const SoldListings = () => {
  const queryClient = useQueryClient();
  const { data: listings = [], isLoading } = useQuery<SoldListing[]>({
    queryKey: ['soldListings'],
    queryFn: getSoldListings,
    refetchOnWindowFocus: false,
  });

  const { mutate: reactivate } = useMutation({
    mutationFn: reactivateListing,
    onSuccess: (data, variables) => {
      const reactivatedListing = listings.find(l => l.id === variables);
      toast.success(`Anunțul "${reactivatedListing?.title}" a fost reactivat!`);
      queryClient.invalidateQueries({ queryKey: ['soldListings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
    onError: () => {
      toast.error("Nu s-a putut reactiva anunțul.");
    },
  });

  const { mutate: deletePermanently } = useMutation({
    mutationFn: deleteListing,
    onSuccess: (data, variables) => {
      toast.success("Înregistrarea a fost ștearsă definitiv.");
      queryClient.invalidateQueries({ queryKey: ['soldListings'] });
    },
    onError: () => {
      toast.error("Eroare la ștergerea anunțului.");
    }
  });

  const handleReactivate = (listing: SoldListing) => {
    reactivate(listing.id);
  };

  const handleDelete = (listing: SoldListing) => {
    if (window.confirm(`Ești sigur că vrei să ștergi definitiv anunțul "${listing.title}"? Această acțiune nu poate fi anulată.`)) {
      deletePermanently(listing.id);
    }
  };

  useEffect(() => {
    if (listings) {
      console.log("--- RAW DATA FROM BACKEND ---");
      console.log(listings);
    }
  }, [listings]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mașini Vândute</h1>
        <p className="text-muted-foreground mt-2">
          Vezi un istoric al tuturor mașinilor care au fost marcate ca vândute.
        </p>
      </div>

      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Istoric Vânzări</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă mașinile vândute...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                <ClipboardCheck className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">Nicio mașină vândută</h3>
                <p className="text-sm">Când vei marca o mașină ca vândută, va apărea aici.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Imagine</TableHead>
                    <TableHead className="text-foreground font-medium">Titlu</TableHead>
                    <TableHead className="text-foreground font-medium">Categorie</TableHead>
                    <TableHead className="text-foreground font-medium">Preț Vânzare</TableHead>
                    <TableHead className="text-foreground font-medium">Dată Vânzare</TableHead>
                    <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id} className="border-border">
                      <TableCell>
                        {listing.images && listing.images.length > 0 ? (
                          <img 
                            src={listing.images[0].url} 
                            alt={listing.title} 
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{listing.title}</TableCell>
                      <TableCell className="text-muted-foreground">{listing.category.name}</TableCell>
                      <TableCell className="font-semibold text-success">
                        {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR' }).format(listing.sellingPrice)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {listing.soldAt
                          ? format(new Date(listing.soldAt), "dd MMM yyyy")
                          : 'Dată indisponibilă'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Deschide meniu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem
                              onClick={() => handleReactivate(listing)}
                              className="cursor-pointer"
                            >
                              <Undo2 className="mr-2 h-4 w-4" />
                              <span>Reactivează Anunț</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(listing)}
                              className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Șterge Definitiv</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SoldListings;
