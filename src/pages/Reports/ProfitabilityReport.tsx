
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, BarChart2, AlertTriangle, ArrowLeft, Filter, X } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getSoldListings } from "@/services/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import KpiCard from "@/components/reports/KpiCard";
import { CARD, CARD_HEADER, CARD_LABEL, CARD_LABEL_M, CARD_COUNT } from "@/components/today/cardRecipe";

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
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/listings?view=vandute");
    }
  };

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

  const soldInRange = useMemo(() => {
    if (!startDate && !endDate) {
      return soldListings;
    }
    return soldListings.filter((listing) => {
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
  }, [soldListings, startDate, endDate]);

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

  const listingsWithProfit = useMemo(
    () =>
      filteredListings.map((listing) => ({
        ...listing,
        profit: calculateProfit(listing),
      })),
    [filteredListings]
  );

  const sortedListingsForMobile = useMemo(
    () => [...listingsWithProfit].sort((a, b) => b.profit - a.profit),
    [listingsWithProfit]
  );

  const numQualifiedSales = filteredListings.length;
  const denTotalSales = soldInRange.length;
  const missingPurchasePriceCount = denTotalSales - numQualifiedSales;

  const totalRevenue = listingsWithProfit.reduce((acc, curr) => acc + curr.sellingPrice, 0);
  const totalProfit = listingsWithProfit.reduce((acc, curr) => acc + curr.profit, 0);
  const totalSold = listingsWithProfit.length;
  const avgProfitPerVehicle = totalSold > 0 ? totalProfit / totalSold : 0;

  const chartData = useMemo(() => {
    const monthlyData: { [key: string]: { Profit: number; Listings: number } } = {};

    listingsWithProfit.forEach((listing) => {
      if (!listing.soldAt) return;
      const monthKey = format(new Date(listing.soldAt), "yyyy-MM");
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { Profit: 0, Listings: 0 };
      }
      monthlyData[monthKey].Profit += listing.profit;
      monthlyData[monthKey].Listings += 1;
    });

    return Object.keys(monthlyData)
      .sort()
      .map((monthKey) => {
        const [year, month] = monthKey.split("-").map(Number);
        const date = new Date(year, month - 1, 1);
        return {
          monthKey,
          name: format(date, "MMM yyyy", { locale: ro }),
          Profit: monthlyData[monthKey].Profit,
          Listings: monthlyData[monthKey].Listings,
        };
      });
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
      return (
        <Badge className="bg-success-light text-success border border-success/20">
          {formatCurrency(profit)}
        </Badge>
      );
    }
    if (profit < 0) {
      return <Badge variant="destructive">{formatCurrency(profit)}</Badge>;
    }
    return <Badge variant="secondary">{formatCurrency(profit)}</Badge>;
  };

  const getFormattedDatePillText = () => {
    if (startDate && endDate) {
      return `${format(startDate, "dd MMM yyyy", { locale: ro })} – ${format(endDate, "dd MMM yyyy", { locale: ro })}`;
    }
    if (startDate) {
      return `din ${format(startDate, "dd MMM yyyy", { locale: ro })}`;
    }
    if (endDate) {
      return `până la ${format(endDate, "dd MMM yyyy", { locale: ro })}`;
    }
    return null;
  };

  const kpiData = [
    { title: "Profit Total", value: formatCurrency(totalProfit) },
    { title: "Venituri Totale", value: formatCurrency(totalRevenue) },
    { title: "Vândute cu cost cunoscut", value: totalSold.toString() },
    { title: "Profit Mediu / Mașină", value: formatCurrency(avgProfitPerVehicle) },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        {/* Mobile Title Row (lg:hidden): Back button + Title + Filter button */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            aria-label="Înapoi"
            data-action="back"
            onClick={handleBack}
            className="w-9 h-9 min-h-[44px] min-w-[44px] border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[17px] font-semibold text-foreground flex-1 min-w-0 truncate">
            Raport de Profitabilitate
          </h1>
          <button
            type="button"
            aria-label="Filtrează"
            data-action="filter"
            onClick={() => setFilterOpen(true)}
            className={cn(
              "w-9 h-9 min-h-[44px] min-w-[44px] border rounded-lg flex items-center justify-center shrink-0 transition-colors",
              startDate || endDate
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-foreground hover:bg-muted"
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Active-Range Pill */}
        {(startDate || endDate) && (
          <div className="lg:hidden flex items-center gap-1.5 self-start text-[12px] text-muted-foreground bg-card border border-border rounded-full px-3 py-1 mt-2">
            <span className="tabular-nums">{getFormattedDatePillText()}</span>
            <button
              type="button"
              aria-label="Șterge filtrul"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
              className="hover:text-foreground shrink-0 ml-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Desktop Title & Subtitle (hidden lg:block) */}
        <div className="hidden lg:block space-y-1">
          <h1 className="text-[20px] font-semibold text-foreground">
            Raport de Profitabilitate
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Analizează profitul generat de fiecare mașină vândută.
          </p>
        </div>
      </div>

      {/* Desktop Filter Card (hidden lg:block) */}
      <Card className="hidden lg:block border-card-border bg-card">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-[17px] font-semibold text-foreground">Filtrează Raportul</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center pt-0 px-4 pb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal h-9 text-[13px]",
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
                  "w-full sm:w-[280px] justify-start text-left font-normal h-9 text-[13px]",
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

      {/* Mobile Bottom Sheet Filter */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-xl p-4 space-y-4">
          <SheetHeader className="text-left pb-2 border-b border-border">
            <SheetTitle className="text-[17px] font-semibold text-foreground">
              Filtrează după dată
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 py-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 min-h-[44px] text-[13px]",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: ro }) : <span>Dată de început</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="center">
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
                    "w-full justify-start text-left font-normal h-11 min-h-[44px] text-[13px]",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: ro }) : <span>Dată de sfârșit</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="center">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
              className="flex-1 h-11 min-h-[44px] text-[13px]"
            >
              Resetează
            </Button>
            <Button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="flex-1 h-11 min-h-[44px] text-[13px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Aplică
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Shared Loading / Empty State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="border-card-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <BarChart2 className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-[17px] font-semibold text-foreground">Nu sunt date disponibile</h3>
            <p className="text-[13px] mt-1 max-w-md text-muted-foreground">
              {!startDate && !endDate
                ? "Nu există vânzări cu preț de achiziție înregistrat."
                : "Nu există vânzări cu preț de achiziție înregistrat în perioada selectată."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* MOBILE VIEW BLOCK (lg:hidden) */}
          <div className="space-y-4 lg:hidden">
            {/* 1. Coverage Banner (rendered only if num < den) */}
            {numQualifiedSales < denTotalSales && (
              <div className="p-3 rounded-lg bg-warning-light border border-warning/20 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="text-[13px] leading-tight space-y-0.5">
                  <div className="font-semibold text-warning">
                    Profit calculabil pe {numQualifiedSales} din {denTotalSales} vânzări
                  </div>
                  <div className="text-muted-foreground text-[12px]">
                    {missingPurchasePriceCount} {missingPurchasePriceCount === 1 ? "mașină nu are" : "mașini nu au"} preț de achiziție înregistrat și nu intră în calcul.
                  </div>
                </div>
              </div>
            )}

            {/* 2. Primary Figure Card */}
            <div className={`${CARD} p-4 flex flex-col gap-1`}>
              <span className={CARD_LABEL}>
                PROFIT TOTAL · {numQualifiedSales} {numQualifiedSales === 1 ? "MAȘINĂ" : "MAȘINI"}
              </span>
              <div
                className={cn(
                  "text-[19px] font-medium tabular-nums",
                  totalProfit > 0
                    ? "text-success"
                    : totalProfit < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {formatCurrency(totalProfit)}
              </div>
            </div>

            {/* 3. Secondary Stats — Two Cells */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`${CARD} p-3.5 flex flex-col gap-1`}>
                <span className={CARD_LABEL}>VENITURI</span>
                <div className="text-[19px] font-medium text-foreground tabular-nums">
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
              <div className={`${CARD} p-3.5 flex flex-col gap-1`}>
                <span className={CARD_LABEL}>MEDIU / MAȘINĂ</span>
                <div
                  className={cn(
                    "text-[19px] font-medium tabular-nums",
                    avgProfitPerVehicle > 0
                      ? "text-success"
                      : avgProfitPerVehicle < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {formatCurrency(avgProfitPerVehicle)}
                </div>
              </div>
            </div>

            {/* 4. Per-car Rows (Sorted by Profit Descending) */}
            <div className={CARD}>
              <div className={CARD_HEADER}>
                <span className={CARD_LABEL_M}>Pe mașină</span>
                <span className={CARD_COUNT}>{sortedListingsForMobile.length} anunțuri</span>
              </div>
              <div className="divide-y divide-border">
                {sortedListingsForMobile.map((listing) => (
                  <div
                    key={listing.id}
                    data-row="listing-mobile"
                    className="min-h-[48px] px-3.5 py-2.5 flex flex-col justify-center gap-1"
                  >
                    {/* Line 1: Title + Profit */}
                    <div className="flex items-center justify-between gap-2">
                      <span data-col="title" className="flex-1 min-w-0 truncate text-[14px] font-medium text-foreground">
                        {listing.title}
                      </span>
                      <span
                        data-col="profit"
                        className={cn(
                          "text-[14px] font-semibold tabular-nums shrink-0",
                          listing.profit > 0
                            ? "text-success"
                            : listing.profit < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatCurrency(listing.profit)}
                      </span>
                    </div>
                    {/* Line 2: Supporting figures */}
                    <div data-col="details" className="text-[12px] text-muted-foreground tabular-nums flex items-center gap-1.5 flex-wrap">
                      <span data-col="sellingPrice">vânzare {formatCurrency(listing.sellingPrice)}</span>
                      <span>·</span>
                      <span data-col="purchasePrice">achiziție {formatCurrency(listing.purchasePrice)}</span>
                      <span>·</span>
                      <span data-col="otherCosts">
                        costuri {listing.otherCosts !== null && listing.otherCosts !== undefined ? formatCurrency(listing.otherCosts) : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Chart Card — Demoted to Last */}
            <Card className="border-card-border bg-card">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-[17px] font-semibold text-foreground flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Profit lunar
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis width={85} tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: "hsla(var(--muted), 0.5)" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend />
                      <Bar dataKey="Profit" fill="hsl(var(--primary))" name="Profit" />
                      <Bar dataKey="Listings" fill="hsl(var(--muted-foreground))" name="Mașini Vândute" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DESKTOP VIEW BLOCK (hidden lg:block) */}
          <div className="hidden lg:block space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpiData.map((kpi) => (
                <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} />
              ))}
            </div>

            <Card className="border-card-border bg-card">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-[17px] font-semibold text-foreground flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Profit lunar
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis width={85} tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip
                        cursor={{ fill: "hsla(var(--muted), 0.5)" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend />
                      <Bar dataKey="Profit" fill="hsl(var(--primary))" name="Profit" />
                      <Bar dataKey="Listings" fill="hsl(var(--muted-foreground))" name="Mașini Vândute" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border bg-card">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-[17px] font-semibold text-foreground">Detalii pe Anunț</CardTitle>
                <CardDescription className="text-[13px] text-muted-foreground">
                  Doar anunțurile cu preț de achiziție sunt incluse în calculul profitului.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Anunț</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Preț Vânzare</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Preț Achiziție</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Alte Costuri</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listingsWithProfit.map((listing) => (
                        <TableRow key={listing.id} data-row="listing" className="h-[54px]">
                          <TableCell data-col="title" className="text-[15px] font-medium text-foreground">{listing.title}</TableCell>
                          <TableCell data-col="sellingPrice" className="text-right text-[13px] font-semibold tabular-nums">{formatCurrency(listing.sellingPrice)}</TableCell>
                          <TableCell data-col="purchasePrice" className="text-right text-[13px] tabular-nums">{formatCurrency(listing.purchasePrice)}</TableCell>
                          <TableCell data-col="otherCosts" className="text-right text-[13px] tabular-nums">{formatCurrency(listing.otherCosts)}</TableCell>
                          <TableCell data-col="profit" className="text-right text-[13px]">{getProfitBadge(listing.profit)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfitabilityReport;


