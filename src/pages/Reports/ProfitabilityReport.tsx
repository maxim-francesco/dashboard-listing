
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getSoldListings } from "@/services/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import KpiCard from "@/components/reports/KpiCard";

interface SoldListing {
  id: string;
  title: string;
  purchasePrice: number | null;
  otherCosts: number | null;
  sellingPrice: number;
}

const calculateProfit = (listing: SoldListing) => {
  const totalCost = (listing.purchasePrice || 0) + (listing.otherCosts || 0);
  if (totalCost === 0 && (listing.purchasePrice === null || listing.purchasePrice === 0)) {
    return null;
  }
  return listing.sellingPrice - totalCost;
};

const ProfitabilityReport = () => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { data: soldListings = [], isLoading } = useQuery<SoldListing[]>({
    queryKey: ["soldListingsForReport"],
    queryFn: getSoldListings,
  });

  const listingsWithProfit = soldListings
    .map(listing => ({
      ...listing,
      profit: calculateProfit(listing),
    }));
  
  const profitableListings = listingsWithProfit.filter(l => l.profit !== null);

  const totalRevenue = profitableListings.reduce((acc, curr) => acc + curr.sellingPrice, 0);
  const totalProfit = profitableListings.reduce((acc, curr) => acc + (curr.profit || 0), 0);
  const totalSold = profitableListings.length;
  const avgProfitPerVehicle = totalSold > 0 ? totalProfit / totalSold : 0;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const getProfitBadge = (profit: number | null) => {
    if (profit === null) {
      return <Badge variant="secondary">N/A</Badge>;
    }
    if (profit > 0) {
      return <Badge className="bg-success-light text-success border border-success/20">{formatCurrency(profit)}</Badge>;
    }
    if (profit < 0) {
      return <Badge variant="destructive">{formatCurrency(profit)}</Badge>;
    }
    return <Badge variant="secondary">{formatCurrency(profit)}</Badge>;
  };

  const kpiData = [
      { title: 'Profit Total', value: formatCurrency(totalProfit) },
      { title: 'Venituri Totale', value: formatCurrency(totalRevenue) },
      { title: 'Mașini Vândute', value: totalSold.toString() },
      { title: 'Profit Mediu / Mașină', value: formatCurrency(avgProfitPerVehicle) },
  ];

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
            <CardTitle>Filtrează Raportul</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ro }) : <span>Dată de început</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover">
                <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ro }) : <span>Dată de sfârșit</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover">
                <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
            <Button className="w-full sm:w-auto">Generează Raport</Button>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map(kpi => (
            <KpiCard key={kpi.title} title={kpi.title} value={isLoading ? '...' : kpi.value} />
        ))}
      </div>

      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Detalii pe Anunț</CardTitle>
          <CardDescription>
            Doar anunțurile cu preț de achiziție sunt incluse în calculul profitului.
          </CardDescription>
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
