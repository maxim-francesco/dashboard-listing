import { Link } from "react-router-dom";
import { Bell, Coins, Package, Calendar, FileText, Tag, Users, ChevronRight } from "lucide-react";
import { CustomerListItem, getMessageCounts } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface CustomersMenuProps {
  customers: CustomerListItem[];
}

export default function CustomersMenu({ customers }: CustomersMenuProps) {
  const { data: msgCounts } = useQuery({
    queryKey: ["message-counts"],
    queryFn: getMessageCounts,
  });

  const counts = msgCounts as any;

  // 4. Programări: nextAppointment != null
  const appointmentsTotal = customers.filter(
    (c) => c.nextAppointment != null
  ).length;

  // 5. Oferte trimise: pendingOffer != null
  const offersTotal = customers.filter(
    (c) => c.pendingOffer != null
  ).length;

  // 6. Rezervări active: activeReservation != null
  const reservationsTotal = customers.filter(
    (c) => c.activeReservation != null
  ).length;

  // 7. Toți clienții: customers.length
  const allTotal = customers.length;

  const menuItems = [
    {
      key: "noi",
      title: "Cereri noi",
      description: "Cereri de contact necitite",
      icon: Bell,
      borderClass: "border-l-4 border-l-blue-500",
      iconClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
      to: "/customers?filter=noi",
      total: counts?.unread ?? 0,
      isRedBadge: (counts?.unread ?? 0) > 0,
    },
    {
      key: "financing",
      title: "Finanțare",
      description: "Cereri de finanțare active",
      icon: Coins,
      borderClass: "border-l-4 border-l-green-500",
      iconClass: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
      to: "/customers?filter=financing",
      total: counts?.byType?.FINANCING ?? 0,
      unread: counts?.unreadByType?.FINANCING ?? 0,
    },
    {
      key: "order",
      title: "Mașini la comandă",
      description: "Clienți interesați de comenzi",
      icon: Package,
      borderClass: "border-l-4 border-l-indigo-500",
      iconClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
      to: "/customers?filter=order",
      total: counts?.byType?.ORDER ?? 0,
      unread: counts?.unreadByType?.ORDER ?? 0,
    },
    {
      key: "appointments",
      title: "Programări",
      description: "Programări în calendar",
      icon: Calendar,
      borderClass: "border-l-4 border-l-blue-500",
      iconClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
      to: "/customers?filter=appointments",
      total: appointmentsTotal,
    },
    {
      key: "offers",
      title: "Oferte trimise",
      description: "Oferte trimise în așteptare",
      icon: FileText,
      borderClass: "border-l-4 border-l-amber-500",
      iconClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
      to: "/customers?filter=offers",
      total: offersTotal,
    },
    {
      key: "reservations",
      title: "Rezervări active",
      description: "Rezervări auto active",
      icon: Tag,
      borderClass: "border-l-4 border-l-teal-500",
      iconClass: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20",
      to: "/customers?filter=reservations",
      total: reservationsTotal,
    },
    {
      key: "all",
      title: "Toți clienții",
      description: "Baza completă de clienți",
      icon: Users,
      borderClass: "",
      iconClass: "text-muted-foreground bg-muted",
      to: "/customers?filter=all",
      total: allTotal,
      showChevron: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Clienți</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Ce vrei să vezi?</p>
      </div>

      <div className="grid gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`flex items-center justify-between min-h-[64px] py-4 px-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors ${item.borderClass}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-[16px] font-semibold text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-none mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {item.unread !== undefined && item.unread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    +{item.unread}
                  </span>
                )}
                {item.showChevron ? (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                ) : item.isRedBadge ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500 text-white">
                    {item.total}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    {item.total}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
