import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getSlowStock } from "@/services/api";
import { Loader2 } from "lucide-react";

interface OfferFieldsProps {
  control: any;
  register: any;
  kind: "BUY" | "EXCHANGE";
  setValue: any;
}

export const OfferFields = ({ control, register, kind, setValue }: OfferFieldsProps) => {
  const { data: myCars, isLoading: isLoadingCars } = useQuery({
    queryKey: ["exposable-cars"],
    queryFn: () => getSlowStock(0),
  });

  return (
    <div className="space-y-4">
      {/* Kind selection */}
      <FormField
        control={control}
        name="kind"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-foreground">Tip ofertă</FormLabel>
            <div className="flex bg-muted rounded-md p-1 border border-border w-full">
              <button
                type="button"
                onClick={() => {
                  field.onChange("BUY");
                  setValue("kind", "BUY");
                }}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded transition-all",
                  field.value === "BUY"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Cumpăr
              </button>
              <button
                type="button"
                onClick={() => {
                  field.onChange("EXCHANGE");
                  setValue("kind", "EXCHANGE");
                }}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded transition-all",
                  field.value === "EXCHANGE"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Schimb
              </button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {kind === "BUY" ? (
        <FormField
          control={control}
          name="offeredPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Preț oferit (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="ex: 12500"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                  className="bg-background border-input text-foreground h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <>
          <FormField
            control={control}
            name="offeredListingId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Mașina oferită la schimb</FormLabel>
                {isLoadingCars ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Se încarcă mașinile din inventar...</span>
                  </div>
                ) : !myCars || myCars.length === 0 ? (
                  <div className="text-xs text-amber-500 bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
                    Nu ai nicio mașină în inventar pe care să o poți oferi la schimb. Te rugăm să adaugi o mașină în catalog mai întâi.
                  </div>
                ) : (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ""}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background border-input text-foreground h-10">
                        <SelectValue placeholder="Alege o mașină din stoc" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-border max-h-[300px]">
                      {myCars.map((car) => (
                        <SelectItem key={car.listingId} value={car.listingId}>
                          {car.title} {car.year ? `· ${car.year}` : ""} {car.mileage ? `· ${car.mileage.toLocaleString()} km` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="offeredPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Diferență cash pe care o adaug (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="ex: 2000"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="bg-background border-input text-foreground h-10"
                  />
                </FormControl>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Lasă 0 dacă este schimb pe schimb
                </span>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      <FormField
        control={control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-foreground">Mesaj (opțional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Scrie un mesaj sau detalii suplimentare despre propunere..."
                className="bg-background min-h-[80px] resize-none"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
