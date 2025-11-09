import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { getSoldListings } from "@/services/api";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SoldListing {
  id: string;
  title: string;
  purchasePrice: number | null;
  otherCosts: number | null;
  sellingPrice: number;
}

const calculateProfit = (listing: SoldListing) => {
  const totalCost = (listing.purchasePrice || 0) + (listing.otherCosts || 0);
  if (totalCost === 0) return null; // Can't calculate profit if we don't know the cost
  return listing.sellingPrice - totalCost;
};

const ProfitabilityReport = () => {
  const { data: soldListings = [], isLoading } = useQuery<SoldListing[]>({
    queryKey: ["soldListingsForReport"],
    queryFn: getSoldListings,
  });

  const listingsWithProfit = soldListings
    .map(listing => ({
      ...listing,
      profit: calculateProfit(listing),
    }))
    .filter(listing => listing.profit !== null);

  const totalProfit = listingsWithProfit.reduce((acc, curr) => acc + (curr.profit || 0), 0);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const getProfitBadge = (profit: number | null) => {
    if (profit === null) return null;
    if (profit > 0) {
      return <Badge className="bg-success text-success-foreground">{formatCurrency(profit)}</Badge>;
    }
    if (profit < 0) {
      return <Badge variant="destructive">{formatCurrency(profit)}</Badge>;
    }
    return <Badge variant="secondary">{formatCurrency(profit)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Raport de Profitabilitate</h1>
        <p className="text-muted-foreground mt-2">
          Analizează profitul generat de fiecare mașină vândută.
        </p>
      </div>

      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Profit Total</CardTitle>
          <CardDescription>
            Suma profitului din toate anunțurile vândute cu preț de achiziție înregistrat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-success">
            {formatCurrency(totalProfit)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Detalii pe Anunț</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anunț</TableHead>
                    <TableHead className="text-right">Preț Vânzare</TableHead>
                    <TableHead className="text-right">Preț Achiziție</TableHead>
                    <TableHead className="text-right">Alte Costuri</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listingsWithProfit.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.title}</TableCell>
                      <TableCell className="text-right">{formatCurrency(listing.sellingPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(listing.purchasePrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(listing.otherCosts)}</TableCell>
                      <TableCell className="text-right">{getProfitBadge(listing.profit)}</TableCell>
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

export default ProfitabilityReport;
