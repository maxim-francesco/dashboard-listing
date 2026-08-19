import { Link } from "react-router-dom";
import {
  Clock,
  Bell,
  MessageSquare,
  Calendar,
  Mail,
  Car,
  Package,
  RefreshCw,
  Coins,
  FileText,
  Tag,
  CalendarDays,
  Users,
  ChevronRight,
} from "lucide-react";
import { CustomerListItem } from "@/services/api";
import { isInLucru } from "@/hooks/useInLucruCount";
import { LeadAgeBand, getLeadAgeBand } from "@/lib/date";

export type { LeadAgeBand };
export { getLeadAgeBand };

export function isRecentLead(c: CustomerListItem): boolean {
  if (!c.openLead) return false;
  const band = getLeadAgeBand(c.openLead.createdAt);
  return band === "noi" || band === "neatinse";
}

interface MenuItem {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  total?: number;
  isPrimaryBadge?: boolean;
  borderClass: string;
  iconClass: string;
}

function MenuRow({ item }: { item: MenuItem }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className={
        "flex items-center justify-between min-h-[64px] py-4 px-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors select-none " +
        item.borderClass
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 " +
            item.iconClass
          }
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h3 className="text-[16px] font-semibold text-foreground leading-snug">{item.title}</h3>
          <p className="text-[13px] text-muted-foreground leading-none mt-0.5">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {item.total !== undefined ? (
          <span
            className={
              "text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums " +
              (item.isPrimaryBadge
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground")
            }
          >
            {item.total}
          </span>
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
    </Link>
  );
}

function DesktopMenuCard({ item }: { item: MenuItem }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className={
        "flex items-center justify-between h-[64px] px-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors select-none " +
        item.borderClass
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 " +
            item.iconClass
          }
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h3 className="text-[15px] font-semibold text-foreground leading-snug">{item.title}</h3>
          <p className="text-[13px] text-muted-foreground leading-none mt-0.5">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {item.total !== undefined ? (
          <span
            className={
              "text-[13px] font-semibold px-2.5 py-0.5 rounded-full tabular-nums " +
              (item.isPrimaryBadge
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground")
            }
          >
            {item.total}
          </span>
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </Link>
  );
}

interface CustomersMenuProps {
  customers: CustomerListItem[];
}

export default function CustomersMenu({ customers }: CustomersMenuProps) {
  // Group "Acum" (Token: primary)
  const inLucruTotal = customers.filter(isInLucru).length;
  const activeLeadsTotal = customers.filter(isRecentLead).length;
  const appointmentsTotal = customers.filter((c) => c.nextAppointment != null).length;

  const acumBorderClass = "border-l-4 border-l-primary";
  const acumIconClass = "bg-primary/10 text-primary";

  const acumItems: MenuItem[] = [
    {
      key: "inlucru",
      title: "În lucru",
      description: "Clienți cu acțiuni sau termene active",
      icon: Clock,
      to: "/customers?filter=inlucru",
      total: inLucruTotal,
      borderClass: acumBorderClass,
      iconClass: acumIconClass,
    },
    {
      key: "active",
      title: "Cereri active",
      description: "Clienți noi și neatinși, fără vechi",
      icon: Bell,
      to: "/customers?filter=active",
      total: activeLeadsTotal,
      isPrimaryBadge: activeLeadsTotal > 0,
      borderClass: acumBorderClass,
      iconClass: acumIconClass,
    },
    {
      key: "messages",
      title: "Ultimele mesaje",
      description: "Conversații și mesaje recente",
      icon: MessageSquare,
      to: "/messages",
      borderClass: acumBorderClass,
      iconClass: acumIconClass,
    },
    {
      key: "appointments",
      title: "Programări",
      description: "Vizionări și întâlniri stabilite",
      icon: Calendar,
      to: "/customers?filter=appointments",
      total: appointmentsTotal,
      borderClass: acumBorderClass,
      iconClass: acumIconClass,
    },
  ];

  // Group "Cereri" (Token: warning)
  const contactTotal = customers.filter((c) => c.leadTypes?.includes("GENERAL")).length;
  const stockTotal = customers.filter((c) => c.leadTypes?.includes("STOCK")).length;
  const orderTotal = customers.filter((c) => c.leadTypes?.includes("ORDER")).length;
  const buybackTotal = customers.filter((c) => c.leadTypes?.includes("BUYBACK")).length;
  const financingTotal = customers.filter((c) => c.leadTypes?.includes("FINANCING")).length;

  const cereriBorderClass = "border-l-4 border-l-warning";
  const cereriIconClass = "bg-warning/10 text-warning";

  const cereriItems: MenuItem[] = [
    {
      key: "contact",
      title: "Contact",
      description: "Întrebări și mesaje generale",
      icon: Mail,
      to: "/customers?filter=contact",
      total: contactTotal,
      borderClass: cereriBorderClass,
      iconClass: cereriIconClass,
    },
    {
      key: "stock",
      title: "Interesat mașină",
      description: "Cereri pentru mașini din stoc",
      icon: Car,
      to: "/customers?filter=stock",
      total: stockTotal,
      borderClass: cereriBorderClass,
      iconClass: cereriIconClass,
    },
    {
      key: "order",
      title: "Mașini la comandă",
      description: "Cereri de căutare mașină",
      icon: Package,
      to: "/customers?filter=order",
      total: orderTotal,
      borderClass: cereriBorderClass,
      iconClass: cereriIconClass,
    },
    {
      key: "buyback",
      title: "Buy-back",
      description: "Evaluări și schimburi auto",
      icon: RefreshCw,
      to: "/customers?filter=buyback",
      total: buybackTotal,
      borderClass: cereriBorderClass,
      iconClass: cereriIconClass,
    },
    {
      key: "financing",
      title: "Finanțare",
      description: "Cereri de leasing și rate",
      icon: Coins,
      to: "/customers?filter=financing",
      total: financingTotal,
      borderClass: cereriBorderClass,
      iconClass: cereriIconClass,
    },
  ].filter((item) => (item.total ?? 0) > 0);

  // Group "Vânzare și acte" (Token: success)
  const offersTotal = customers.filter((c) => c.pendingOffer != null).length;
  const reservationsTotal = customers.filter((c) => c.activeReservation != null).length;
  const allTotal = customers.length;

  const vanzareBorderClass = "border-l-4 border-l-success";
  const vanzareIconClass = "bg-success/10 text-success";

  const vanzareItems: MenuItem[] = [
    {
      key: "offers",
      title: "Oferte trimise",
      description: "Oferte de preț în așteptare",
      icon: FileText,
      to: "/customers?filter=offers",
      total: offersTotal,
      borderClass: vanzareBorderClass,
      iconClass: vanzareIconClass,
    },
    {
      key: "reservations",
      title: "Rezervări active",
      description: "Mașini blocate cu avans",
      icon: Tag,
      to: "/customers?filter=reservations",
      total: reservationsTotal,
      borderClass: vanzareBorderClass,
      iconClass: vanzareIconClass,
    },
    {
      key: "calendar",
      title: "Calendar",
      description: "Vezi programările pe zile",
      icon: CalendarDays,
      to: "/schedule",
      borderClass: vanzareBorderClass,
      iconClass: vanzareIconClass,
    },
    {
      key: "all",
      title: "Toți clienții",
      description: "Baza completă de clienți",
      icon: Users,
      to: "/customers?filter=all",
      total: allTotal,
      borderClass: vanzareBorderClass,
      iconClass: vanzareIconClass,
    },
  ];

  return (
    <>
      {/* Mobile Layout */}
      <div className="space-y-4 pb-24 lg:hidden">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">Clienți</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Ce vrei să vezi?</p>
        </div>

        <div>
          <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
            Acum
          </p>
          <div className="grid gap-3">
            {acumItems.map((item) => (
              <MenuRow key={item.key} item={item} />
            ))}
          </div>
        </div>

        {cereriItems.length > 0 && (
          <div>
            <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
              Cereri
            </p>
            <div className="grid gap-3">
              {cereriItems.map((item) => (
                <MenuRow key={item.key} item={item} />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
            Vânzare și acte
          </p>
          <div className="grid gap-3">
            {vanzareItems.map((item) => (
              <MenuRow key={item.key} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col space-y-6 pb-24">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">Clienți</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Ce vrei să vezi?</p>
        </div>

        <div>
          <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
            Acum
          </p>
          <div className="grid grid-cols-3 gap-4">
            {acumItems.map((item) => (
              <DesktopMenuCard key={item.key} item={item} />
            ))}
          </div>
        </div>

        {cereriItems.length > 0 && (
          <div>
            <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
              Cereri
            </p>
            <div className="grid grid-cols-3 gap-4">
              {cereriItems.map((item) => (
                <DesktopMenuCard key={item.key} item={item} />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
            Vânzare și acte
          </p>
          <div className="grid grid-cols-3 gap-4">
            {vanzareItems.map((item) => (
              <DesktopMenuCard key={item.key} item={item} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
