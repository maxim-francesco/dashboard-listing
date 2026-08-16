import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { useInLucruCount } from "@/hooks/useInLucruCount";
import { useConversationsUnreadCount } from "@/hooks/useConversationsUnreadCount";
import { usePendingProposalsCount } from "@/hooks/usePendingProposalsCount";
import { useTransportInterestsCount } from "@/hooks/useTransportInterestsCount";

const navigation = [
  { name: "Azi", href: "/" },
  { name: "Lead-uri", href: "/messages" },
  { name: "Stoc", href: "/listings?view=stoc" },
  { name: "Clienți", href: "/customers?filter=all" },
  { name: "Rețea", href: "/network" },
];

const Header = () => {
  const { pathname } = useLocation();

  // Fetch business info
  const { data: business } = useQuery({
    queryKey: ['businessMe'],
    queryFn: async () => {
      const { data } = await api.get('/business/me');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Active state checking
  const isActiveItem = (href: string) => {
    const path = href.split("?")[0];
    if (path === "/") return pathname === "/";
    if (path === "/messages") return pathname.startsWith("/messages");
    if (path === "/listings") return pathname === "/listings" || pathname.startsWith("/listings/");
    if (path === "/customers") return pathname.startsWith("/customers");
    if (path === "/network") return pathname.startsWith("/network");
    return false;
  };

  // Badge counts
  const { inLucru } = useInLucruCount();
  const { count: conversationsCount } = useConversationsUnreadCount();
  const { count: pendingProposalsCount } = usePendingProposalsCount();
  const { count: transportInterestsCount } = useTransportInterestsCount();

  const reteaCount = (conversationsCount ?? 0) + (pendingProposalsCount ?? 0) + (transportInterestsCount ?? 0);

  const isFirmaActive = pathname.startsWith("/firma");

  return (
    <header className="h-16 bg-card text-foreground border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Logo */}
        {business?.name ? (
          <Link to="/" className="text-[15px] font-medium truncate max-w-[200px] sm:max-w-[220px]">
            {business.name}
          </Link>
        ) : (
          <Building2 className="w-6 h-6 text-primary" />
        )}
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-2">
        {navigation.map((item) => {
          const isActive = isActiveItem(item.href);
          let badgeValue = 0;
          if (item.href === "/messages") {
            badgeValue = inLucru;
          } else if (item.href === "/network") {
            badgeValue = reteaCount;
          }

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span>{item.name}</span>
              {badgeValue > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center transition-colors",
                    isActive
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        {/* Firma Link */}
        <Link
          to="/firma"
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 cursor-pointer min-h-[44px]",
            isFirmaActive
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>Firma</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;

