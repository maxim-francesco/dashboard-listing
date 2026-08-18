
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

type QualifiedSoldListing = SoldListing & { purchasePrice: number };

const calculateProfit = (listing: QualifiedSoldListing): number => {
  return listing.sellingPrice - listing.purchasePrice - (listing.otherCosts || 0);
};

const ProfitabilityReport = () => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { data: soldListings = [], isLoading } = useQuery<SoldListing[]>({
    queryKey: ["soldListingsForReport"],
    queryFn: getSoldListings,
  });

  const qualifiedListings = useMemo(() => {
    return soldListings.filter(
      (listing): listing is QualifiedSoldListing =>
        listing.purchasePrice !== null &&
        listing.purchasePrice !== undefined &&
        listing.purchasePrice > 0
    );
  }, [soldListings]);

  const filteredListings = useMemo(() => {
    if (!startDate && !endDate) {
      return qualifiedListings;
    }
    return qualifiedListings.filter((listing) => {
      if (!listing.soldAt) return false;
      const soldDate = new Date(listing.soldAt);
      const start = startDate ? new Date(startDate.getTime()) : null;
      if (start) start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate.getTime()) : null;
      if (end) end.setHours(23, 59, 59, 999);

      if (start && soldDate < start) return false;
      if (end && soldDate > end) return false;
      return true;
    });
  }, [qualifiedListings, startDate, endDate]);

  const listingsWithProfit = useMemo(() => filteredListings
    .map(listing => ({
      ...listing,
      profit: calculateProfit(listing),
    })), [filteredListings]);

  const totalRevenue = listingsWithProfit.reduce((acc, curr) => acc + curr.sellingPrice, 0);
  const totalProfit = listingsWithProfit.reduce((acc, curr) => acc + curr.profit, 0);
  const totalSold = listingsWithProfit.length;
  const avgProfitPerVehicle = totalSold > 0 ? totalProfit / totalSold : 0;

  const chartData = useMemo(() => {
    const monthlyData: { [key: string]: { Profit: number, Listings: number } } = {};
    
    listingsWithProfit.forEach(listing => {
        if (!listing.soldAt) return;
        const month = format(new Date(listing.soldAt), 'yyyy-MM');
        if (!monthlyData[month]) {
            monthlyData[month] = { Profit: 0, Listings: 0 };
        }
        monthlyData[month].Profit += listing.profit;
        monthlyData[month].Listings += 1;
    });

    return Object.keys(monthlyData)
      .map(month => ({
        name: format(new Date(month), 'MMM yyyy', { locale: ro }),
        Profit: monthlyData[month].Profit,
        Listings: monthlyData[month].Listings,
      }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [listingsWithProfit]);


  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProfitBadge = (profit: number) => {
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
      { title: 'Vândute cu cost cunoscut', value: totalSold.toString() },
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
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="border-card-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <BarChart2 className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">Nu sunt date disponibile</h3>
            <p className="text-sm mt-1 max-w-md">
              {!startDate && !endDate
                ? "Nu există vânzări cu preț de achiziție înregistrat."
                : "Nu există vânzări cu preț de achiziție înregistrat în perioada selectată."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map(kpi => (
                <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} />
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProfitabilityReport;
