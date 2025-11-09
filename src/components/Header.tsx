import { useNavigate, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, User, Building2, Settings, Star, ClipboardCheck, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

const navigation = [
  { name: "Panou de Bord", href: "/" },
  { name: "Categorii", href: "/categories" },
  { name: "Anunțuri", href: "/listings" },
  { name: "Mașini Vândute", href: "/listings/sold", icon: ClipboardCheck },
  { name: "Mesaje", href: "/messages" },
  { name: "Recenzii", href: "/reviews" },
  { name: "Rapoarte", href: "/reports", icon: BarChart3 },
];

const Header = ({ onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove the token from storage
    localStorage.removeItem('authToken');
    // Navigate to the login page using the router
    navigate('/login');
  };

  return (
    <header className="h-16 bg-card text-foreground border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden hover:bg-accent"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-semibold text-sm hidden sm:inline">Admin Dashboard</span>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-2">
        {navigation.map((item) => (
            <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/" || item.href === "/listings"}
                className={({ isActive }) =>
                cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
                    isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
                }
            >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.name}
            </NavLink>
        ))}
         <NavLink
            to="/settings/attribute-groups"
            className={({ isActive }) =>
                cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
                    isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
            }
            >
                Grupuri Atribute
                <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                    Nou
                </span>
        </NavLink>
      </nav>

      <div className="flex items-center gap-4">
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56 bg-popover border-border" 
            align="end" 
            forceMount
          >
            <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Setări Șablon</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
