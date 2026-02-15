import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

// Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { ShieldCheck, Loader2, Sparkles, Wand2, LogOut, Building2, Eye, BarChartHorizontal } from "lucide-react";

// API
import { onboardNewClient, getPlatformStats, getAllBusinesses } from "@/services/api";

// Types
interface Business {
  id: string;
  name: string;
  createdAt: string;
  users: { email: string }[];
}

interface PlatformStats {
  totalBusinesses: number;
  totalActiveListings: number;
  totalViews: number;
}

const onboardingFormSchema = z.object({
  businessName: z.string().min(3, "Numele afacerii trebuie să aibă cel puțin 3 caractere."),
  email: z.string().email("Adresă de email invalidă."),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere."),
  seedData: z.boolean().default(false),
});

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string; value: string; icon: React.ElementType; isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

const SuperAdmin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  const { data: stats, isLoading: isLoadingStats } = useQuery<PlatformStats>({
    queryKey: ['platformStats'],
    queryFn: getPlatformStats,
  });

  const { data: businesses, isLoading: isLoadingBusinesses } = useQuery<Business[]>({
    queryKey: ['allBusinesses'],
    queryFn: getAllBusinesses,
  });

  const onboardingForm = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      businessName: "",
      email: "",
      password: "",
      seedData: true,
    },
  });

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onboardingForm.setValue("password", pass);
  };

  const onOnboardingSubmit = async (values: OnboardingFormValues) => {
    setIsOnboarding(true);
    setProgressMessage("Se inițializează procesul...");

    try {
      await onboardNewClient(values, setProgressMessage);
      toast.success('Clientul a fost creat și configurat cu succes!');
      onboardingForm.reset({
        businessName: "",
        email: "",
        password: "",
        seedData: true,
      });
      queryClient.invalidateQueries({ queryKey: ['platformStats'] });
      queryClient.invalidateQueries({ queryKey: ['allBusinesses'] });
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare neașteptată.");
    } finally {
      setIsOnboarding(false);
      setProgressMessage("");
    }
  };
  
  const handleLogout = () => {
      localStorage.removeItem('authToken');
      navigate('/login');
  };

  return (
    <div className="min-h-screen bg-admin-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">Managementul platformei și al clienților.</p>
                </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </Button>
        </header>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <StatCard 
            title="Total Afaceri"
            value={stats?.totalBusinesses.toLocaleString() ?? '0'}
            icon={Building2}
            isLoading={isLoadingStats}
          />
          <StatCard 
            title="Anunțuri Active"
            value={stats?.totalActiveListings.toLocaleString() ?? '0'}
            icon={BarChartHorizontal}
            isLoading={isLoadingStats}
          />
          <StatCard 
            title="Vizualizări Totale"
            value={stats?.totalViews.toLocaleString() ?? '0'}
            icon={Eye}
            isLoading={isLoadingStats}
          />
        </div>
        
        {/* Main Content with Tabs */}
        <Tabs defaultValue="onboarding" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-lg">
                <TabsTrigger value="onboarding">Onboarding Client Nou</TabsTrigger>
                <TabsTrigger value="management">Management Afaceri</TabsTrigger>
            </TabsList>
            
            {/* Onboarding Tab */}
            <TabsContent value="onboarding">
                 <Card className="w-full mt-4">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-foreground">Client Onboarding Wizard</CardTitle>
                        <CardDescription>Creează și configurează un cont nou de client.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...onboardingForm}>
                        <form onSubmit={onboardingForm.handleSubmit(onOnboardingSubmit)} className="space-y-6">
                          <FormField
                            control={onboardingForm.control}
                            name="businessName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Numele Afacerii</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: Auto Express Dealer" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={onboardingForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Admin</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="admin@autoexpress.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={onboardingForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parolă Admin</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input type="text" placeholder="Parolă sigură" {...field} />
                                    </FormControl>
                                    <Button type="button" variant="outline" onClick={generatePassword}>
                                        <Wand2 className="mr-2 h-4 w-4"/>
                                        Generează
                                    </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={onboardingForm.control}
                            name="seedData"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Date de Test</FormLabel>
                                  <FormDescription>
                                    Adaugă automat 3 anunțuri de test pentru a popula panoul de bord.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={isOnboarding} className="w-full">
                            {isOnboarding ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>{progressMessage || "Se procesează..."}</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Creează Client
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
            </TabsContent>

            {/* Management Tab */}
            <TabsContent value="management">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Listă Afaceri</CardTitle>
                        <CardDescription>Vizualizează și gestionează toți clienții de pe platformă.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingBusinesses ? (
                             <div className="flex justify-center items-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Nume Afacere</TableHead>
                                    <TableHead>Email Admin</TableHead>
                                    <TableHead>Dată Creare</TableHead>
                                    <TableHead className="text-right">Acțiuni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {businesses?.map((business) => (
                                    <TableRow key={business.id}>
                                        <TableCell className="font-medium">{business.name}</TableCell>
                                        <TableCell>{business.users[0]?.email || 'N/A'}</TableCell>
                                        <TableCell>{format(new Date(business.createdAt), "dd MMM yyyy")}</TableCell>
                                        <TableCell className="text-right">
                                            {/* Action buttons can be added here */}
                                            <Button variant="ghost" size="sm">Detalii</Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdmin;
