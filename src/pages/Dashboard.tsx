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

      {/* EXPIRING ALERTS */}
      <ExpiringAlerts />

      {/* TODAY AGENDA */}
      <TodayAgenda />

      {/* ACTION CALL LIST */}
      <ActionCallList />

      {/* VIEWED OFFERS */}
      <ViewedOffers />

      {/* ALL CLEAR CARD */}
      <AllClearCard />

      {/* NETWORK PULSE */}
      <NetworkPulse />

      {/* GETTING STARTED */}
      <GettingStarted />

      {/* WEEKLY SUMMARY */}
      <WeeklySummaryCard />

      {/* STOCK PULSE */}
      <StockPulse />

      {/* CHART */}
      <ViewsChart />
    </div>
  );
};

export default Dashboard;

