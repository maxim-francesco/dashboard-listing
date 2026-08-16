import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./BottomNav";
import ErrorBoundary from "./ErrorBoundary";

const DashboardLayout = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-admin-bg flex w-full">
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-4 lg:p-6 overflow-x-clip pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <div className="max-w-7xl lg:max-w-[1600px] mx-auto">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default DashboardLayout;

