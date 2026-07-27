import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { normalizePhone } from "@/lib/phone";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createManualLead } from "@/services/api";

const formSchema = z.object({
  phone: z.string().trim().min(1, "Numărul de telefon este obligatoriu."),
  name: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().optional().or(z.literal("")),
});

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddLeadModal = ({ isOpen, onClose }: AddLeadModalProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSavingRef = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      name: "",
      message: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createManualLead,
    onSuccess: (data) => {
      toast.success("Client adăugat cu succes.");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      onClose();
      form.reset();
      isSavingRef.current = false;
      
      const rawPhone = data?.phone;
      const normalized = rawPhone ? normalizePhone(rawPhone) : "";
      if (normalized) {
        navigate(`/customers/${encodeURIComponent(normalized)}`);
      } else {
        toast.error("Răspunsul serverului nu conține un număr de telefon valid.");
        navigate("/customers");
      }
    },
    onError: (error: any) => {
      isSavingRef.current = false;
      const errMsg = error.response?.data?.message || "Eroare la crearea clientului.";
      toast.error(errMsg);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    const payload: any = {
      phone: values.phone.trim(),
    };
    
    const trimmedName = values.name?.trim();
    if (trimmedName) {
      payload.name = trimmedName;
    }
    
    const trimmedMessage = values.message?.trim();
    if (trimmedMessage) {
      payload.message = trimmedMessage;
    }

    mutate(payload);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        isSavingRef.current = false;
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="bg-popover border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">A sunat cineva</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            Notează cine a sunat, ca să-l poți suna înapoi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="07..."
                      {...field}
                      className="bg-background"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nume (opțional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Cum se numește"
                      {...field}
                      className="bg-background"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ce a întrebat</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="ex: întreabă de Golful alb, vrea să vină sâmbătă"
                      {...field}
                      className="bg-background"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="min-h-[52px]"
                disabled={isPending}
              >
                Anulează
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="min-h-[52px]"
              >
                Salvează
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadModal;
