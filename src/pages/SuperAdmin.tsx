
import { useState, useEffect } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Icons
import { ShieldCheck, Loader2, Sparkles, Wand2, LogOut, Building2, Eye, BarChartHorizontal, RefreshCw } from "lucide-react";

// API
import { onboardNewClient, getPlatformStats, getAllBusinesses } from "@/services/api";

// Types
interface Business {
  id: string;
  name: string;
  createdAt: string;
  users: { email: string }[];
  _count?: {
    listings: number;
  };
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
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  const { data: stats, isLoading: isLoadingStats } = useQuery<PlatformStats>({
    queryKey: ['platformStats'],
    queryFn: getPlatformStats,
  });

  const { data: businesses, isLoading: isLoadingBusinesses } = useQuery<Business[]>({
    queryKey: ['allBusinesses'],
    queryFn: getAllBusinesses,
  });
  
  useEffect(() => {
    if (businesses) {
      console.log('Businesses Data:', businesses);
    }
  }, [businesses]);


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
    setIsLoadingOnboarding(true);
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
        setIsLoadingOnboarding(false);
        setProgressMessage("");
    }
  };
  
  const handleLogout = () => {
      localStorage.removeItem('authToken');
      navigate('/login');
  };

  const handleRefresh = () => {
    toast.success("Se reîmprospătează datele platformei...");
    queryClient.invalidateQueries({ queryKey: ['platformStats'] });
    queryClient.invalidateQueries({ queryKey: ['allBusinesses'] });
  };

  const handleImpersonate = (business: Business) => {
    console.log(`Attempting to impersonate business: ${business.id} (${business.name})`);
    toast.info(`Funcționalitate în dezvoltare: Personificare ${business.name}`);
  };

  const TableSkeleton = () => (
    [...Array(3)].map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
        </TableRow>
    ))
  );

  return (
    <div className="min-h-screen bg-admin-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">Managementul platformei și al clienților.</p>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleRefresh} className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4"/>
                  Reîmprospătează
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-full sm:w-auto">
                  <LogOut className="mr-2 h-4 w-4"/>
                  Logout
              </Button>
            </div>
        </header>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <StatCard 
            title="Total Afaceri"
            value={(stats?.totalBusinesses ?? 0).toLocaleString()}
            icon={Building2}
            isLoading={isLoadingStats}
          />
          <StatCard 
            title="Anunțuri Active"
            value={(stats?.totalActiveListings ?? 0).toLocaleString()}
            icon={BarChartHorizontal}
            isLoading={isLoadingStats}
          />
          <StatCard 
            title="Vizualizări Totale"
            value={(stats?.totalViews ?? 0).toLocaleString()}
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
                          <Button type="submit" disabled={isLoadingOnboarding} className="w-full">
                            {isLoadingOnboarding ? (
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Nume Afacere</TableHead>
                                <TableHead>Email Admin</TableHead>
                                <TableHead>Anunțuri</TableHead>
                                <TableHead>Dată Creare</TableHead>
                                <TableHead className="text-right">Acțiuni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingBusinesses ? (
                                    <TableSkeleton />
                                ) : (
                                    businesses?.map((business) => (
                                    <TableRow key={business.id}>
                                        <TableCell className="font-medium">{business.name ?? 'N/A'}</TableCell>
                                        <TableCell>{business.users?.[0]?.email ?? 'N/A'}</TableCell>
                                        <TableCell>{business._count?.listings ?? 0}</TableCell>
                                        <TableCell>{business.createdAt ? new Date(business.createdAt).toLocaleDateString('ro-RO') : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => handleImpersonate(business)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Personificare client</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdmin;

    