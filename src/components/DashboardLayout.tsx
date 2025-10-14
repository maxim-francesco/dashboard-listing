import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-admin-bg flex w-full">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <footer className="p-4 border-t border-border mt-auto">
            <div className="max-w-7xl mx-auto text-center text-xs text-muted-foreground">
                <p>MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ | CUI: 52564061 | Nr. Reg. Com.: F2025036030001</p>
                <div className="mt-2">
                    <Link to="/termeni-admin" target="_blank" className="underline hover:text-primary">Termeni și Condiții</Link>
                    <span className="mx-2">|</span>
                    <Link to="/politica-de-confidentialitate-admin" target="_blank" className="underline hover:text-primary">Politică de Confidențialitate</Link>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
