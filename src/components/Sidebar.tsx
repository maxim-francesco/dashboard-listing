import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  List, 
  Car, 
  Building2,
  X,
  Mail,
  Star,
  ClipboardCheck,
  BarChart3,
  PenTool,
} from "lucide-react";
import { Button } from "./ui/button";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: "Panou de Bord", href: "/", icon: Home },
  { name: "Anunțuri", href: "/listings", icon: Car },
  { name: "Mașini Vândute", href: "/listings/sold", icon: ClipboardCheck },
  { name: "Mesaje", href: "/messages", icon: Mail },
  { name: "Recenzii", href: "/reviews", icon: Star },
  { name: "Blog", href: "/blog", icon: PenTool },
  { name: "Rapoarte", href: "/reports", icon: BarChart3 },
];

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  return (
    <>
      {/* Overlay for mobile view, appears when sidebar is open */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-40 lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={onToggle}
      />
      
      {/* Sidebar Panel */}
      <div className={cn(
        "fixed top-0 left-0 h-full bg-card text-foreground transition-transform duration-300 ease-in-out flex flex-col z-50 w-64 border-r border-border",
        "lg:hidden", // The sidebar is only for mobile/tablet now
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header with Logo and Close button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              <span className="font-semibold text-sm">Admin Dashboard</span>
            </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/" || item.href === "/listings"}
              onClick={onToggle} // Close sidebar on link click
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0 mr-3" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
