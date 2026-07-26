import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Settings, PenTool, Star, Network, LogOut, ChevronRight } from "lucide-react";
import api from "@/services/api";

const FirmaPage = () => {
  const navigate = useNavigate();

  const { data: business } = useQuery({
    queryKey: ['businessMe'],
    queryFn: async () => {
      const { data } = await api.get('/business/me');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const rows = [
    {
      label: "Setări firmă",
      subtitle: "Date firmă, șabloane și integrări",
      target: "/settings",
      icon: Settings,
    },
    {
      label: "Articole",
      subtitle: "Ce publici pe site",
      target: "/blog",
      icon: PenTool,
    },
    {
      label: "Recenzii",
      subtitle: "Ce spun clienții despre tine",
      target: "/reviews",
      icon: Star,
    },
    {
      label: "Setări rețea",
      subtitle: "Cum te văd ceilalți dealeri",
      target: "/network/setari",
      icon: Network,
    },
  ];

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Firma</h1>
        {business?.name && (
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {business.name}
          </p>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden select-none">
        {rows.map((row, idx) => {
          const Icon = row.icon;
          return (
            <Link
              key={row.label}
              to={row.target}
              className={`flex items-center gap-3 px-3.5 py-4 hover:bg-accent/40 transition-colors w-full cursor-pointer min-h-[52px] ${
                idx > 0 ? "border-t border-border" : ""
              }`}
            >
              <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-grow min-w-0 flex flex-col text-left">
                <span className="text-[15px] font-medium text-foreground leading-snug">
                  {row.label}
                </span>
                <span className="text-[12px] text-muted-foreground truncate leading-normal">
                  {row.subtitle}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden select-none mt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-4 hover:bg-destructive/5 transition-colors w-full cursor-pointer text-left min-h-[52px]"
        >
          <LogOut className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-grow min-w-0 flex flex-col text-left">
            <span className="text-[15px] font-medium text-destructive leading-snug">
              Delogare
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-destructive shrink-0" />
        </button>
      </div>
    </div>
  );
};

export default FirmaPage;
