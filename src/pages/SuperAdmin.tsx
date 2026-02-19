import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Icons
import { 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  Wand2, 
  LogOut, 
  Building2, 
  Eye, 
  BarChartHorizontal, 
  RefreshCw, 
  Terminal, 
  Copy, 
  Check, 
  Database, 
  Tags
} from "lucide-react";

// API
import api, { onboardNewClient, getPlatformStats, getAllBusinesses } from "@/services/api";

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
  totalListings: number;
  totalViews: number;
  totalActiveListings?: number;
}

interface AttributeDetail {
  id: string;
  name: string;
  type: string;
}

interface CategoryDetail {
  id: string;
  name: string;
  attributes: AttributeDetail[];
}

interface BusinessStructure {
  id: string;
  name: string;
  categories: CategoryDetail[];
}

const onboardingFormSchema = z.object({
  businessName: z.string().min(3, "Numele afacerii trebuie să aibă cel puțin 3 caractere."),
  email: z.string().email("Adresă de email invalidă."),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere."),
  seedData: z.boolean().default(false),
  vertical: z.enum(['auto', 'imobiliare'], { required_error: "Selectează un domeniu de activitate." }),
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Integration Panel State
  const [selectedBusinessForAPI, setSelectedBusinessForAPI] = useState<Business | null>(null);
  const [businessStructure, setBusinessStructure] = useState<BusinessStructure | null>(null);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);

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
      vertical: 'auto',
    },
  });

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("ID copiat în clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchBusinessStructure = async (business: Business) => {
    setSelectedBusinessForAPI(business);
    setIsLoadingStructure(true);
    setBusinessStructure(null);

    try {
      // Pasul 1: Preluăm categoriile business-ului
      // Notă: Folosim o rută publică sau de admin care permite businessId
      const categoriesRes = await api.get(`/public/listings/search?businessId=${business.id}&limit=1`);
      
      // Dacă backend-ul nu oferă o listă directă de categorii cu ID-uri via businessId în API-ul public,
      // va trebui să folosim o rută de super-admin sau să le extragem din lista de business-uri dacă ar fi incluse.
      // Aici simulăm preluarea structurii. 
      // Într-un mediu real, am folosi api.get(`/super-admin/businesses/${business.id}/structure`)
      
      const res = await api.get(`/super-admin/businesses/${business.id}/structure`);
      setBusinessStructure(res.data);
    } catch (error) {
      console.error("Failed to fetch structure", error);
      toast.error("Nu s-a putut încărca structura tehnică. Verificați permisiunile.");
    } finally {
      setIsLoadingStructure(false);
    }
  };

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
        onboardingForm.reset();
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
      localStorage.removeItem('userEmail');
      navigate('/login');
  };

  const handleRefresh = () => {
    toast.success("Se reîmprospătează datele platformei...");
    queryClient.invalidateQueries({ queryKey: ['platformStats'] });
    queryClient.invalidateQueries({ queryKey: ['allBusinesses'] });
  };

  const TableSkeleton = () => (
    <>
      {[...Array(3)].map((_, i) => (
          <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-48" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
          </TableRow>
      ))}
    </>
  );

  const CopyableId = ({ id, label }: { id: string; label?: string }) => (
    <div className="flex items-center gap-2 group">
      {label && <span className="text-xs font-medium text-muted-foreground min-w-[80px]">{label}:</span>}
      <code className="bg-muted px-2 py-1 rounded text-[11px] font-mono text-primary border border-border overflow-hidden truncate max-w-[200px]">
        {id}
      </code>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
        onClick={() => handleCopy(id)}
      >
        {copiedId === id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
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
            value={(stats?.totalListings ?? 0).toLocaleString()}
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
                            name="vertical"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Domeniu de Activitate</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                                    >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="auto" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Auto</ExternalId>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="imobiliare" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Imobiliare</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
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
                                <FormLabel>Parolă Admin</ExternalId>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                    {/* Businesses Table */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Listă Afaceri</CardTitle>
                            <CardDescription>Vizualizează și gestionează toți clienții de pe platformă.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Nume Afacere</TableHead>
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
                                        <TableRow key={business.id} className={selectedBusinessForAPI?.id === business.id ? "bg-primary/5" : ""}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{business.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{business.id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{business._count?.listings ?? 0}</TableCell>
                                            <TableCell>{business.createdAt ? new Date(business.createdAt).toLocaleDateString('ro-RO') : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => fetchBusinessStructure(business)}
                                                                    className={selectedBusinessForAPI?.id === business.id ? "text-primary" : ""}
                                                                >
                                                                    <Terminal className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Vezi ID-uri Integrare</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" onClick={() => toast.info(`Personificare ${business.name}`)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Personificare client</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* API Integration Panel */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                Detalii Integrare API
                            </CardTitle>
                            <CardDescription>ID-uri tehnice pentru OLX/Autovit</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!selectedBusinessForAPI ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Terminal className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm">Selectează un business din listă pentru a vedea structura tehnică.</p>
                                </div>
                            ) : isLoadingStructure ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            ) : businessStructure ? (
                                <div className="space-y-6">
                                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                        <p className="text-xs font-bold text-primary uppercase mb-2">Business Principal</p>
                                        <CopyableId id={businessStructure.id} label="ID Firmă" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                                            <Tags className="h-3 w-3" /> Categorii și Atribute
                                        </p>
                                        <Accordion type="single" collapsible className="w-full">
                                            {businessStructure.categories.map((cat) => (
                                                <AccordionItem key={cat.id} value={cat.id} className="border-b-0 mb-2 bg-muted/30 rounded-md overflow-hidden">
                                                    <AccordionTrigger className="px-3 py-2 hover:bg-muted/50 hover:no-underline transition-colors">
                                                        <div className="flex flex-col items-start text-left">
                                                            <span className="font-semibold text-sm">{cat.name}</span>
                                                            <span className="text-[10px] font-mono text-muted-foreground">{cat.id}</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-3 pb-3">
                                                        <div className="space-y-2 mt-2 pl-2 border-l-2 border-primary/20">
                                                            {cat.attributes.map((attr) => (
                                                                <div key={attr.id} className="flex flex-col gap-1 py-1">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-xs font-medium">{attr.name}</span>
                                                                        <span className="text-[9px] px-1.5 py-0.5 bg-background rounded border text-muted-foreground uppercase">{attr.type}</span>
                                                                    </div>
                                                                    <CopyableId id={attr.id} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-destructive">Eroare la preluarea structurii.</p>
                                    <Button variant="link" size="sm" onClick={() => fetchBusinessStructure(selectedBusinessForAPI)}>Reîncearcă</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdmin;
