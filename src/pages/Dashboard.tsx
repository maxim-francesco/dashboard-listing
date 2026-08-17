import { format } from "date-fns";
import { ro } from "date-fns/locale";

import WeeklySummaryCard from "@/components/WeeklySummaryCard";
import ActionCallList from "@/components/today/ActionCallList";
import ViewedOffers from "@/components/today/ViewedOffers";
import AllClearCard from "@/components/today/AllClearCard";
import TodayAgenda from "@/components/today/TodayAgenda";
import NetworkPulse from "@/components/today/NetworkPulse";
import GettingStarted from "@/components/today/GettingStarted";
import ExpiringAlerts from "@/components/today/ExpiringAlerts";
import StockPulse from "@/components/today/StockPulse";
import StaleStock from "@/components/today/StaleStock";
import ViewsChart from "@/components/today/ViewsChart";

const Dashboard = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bună dimineața";
    if (hour < 18) return "Bună ziua";
    return "Bună seara";
  };

  return (
    <div className="space-y-6 box-border w-full pb-10">
      {/* GREETING BLOCK */}
      <div>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">
          {getGreeting()}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, d MMMM", { locale: ro }).toLowerCase()}
        </p>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="space-y-6 lg:hidden">
        <ExpiringAlerts />
        <TodayAgenda />
        <ActionCallList />
        <ViewedOffers />
        <AllClearCard />
        <NetworkPulse />
        <GettingStarted />
        <WeeklySummaryCard />
        <div className="space-y-4">
          <StockPulse />
          <StaleStock />
        </div>
        <ViewsChart />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex lg:justify-center lg:gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4 empty:hidden"><AllClearCard /><ExpiringAlerts /><TodayAgenda /><ActionCallList /><StaleStock /><ViewedOffers /><NetworkPulse /><GettingStarted /></div>
        <div className="w-[380px] shrink-0 space-y-4 empty:hidden"><StockPulse /><ViewsChart /><WeeklySummaryCard /></div>
      </div>
    </div>
  );
};

export default Dashboard;

