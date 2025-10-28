
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ClipboardCheck, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { getSoldListings } from "@/services/api";

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
  const { data: listings = [], isLoading } = useQuery<SoldListing[]>({
    queryKey: ['soldListings'],
    queryFn: getSoldListings,
    refetchOnWindowFocus: false,
  });

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
