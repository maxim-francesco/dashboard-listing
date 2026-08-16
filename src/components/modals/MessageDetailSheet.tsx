import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Phone, MessageCircle, Mail, Car, Coins, Package, ShoppingCart, RotateCcw, MessageSquare } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { telLink, waLink, hasUsablePhone } from "@/utils/phone";

interface MessageDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  message: any | null;
  customerPhone?: string | null;
}

const leadCat = (m: any): string => {
  if (!m) return "CONTACT";
  if (m.type === "BUYBACK") return "BUYBACK";
  if (m.type === "ORDER") return "ORDER";
  if (m.type === "STOCK") return "STOCK";
  if (m.type === "FINANCING") return "FINANCING";
  return "CONTACT";
};

const LEAD_LABELS: Record<string, string> = {
  CONTACT: "Contact",
  FINANCING: "Finanțare",
  STOCK: "Stoc",
  ORDER: "Comandă",
  BUYBACK: "Buy-Back",
};

const LEAD_ICON: Record<string, any> = {
  CONTACT: MessageSquare,
  FINANCING: Coins,
  STOCK: Package,
  ORDER: ShoppingCart,
  BUYBACK: RotateCcw,
};

const LEAD_ICON_WRAP: Record<string, string> = {
  CONTACT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  FINANCING: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  STOCK: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  ORDER: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  BUYBACK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const LEAD_TEXT: Record<string, string> = {
  CONTACT: "text-blue-700 dark:text-blue-300",
  FINANCING: "text-green-700 dark:text-green-300",
  STOCK: "text-purple-700 dark:text-purple-300",
  ORDER: "text-indigo-700 dark:text-indigo-300",
  BUYBACK: "text-amber-700 dark:text-amber-300",
};

const MessageDetailSheet = ({ isOpen, onClose, message, customerPhone }: MessageDetailSheetProps) => {
  const cat = leadCat(message);
  const Icon = LEAD_ICON[cat] || MessageSquare;
  const phone = customerPhone || message?.phone || "";
  const email = message?.email || "";

  const when = (() => {
    if (!message?.createdAt) return "";
    try {
      return format(new Date(message.createdAt), "d MMMM yyyy, HH:mm", { locale: ro });
    } catch {
      return "";
    }
  })();

  const mailtoHref = email
    ? "mailto:" + email + "?subject=" + encodeURIComponent("Răspuns la solicitarea ta")
    : "";

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="bg-background border-border max-h-[92vh]">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="sr-only">Detalii mesaj</DrawerTitle>
          <div className="flex gap-3 items-center">
            <div className={"w-11 h-11 rounded-xl flex items-center justify-center shrink-0 " + (LEAD_ICON_WRAP[cat] || "")}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className={"text-[16px] font-semibold " + (LEAD_TEXT[cat] || "text-foreground")}>{LEAD_LABELS[cat] || "Mesaj"}</p>
              {when && <p className="text-[13px] text-muted-foreground">{when}</p>}
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1 min-h-0 pb-2">
          {message?.car && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/60 rounded-lg mb-3.5">
              <Car className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">Interesat de</span>
              <span className="text-[14px] font-medium text-foreground ml-auto truncate">{message.car}</span>
            </div>
          )}

          <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-1.5">Mesaj</p>
          <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">
            {message?.message || "Fără conținut."}
          </p>

          {message?.name && (
            <p className="text-[13px] text-muted-foreground mt-4">De la: <span className="text-foreground">{message.name}</span></p>
          )}
        </div>

        <div className="p-4 border-t border-border mt-2">
          <div className={"grid gap-2 " + (email ? "grid-cols-3" : "grid-cols-2")}>
            {hasUsablePhone(phone) ? (
              <a href={telLink(phone)} className="py-3 rounded-xl bg-primary text-primary-foreground flex flex-col items-center gap-1">
                <Phone className="w-5 h-5" /> <span className="text-[13px] font-medium">Sună</span>
              </a>
            ) : (
              <div className="py-3 rounded-xl bg-primary text-primary-foreground flex flex-col items-center gap-1 opacity-40 pointer-events-none">
                <Phone className="w-5 h-5" /> <span className="text-[13px] font-medium">Sună</span>
              </div>
            )}
            {hasUsablePhone(phone) ? (
              <a href={waLink(phone, "")} target="_blank" rel="noreferrer" className="py-3 rounded-xl border border-border bg-card flex flex-col items-center gap-1">
                <MessageCircle className="w-5 h-5 text-green-600" /> <span className="text-[13px] font-medium text-foreground">WhatsApp</span>
              </a>
            ) : (
              <div className="py-3 rounded-xl border border-border bg-card flex flex-col items-center gap-1 opacity-40 pointer-events-none">
                <MessageCircle className="w-5 h-5 text-green-600" /> <span className="text-[13px] font-medium text-foreground">WhatsApp</span>
              </div>
            )}
            {email && (
              <a href={mailtoHref} className="py-3 rounded-xl border border-border bg-card flex flex-col items-center gap-1">
                <Mail className="w-5 h-5 text-foreground" /> <span className="text-[13px] font-medium text-foreground">Email</span>
              </a>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MessageDetailSheet;
