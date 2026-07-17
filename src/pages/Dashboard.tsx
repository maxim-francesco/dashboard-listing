import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, MessageSquare, Eye, TrendingUp, Loader2, CalendarClock } from "lucide-react";
import api from "@/services/api";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import ListingAnalyticsWidget from "@/components/ListingAnalyticsWidget";
import { Skeleton } from "@/components/ui/skeleton";
import WeeklySummaryCard from "@/components/WeeklySummaryCard";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface StatsData {
  totalListings: number;
  totalCategories: number;
  totalMessages: number;
  totalViews: number;
  viewsLast30Days: number;
}

interface Listing {
  id: string;
  title: string;
  images?: { url: string }[];
  _count: {
    views: number;
  };
}

interface ChartDataPoint {
    date: string;
    views: number;
}


const Dashboard = () => {
  const [stats, setStats] = useState<StatsData>({
    totalListings: 0,
    totalCategories: 0,
    totalMessages: 0,
    totalViews: 0,
    viewsLast30Days: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);


  const { data: listingsData, isLoading: isListingsLoading } = useQuery({
    queryKey: ['listingsForDashboard'],
    queryFn: async () => {
        const response = await api.get('/listings');
        return response.data as Listing[];
    },
     refetchOnWindowFocus: false,
  });

  const analyticsData = {
    mostViewed: [...(listingsData || [])].sort((a, b) => (b._count?.views ?? 0) - (a._count?.views ?? 0)).slice(0, 5),
    leastViewed: [...(listingsData || [])].sort((a, b) => (a._count?.views ?? 0) - (b._count?.views ?? 0)).slice(0, 5),
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [statsResponse, chartResponse] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/chart"),
        ]);
        setStats(statsResponse.data);
        setChartData(chartResponse.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const statCards = [
    {
      title: "Total Anunțuri",
      value: stats.totalListings.toLocaleString(),
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary-light",
    },
    {
      title: "Mărci în stoc",
      value: stats.totalCategories.toLocaleString(),
      icon: Users,
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      title: "Total Vizualizări",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-indigo-500",
      bgColor: "bg-indigo-100 dark:bg-indigo-500/20",
    },
    {
      title: "Vizualizări (30 zile)",
      value: stats.viewsLast30Days.toLocaleString(),
      icon: CalendarClock,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-500/20",
    },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
            color: 'hsl(var(--muted-foreground))'
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border))'
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))'
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))'
        }
      }
    }
  };

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00'); // Ensure date is parsed as local
    const dayName = date.toLocaleDateString('ro-RO', { weekday: 'long' });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  };
  
  const finalChartData = {
    labels: chartData.map(d => formatXAxis(d.date)),
    datasets: [
      {
        label: 'Vizualizări',
        data: chartData.map(d => d.views),
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsla(var(--primary), 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const AnalyticsSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 box-border w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Panou de Bord</h1>
        <p className="text-muted-foreground mt-2">
          Bun venit pe panoul de administrare. Iată ce se întâmplă cu platforma ta.
        </p>
      </div>

      <WeeklySummaryCard />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-card-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-7 w-20 rounded-md bg-muted animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isListingsLoading ? (
          <>
            <AnalyticsSkeleton />
            <AnalyticsSkeleton />
          </>
        ) : (
          <>
            <ListingAnalyticsWidget
              title="Top 5 Cele Mai Vizualizate"
              listings={analyticsData.mostViewed}
            />
            <ListingAnalyticsWidget
              title="Top 5 Cele Mai Puțin Vizualizate"
              listings={analyticsData.leastViewed}
            />
          </>
        )}
      </div>

      {/* Chart Section */}
      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Vizualizări Anunțuri în Ultimele 7 Zile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-[400px]">
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <Line options={chartOptions} data={finalChartData} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
