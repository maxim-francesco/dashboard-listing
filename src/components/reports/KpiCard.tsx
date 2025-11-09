
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardProps {
    title: string;
    value: string | number;
}

const KpiCard = ({ title, value }: KpiCardProps) => {
    const isLoading = value === '...';
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div className="text-2xl font-bold text-foreground">{value}</div>
                )}
            </CardContent>
        </Card>
    );
};

export default KpiCard;
