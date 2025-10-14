import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, MessageSquare, Eye, TrendingUp, Loader2 } from "lucide-react";
import api from "@/services/api";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface StatsData {
  totalListings: number;
  totalCategories: number;
  totalMessages: number;
  listingViews: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<StatsData>({
    totalListings: 0,
    totalCategories: 0,
    totalMessages: 0,
    listingViews: 8910,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
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
      title: "Total Categorii",
      value: stats.totalCategories.toLocaleString(),
      icon: Users,
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      title: "Mesaje Primite",
      value: stats.totalMessages.toLocaleString(),
      icon: MessageSquare,
      color: "text-warning",
      bgColor: "bg-warning-light",
    },
    {
      title: "Vizualizări Profil",
      value: stats.listingViews.toLocaleString(),
      icon: Eye,
      color: "text-destructive",
      bgColor: "bg-destructive-light",
    },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(200, 200, 200, 0.2)'
        },
        ticks: {
          color: '#888'
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#888'
        }
      }
    }
  };

  const chartData = {
    labels: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'],
    datasets: [
      {
        label: 'Vizualizări',
        data: [120, 190, 150, 250, 220, 300, 280],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsla(var(--primary), 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-6 box-border w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Panou de Bord</h1>
        <p className="text-muted-foreground mt-2">
          Bun venit pe panoul de administrare. Iată ce se întâmplă cu platforma ta.
        </p>
      </div>

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

      {/* Chart Section */}
      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Vizualizări Anunțuri în Timp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-[400px]">
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <Line options={chartOptions} data={chartData} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
