import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { getCustomers, CustomerListItem } from "@/services/api";
import { Badge } from "@/components/ui/badge";

const CustomersPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = useQuery<CustomerListItem[]>({
    queryKey: ['customers'],
    queryFn: getCustomers,
    refetchOnWindowFocus: false,
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const term = search.toLowerCase().trim();
      if (!term) return true;
      const cleanPhone = cust.phone.replace(/\D/g, "");
      const cleanSearch = term.replace(/\D/g, "");
      
      const nameMatch = cust.name.toLowerCase().includes(term);
      const phoneMatch = cleanPhone.includes(cleanSearch) || cust.phone.includes(term);
      
      return nameMatch || phoneMatch;
    });
  }, [customers, search]);

  const formatLastInteraction = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: ro });
    } catch (e) {
      return "N/A";
    }
  };

  const getPurchasedCarsText = (cars: string[]) => {
    if (!cars || cars.length === 0) return "Fără achiziții";
    if (cars.length === 1) return cars[0];
    return `${cars[0]} și încă ${cars.length - 1}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Clienți</h1>
        <p className="text-muted-foreground mt-2">
          Toți clienții tăi, dintr-un singur loc.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Caută după nume sau telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background border-input text-foreground h-10"
        />
      </div>

      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Listă Clienți</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă clienții...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
              <Users className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">Niciun client găsit</h3>
              <p className="text-sm max-w-xs mt-1">
                Clienții apar automat din contracte, rezervări, programări și mesaje.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Nume</TableHead>
                    <TableHead className="text-foreground font-medium">Telefon</TableHead>
                    <TableHead className="text-foreground font-medium">Activitate</TableHead>
                    <TableHead className="text-foreground font-medium">Mașini cumpărate</TableHead>
                    <TableHead className="text-foreground font-medium">Ultima interacțiune</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.phone}
                      onClick={() => navigate(`/customers/${encodeURIComponent(customer.phone)}`)}
                      className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground">
                        {customer.name || "Nume necunoscut"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        +{customer.phone}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {customer.contractsCount > 0 && (
                            <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-blue-500/20">
                              Cumpărător
                            </Badge>
                          )}
                          {customer.reservationsCount > 0 && (
                            <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-amber-500/20">
                              Rezervare
                            </Badge>
                          )}
                          {customer.appointmentsCount > 0 && (
                            <Badge className="bg-teal-500/10 text-teal-500 hover:bg-teal-500/10 border-teal-500/20">
                              Programare
                            </Badge>
                          )}
                          {customer.messagesCount > 0 && (
                            <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/10 border-purple-500/20">
                              Mesaj
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {getPurchasedCarsText(customer.purchasedCars)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatLastInteraction(customer.lastInteraction)}
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

export default CustomersPage;
