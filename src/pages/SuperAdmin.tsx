import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Loader2, Sparkles, Wand2 } from "lucide-react";
import { onboardNewClient } from "@/services/api";

const formSchema = z.object({
  businessName: z.string().min(3, "Numele afacerii trebuie să aibă cel puțin 3 caractere."),
  email: z.string().email("Adresă de email invalidă."),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere."),
  seedData: z.boolean().default(false),
});

type OnboardingFormValues = z.infer<typeof formSchema>;

const SuperAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
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
    form.setValue("password", pass);
  };

  const onSubmit = async (values: OnboardingFormValues) => {
    setIsLoading(true);
    setProgressMessage("Se inițializează procesul...");

    try {
      await onboardNewClient(values, setProgressMessage);
      toast.success('Clientul a fost creat și configurat cu succes!');
      form.reset({
        businessName: "",
        email: "",
        password: "",
        seedData: true,
      });
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare neașteptată.");
    } finally {
      setIsLoading(false);
      setProgressMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-card-border shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground">Super Admin Onboarding</CardTitle>
              <CardDescription className="mt-1">Creează și configurează un cont nou de client.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
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
    </div>
  );
};

export default SuperAdmin;
