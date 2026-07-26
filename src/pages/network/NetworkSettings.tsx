import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getNetworkSettings, updateNetworkSettings, NetworkSettings as NetworkSettingsType } from "@/services/api";

const profileFormSchema = z.object({
  networkDisplayName: z.string().max(200, "Maxim 200 de caractere").optional().or(z.literal("")),
  city: z.string().max(200, "Maxim 200 de caractere").optional().or(z.literal("")),
  networkContactPhone: z.string().max(200, "Maxim 200 de caractere").optional().or(z.literal("")),
  networkContactEmail: z.string().max(200, "Maxim 200 de caractere").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function NetworkSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localEnabled, setLocalEnabled] = useState(false);

  const { data: settings, isLoading, isError } = useQuery<NetworkSettingsType>({
    queryKey: ["network-settings"],
    queryFn: getNetworkSettings,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      networkDisplayName: "",
      city: "",
      networkContactPhone: "",
      networkContactEmail: "",
    },
  });

  useEffect(() => {
    if (settings) {
      setLocalEnabled(settings.networkEnabled);
      form.reset({
        networkDisplayName: settings.networkDisplayName || "",
        city: settings.city || "",
        networkContactPhone: settings.networkContactPhone || "",
        networkContactEmail: settings.networkContactEmail || "",
      });
    }
  }, [settings, form]);

  const switchMutation = useMutation({
    mutationFn: (checked: boolean) => updateNetworkSettings({ networkEnabled: checked }),
    onSuccess: () => {
      toast.success("Setările au fost actualizate.");
      queryClient.invalidateQueries({ queryKey: ["network-settings"] });
      queryClient.invalidateQueries({ queryKey: ["network-summary"] });
      queryClient.invalidateQueries({ queryKey: ["network-dealers"] });
      queryClient.invalidateQueries({ queryKey: ["browse-trade"] });
      queryClient.invalidateQueries({ queryKey: ["transport-runs"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => {
      // Revert the switch state on failure
      setLocalEnabled((prev) => !prev);
      toast.error(err.response?.data?.message || "Nu s-au putut salva setările.");
    },
  });

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      const ok = window.confirm("Ieși din rețea? Nu vei mai vedea mașinile și mesajele altor dealeri.");
      if (!ok) {
        return;
      }
    }
    setLocalEnabled(checked);
    switchMutation.mutate(checked);
  };

  const formMutation = useMutation({
    mutationFn: (values: Partial<NetworkSettingsType>) => updateNetworkSettings(values),
    onSuccess: () => {
      toast.success("Setările au fost salvate.");
      queryClient.invalidateQueries({ queryKey: ["network-settings"] });
      queryClient.invalidateQueries({ queryKey: ["network-dealers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Eroare la salvarea setărilor.");
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    formMutation.mutate({
      networkDisplayName: values.networkDisplayName?.trim() || null,
      city: values.city?.trim() || null,
      networkContactPhone: values.networkContactPhone?.trim() || null,
      networkContactEmail: values.networkContactEmail?.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 box-border w-full pb-24">
        <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate("/network")}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 rounded-full shrink-0"
            aria-label="Înapoi"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold">Setări rețea</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <span className="text-[15px] text-muted-foreground">Se încarcă...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 box-border w-full pb-24">
        <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate("/network")}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 rounded-full shrink-0"
            aria-label="Înapoi"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold">Setări rețea</h1>
        </div>
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[15px] text-center">
          A apărut o eroare la încărcarea setărilor. Vă rugăm să încercați din nou.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 box-border w-full pb-24">
      {/* HEADER */}
      <div className="sticky top-16 z-20 bg-admin-bg -mx-4 px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => navigate("/network")}
          className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 rounded-full shrink-0"
          aria-label="Înapoi"
          type="button"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[20px] font-semibold">Setări rețea</h1>
      </div>

      {/* MEMBERSHIP PANEL */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-[15px] font-medium text-foreground">Apari în rețea</div>
          <div className="text-[13px] text-muted-foreground">
            {localEnabled
              ? "Ceilalți dealeri îți văd firma și mașinile expuse."
              : "Nu apari la ceilalți dealeri și nu vezi rețeaua."}
          </div>
        </div>
        <label className="w-11 h-11 flex items-center justify-center shrink-0 cursor-pointer">
          <Switch
            checked={localEnabled}
            onCheckedChange={handleToggle}
            disabled={switchMutation.isPending}
            aria-label="Apari în rețea"
          />
        </label>
      </div>

      {/* WHEN networkEnabled IS FALSE */}
      {!localEnabled && (
        <div className="p-4 bg-muted border border-border rounded-xl text-foreground text-[15px]">
          Ești în afara rețelei. Pornește comutatorul de mai sus ca să revii.
        </div>
      )}

      {/* PROFILE FORM */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="text-[13px] text-muted-foreground">
            Aceste date se văd de ceilalți dealeri din rețea.
          </div>

          {/* networkDisplayName */}
          <FormField
            control={form.control}
            name="networkDisplayName"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[15px]">Numele afișat</FormLabel>
                <FormControl>
                  <Input
                    placeholder={settings?.name || ""}
                    className="min-h-[44px] text-[15px] bg-card border border-border rounded-xl px-3.5"
                    {...field}
                  />
                </FormControl>
                <div className="text-[13px] text-muted-foreground mt-1">
                  Lasă gol ca să folosești numele firmei.
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* city */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[15px]">Orașul</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: Cluj-Napoca"
                    className="min-h-[44px] text-[15px] bg-card border border-border rounded-xl px-3.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* networkContactPhone */}
          <FormField
            control={form.control}
            name="networkContactPhone"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[15px]">Telefon de contact</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="tel"
                    placeholder="ex: 0740123456"
                    className="min-h-[44px] text-[15px] bg-card border border-border rounded-xl px-3.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* networkContactEmail */}
          <FormField
            control={form.control}
            name="networkContactEmail"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[15px]">Email de contact</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="email"
                    placeholder="ex: contact@dealer.ro"
                    className="min-h-[44px] text-[15px] bg-card border border-border rounded-xl px-3.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={formMutation.isPending}
            className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold flex items-center justify-center gap-2"
          >
            {formMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
            Salvează
          </Button>
        </form>
      </Form>
    </div>
  );
}
