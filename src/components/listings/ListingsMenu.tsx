import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Car, Truck, Coins, CalendarCheck, Tag, FileText, ChevronRight, FileDown } from "lucide-react";
import { getStockCounts } from "@/services/api";
import GenerateCatalogModal from "@/components/modals/GenerateCatalogModal";

interface MenuItem {
  key: string;
  title: string;
  description: string;
  icon: any;
  borderClass: string;
  iconClass: string;
  to: string;
  total?: number;
}

function MenuRow({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={"flex items-center justify-between min-h-[64px] py-4 px-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors " + item.borderClass}
    >
      <div className="flex items-center gap-3">
        <div className={"w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 " + item.iconClass}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h3 className="text-[16px] font-semibold text-foreground leading-snug">{item.title}</h3>
          <p className="text-[13px] text-muted-foreground leading-none mt-0.5">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {item.total !== undefined ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{item.total}</span>
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
    </Link>
  );
}

function DesktopMenuCard({
  title,
  description,
  icon: Icon,
  to,
  onClick,
  total,
  isPrimaryAction = false,
}: {
  title: string;
  description: string;
  icon: any;
  to?: string;
  onClick?: () => void;
  total?: number;
  isPrimaryAction?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div
          className={
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 " +
            (isPrimaryAction
              ? "bg-primary/10 text-primary"
              : "bg-muted text-foreground")
          }
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h3 className="text-[15px] font-semibold text-foreground leading-snug">{title}</h3>
          <p className="text-[13px] text-muted-foreground leading-none mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {total !== undefined ? (
          <span className="text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
            {total}
          </span>
        ) : (
          <ChevronRight className={"w-4 h-4 " + (isPrimaryAction ? "text-primary" : "text-muted-foreground")} />
        )}
      </div>
    </>
  );

  const className =
    "flex items-center justify-between h-[64px] px-4 bg-card border rounded-xl transition-colors select-none " +
    (isPrimaryAction
      ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
      : "border-border hover:bg-accent/50");

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className + " w-full text-left cursor-pointer"}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to!} className={className}>
      {content}
    </Link>
  );
}

export default function ListingsMenu() {
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const { data: counts } = useQuery({
    queryKey: ["stock-counts"],
    queryFn: getStockCounts,
    refetchOnWindowFocus: false,
  });
  const c = counts as any;
  const inStock = (c?.available ?? 0) + (c?.reserved ?? 0);
  const incoming = c?.incoming ?? 0;
  const sold = c?.sold ?? 0;
  const reserved = c?.reserved ?? 0;

  const stockItems: MenuItem[] = [
    {
      key: "stoc",
      title: "În stoc",
      description: "Mașini de vânzare acum",
      icon: Car,
      borderClass: "border-l-4 border-l-blue-500",
      iconClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
      to: "/listings?view=stoc",
      total: inStock,
    },
    {
      key: "incoming",
      title: "Sosesc în curând",
      description: "Mașini care vin pe stoc",
      icon: Truck,
      borderClass: "border-l-4 border-l-amber-500",
      iconClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
      to: "/listings?view=incoming",
      total: incoming,
    },
    {
      key: "vandute",
      title: "Vândute",
      description: "Istoric și profit",
      icon: Coins,
      borderClass: "border-l-4 border-l-green-500",
      iconClass: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
      to: "/listings?view=vandute",
      total: sold,
    },
  ];

  const paperItems: MenuItem[] = [
    {
      key: "reservations",
      title: "Rezervări",
      description: "Mașini ținute cu avans",
      icon: CalendarCheck,
      borderClass: "border-l-4 border-l-teal-500",
      iconClass: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20",
      to: "/reservations",
      total: reserved,
    },
    {
      key: "offers",
      title: "Oferte trimise",
      description: "Prețuri trimise clienților",
      icon: Tag,
      borderClass: "border-l-4 border-l-purple-500",
      iconClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
      to: "/offers",
    },
    {
      key: "contracts",
      title: "Contracte și predări",
      description: "Acte și predare mașină",
      icon: FileText,
      borderClass: "border-l-4 border-l-indigo-500",
      iconClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
      to: "/contracts",
    },
  ];

  return (
    <>
      {/* Mobile Layout */}
      <div className="space-y-4 pb-24 lg:hidden">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">Mașini</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Ce vrei să faci?</p>
        </div>

        <Link
          to="/listings/new"
          className="flex items-center justify-between min-h-[64px] py-4 px-4 bg-primary/5 border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-primary bg-primary/10">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-[16px] font-semibold text-foreground leading-snug">Adaugă mașină</h3>
              <p className="text-[13px] text-muted-foreground leading-none mt-0.5">Anunț nou în stoc</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary" />
        </Link>

        <div>
          <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">Stocul tău</p>
          <div className="grid gap-3">
            {stockItems.map((item) => (
              <MenuRow key={item.key} item={item} />
            ))}
            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(true)}
              className="flex items-center justify-between min-h-[64px] py-4 px-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors text-left w-full cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted text-foreground">
                  <FileDown className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-[16px] font-semibold text-foreground leading-snug">Generează catalog</h3>
                  <p className="text-[13px] text-muted-foreground leading-none mt-0.5">Catalog PDF cu mașini</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">Vânzare și acte</p>
          <div className="grid gap-3">
            {paperItems.map((item) => (
              <MenuRow key={item.key} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col space-y-6 pb-24">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">Mașini</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Ce vrei să faci?</p>
        </div>

        <div>
          <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
            Acțiune
          </p>
          <div className="grid grid-cols-3 gap-4">
            <DesktopMenuCard
              title="Adaugă mașină"
              description="Anunț nou în stoc"
              icon={Plus}
              to="/listings/new"
              isPrimaryAction
            />
            <DesktopMenuCard
              title="Generează catalog"
              description="Catalog PDF cu mașini"
              icon={FileDown}
              onClick={() => setIsCatalogModalOpen(true)}
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
            Stocul tău
          </p>
          <div className="grid grid-cols-3 gap-4">
            {stockItems.map((item) => (
              <DesktopMenuCard
                key={item.key}
                title={item.title}
                description={item.description}
                icon={item.icon}
                to={item.to}
                total={item.total}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground px-1 mb-2">
            Vânzare și acte
          </p>
          <div className="grid grid-cols-3 gap-4">
            {paperItems.map((item) => (
              <DesktopMenuCard
                key={item.key}
                title={item.title}
                description={item.description}
                icon={item.icon}
                to={item.to}
                total={item.total}
              />
            ))}
          </div>
        </div>
      </div>

      <GenerateCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        stockCounts={counts}
      />
    </>
  );
}
