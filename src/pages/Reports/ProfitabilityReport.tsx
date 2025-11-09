
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, BarChart2 } from "lucide-react";
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
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
  soldAt: string | null;
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

  const filteredListings = useMemo(() => {
    if (!startDate && !endDate) {
      return soldListings;
    }
    return soldListings.filter(listing => {
        if (!listing.soldAt) return false;
        const soldDate = new Date(listing.soldAt);
        const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
        const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;

        if (start && soldDate < start) return false;
        if (end && soldDate > end) return false;
        return true;
    });
  }, [soldListings, startDate, endDate]);

  const listingsWithProfit = useMemo(() => filteredListings
    .map(listing => ({
      ...listing,
      profit: calculateProfit(listing),
    })), [filteredListings]);
  
  const profitableListings = listingsWithProfit.filter(l => l.profit !== null);

  const totalRevenue = profitableListings.reduce((acc, curr) => acc + curr.sellingPrice, 0);
  const totalProfit = profitableListings.reduce((acc, curr) => acc + (curr.profit || 0), 0);
  const totalSold = profitableListings.length;
  const avgProfitPerVehicle = totalSold > 0 ? totalProfit / totalSold : 0;

  const chartData = useMemo(() => {
    const monthlyData: { [key: string]: { Profit: number, Listings: number } } = {};
    
    profitableListings.forEach(listing => {
        if (!listing.soldAt) return;
        const month = format(new Date(listing.soldAt), 'yyyy-MM');
        if (!monthlyData[month]) {
            monthlyData[month] = { Profit: 0, Listings: 0 };
        }
        monthlyData[month].Profit += listing.profit || 0;
        monthlyData[month].Listings += 1;
    });

    return Object.keys(monthlyData)
      .map(month => ({
        name: format(new Date(month), 'MMM yyyy', { locale: ro }),
        Profit: monthlyData[month].Profit,
        Listings: monthlyData[month].Listings,
      }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [profitableListings]);


  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
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
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map(kpi => (
            <KpiCard key={kpi.title} title={kpi.title} value={isLoading ? '...' : kpi.value} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Profit lunar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    cursor={{fill: 'hsla(var(--muted), 0.5)'}}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="Profit" fill="hsl(var(--primary))" name="Profit" />
                  <Bar dataKey="Listings" fill="hsl(var(--secondary))" name="Mașini Vândute" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-4">
                    <BarChart2 className="w-12 h-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold">Nu sunt date disponibile</h3>
                    <p className="text-sm">Nu există mașini vândute în perioada selectată.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>

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
