import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarClock, MoreHorizontal, Check, X } from "lucide-react";
import { format } from "date-fns";
import { 
  getReservations, 
  completeReservation, 
  cancelReservation, 
  ReservationItem 
} from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

const ReservationsPage = () => {
  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery<ReservationItem[]>({
    queryKey: ['reservations'],
    queryFn: getReservations,
    refetchOnWindowFocus: false,
  });

  const handleComplete = async (id: string) => {
    if (!window.confirm("Ești sigur că vrei să finalizezi această rezervare? Această acțiune va marca rezervarea ca finalizată.")) return;
    try {
      await completeReservation(id);
      toast.success("Rezervare finalizată.");
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Nu s-a putut finaliza rezervarea.");
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Ești sigur că vrei să anulezi această rezervare? Vehiculul va fi din nou disponibil.")) return;
    try {
      await cancelReservation(id);
      toast.success("Rezervare anulată. Mașina este din nou disponibilă.");
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Nu s-a putut anula rezervarea.");
    }
  };

  const isUrgentOrExpired = (row: ReservationItem) => {
    if (row.status !== 'ACTIVE') return false;
    const expiry = new Date(row.expiresAt).getTime();
    const now = Date.now();
    const diffMs = expiry - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 2;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rezervări</h1>
        <p className="text-muted-foreground mt-2">
          Mașinile rezervate cu avans.
        </p>
      </div>

      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Listă Rezervări</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă rezervările...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
              <CalendarClock className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">Nicio rezervare încă</h3>
              <p className="text-sm">Când o mașină este rezervată cu avans, detaliile vor apărea aici.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Mașină</TableHead>
                    <TableHead className="text-foreground font-medium">Client</TableHead>
                    <TableHead className="text-foreground font-medium">Avans</TableHead>
                    <TableHead className="text-foreground font-medium">Rezervat la</TableHead>
                    <TableHead className="text-foreground font-medium">Expiră la</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                    <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((row) => (
                    <TableRow key={row.id} className="border-border">
                      <TableCell className="font-semibold text-foreground">
                        {row.listing?.title || "Vehicul necunoscut"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div>{row.clientName}</div>
                        <div className="text-xs text-muted-foreground">{row.clientPhone}</div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(row.depositAmount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(row.startDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className={isUrgentOrExpired(row) ? "text-destructive font-semibold animate-pulse" : ""}>
                          {format(new Date(row.expiresAt), "dd MMM yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.status === "ACTIVE" && (
                          <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/20">
                            Activă
                          </Badge>
                        )}
                        {row.status === "COMPLETED" && (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                            Finalizată
                          </Badge>
                        )}
                        {row.status === "CANCELLED" && (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                            Anulată
                          </Badge>
                        )}
                        {row.status === "EXPIRED" && (
                          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20">
                            Expirată
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === "ACTIVE" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Deschide meniu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem
                                onClick={() => handleComplete(row.id)}
                                className="cursor-pointer text-success hover:!bg-success/10 hover:!text-success"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                <span>Finalizează</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancel(row.id)}
                                className="cursor-pointer text-destructive hover:!bg-destructive/10 hover:!text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                <span>Anulează</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
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

export default ReservationsPage;
