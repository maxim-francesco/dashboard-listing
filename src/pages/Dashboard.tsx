import StatsStrip from "@/components/today/StatsStrip";
import TodayAgenda from "@/components/today/TodayAgenda";
import SlowListingsTable from "@/components/today/SlowListingsTable";
import ActionCallList from "@/components/today/ActionCallList";
import ExpiringAlerts from "@/components/today/ExpiringAlerts";
import ViewedOffers from "@/components/today/ViewedOffers";
import AllClearCard from "@/components/today/AllClearCard";
import NetworkPulse from "@/components/today/NetworkPulse";
import GettingStarted from "@/components/today/GettingStarted";
import WeeklySummaryCard from "@/components/WeeklySummaryCard";
import ViewsChart from "@/components/today/ViewsChart";

const Dashboard = () => {
  return (
    <div className="space-y-6 box-border w-full pb-10">
      {/* MOBILE LAYOUT */}
      <div className="space-y-6 lg:hidden">
        <StatsStrip />
        <TodayAgenda />
        <ActionCallList />
        <SlowListingsTable />
        <ExpiringAlerts />
        <ViewedOffers />
        <AllClearCard />
        <NetworkPulse />
        <GettingStarted />
        <WeeklySummaryCard />
        <ViewsChart />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex lg:justify-center lg:gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4 empty:hidden"><StatsStrip /><TodayAgenda /><ActionCallList /><SlowListingsTable /><AllClearCard /><ExpiringAlerts /><ViewedOffers /><NetworkPulse /><GettingStarted /></div>
        <div className="w-[380px] shrink-0 space-y-4 empty:hidden"><ViewsChart /><WeeklySummaryCard /></div>
      </div>
    </div>
  );
};

export default Dashboard;
