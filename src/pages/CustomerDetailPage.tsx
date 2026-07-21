import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ArrowLeft, 
  FileText, 
  CalendarClock, 
  MessageSquare, 
  BookmarkCheck,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { getCustomer } from "@/services/api";

const TYPE_LABELS: Record<string, string> = {
  TEST_DRIVE: 'Test-drive',
  VIEWING: 'Vizionare',
  HANDOVER: 'Predare',
  MEETING: 'Întâlnire',
  OTHER: 'Altele',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programată',
  COMPLETED: 'Finalizată',
  CANCELLED: 'Anulată',
};

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activă',
  COMPLETED: 'Finalizată',
  CANCELLED: 'Anulată',
  EXPIRED: 'Expirată',
};

const CustomerDetailPage = () => {
  const { phone } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ['customer', phone],
    queryFn: () => getCustomer(phone!),
    enabled: !!phone,
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateStr?: string, pattern: string = "dd MMM yyyy") => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), pattern, { locale: ro });
    } catch (e) {
      return "N/A";
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "N/A";
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Se încarcă istoricul clientului...</p>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/customers')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Înapoi la clienți
        </Button>
        <Card className="border-card-border bg-card max-w-md mx-auto text-center py-10">
          <CardContent className="space-y-4">
            <User className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">Clientul nu a fost găsit</h3>
            <p className="text-sm text-muted-foreground">
              Nu s-au putut prelua detaliile pentru acest număr de telefon sau clientul nu mai există.
            </p>
            <Button onClick={() => navigate('/customers')}>Înapoi la listă</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contracts = customer.contracts ?? [];
  const reservations = customer.reservations ?? [];
  const appointments = customer.appointments ?? [];
  const messages = customer.messages ?? [];

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button variant="ghost" onClick={() => navigate('/customers')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Înapoi la clienți
      </Button>

      {/* Header Profile Card */}
      <Card className="border-card-border bg-card">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">{customer.name || "Nume necunoscut"}</h1>
            <p className="text-lg text-muted-foreground font-medium">+{customer.phone}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:self-center">
            {contracts.length > 0 && (
              <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-blue-500/20">
                Cumpărător
              </Badge>
            )}
            {reservations.length > 0 && (
              <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-amber-500/20">
                Rezervare
              </Badge>
            )}
            {appointments.length > 0 && (
              <Badge className="bg-teal-500/10 text-teal-500 hover:bg-teal-500/10 border-teal-500/20">
                Programare
              </Badge>
            )}
            {messages.length > 0 && (
              <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/10 border-purple-500/20">
                Mesaj
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 1. CONTRACTS SECTION */}
      {contracts.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-foreground">Contracte de Vânzare ({contracts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Nr. Contract</TableHead>
                    <TableHead className="text-foreground font-medium">Mașină</TableHead>
                    <TableHead className="text-foreground font-medium">Preț Vânzare</TableHead>
                    <TableHead className="text-foreground font-medium">Dată Vânzare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c: any) => (
                    <TableRow key={c.id || c.contractNumber} className="border-border">
                      <TableCell className="font-semibold text-foreground">
                        #{c.contractNumber}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {c.car || "Vehicul fără titlu"}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatPrice(c.salePrice)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(c.saleDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. RESERVATIONS SECTION */}
      {reservations.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <BookmarkCheck className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-foreground">Rezervări înregistrate ({reservations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Mașină</TableHead>
                    <TableHead className="text-foreground font-medium">Avans Plătit</TableHead>
                    <TableHead className="text-foreground font-medium">Dată Rezervare</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((r: any) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="text-foreground">
                        {r.car || "Vehicul fără titlu"}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatPrice(r.depositAmount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {RESERVATION_STATUS_LABELS[r.status] || r.status || "N/A"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. APPOINTMENTS SECTION */}
      {appointments.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <CalendarClock className="w-5 h-5 text-teal-500" />
            <CardTitle className="text-foreground">Programări în Calendar ({appointments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Titlu / Tip</TableHead>
                    <TableHead className="text-foreground font-medium">Dată și Oră</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                    <TableHead className="text-foreground font-medium">Observații</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((a: any) => (
                    <TableRow key={a.id} className="border-border">
                      <TableCell className="text-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold">{a.title || "Programare"}</span>
                          <span className="text-xs text-muted-foreground">
                            {TYPE_LABELS[a.type] || a.type || "Altele"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        {formatDate(a.startAt, "dd MMM yyyy, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {STATUS_LABELS[a.status] || a.status || "Programată"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {a.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. MESSAGES SECTION */}
      {messages.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-foreground">Mesaje și Lead-uri ({messages.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.map((m: any) => (
              <div key={m.id} className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDate(m.createdAt, "dd MMM yyyy, HH:mm")}</span>
                    {m.type && (
                      <Badge variant="outline" className="text-[10px] py-0 font-normal">
                        {m.type}
                      </Badge>
                    )}
                  </div>
                  {m.car && (
                    <span className="text-xs font-semibold text-muted-foreground truncate max-w-xs">
                      Vehicul de interes: {m.car}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground italic">
                  "{m.message || m.content || m.text || "Fără conținut textual."}"
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerDetailPage;
