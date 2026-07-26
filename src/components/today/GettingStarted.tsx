import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Globe, ChevronRight } from "lucide-react";

interface Listing {
  id: string;
  status: string;
  autovitId?: string | null;
  autovitStatus?: string | null;
}

export default function GettingStarted() {
  const navigate = useNavigate();

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      const response = await api.get("/listings");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return null;
  }

  const items = listings || [];
  const availableCount = items.filter((l) => l.status === "AVAILABLE").length;
  const unpublishedCount = items.filter(
    (l) => l.status === "AVAILABLE" && l.autovitStatus !== "active"
  ).length;

  if (availableCount >= 3) return null;

  const showRowA = availableCount < 3;
  const showRowB = unpublishedCount > 0;

  if (!showRowA && !showRowB) {
    return null;
  }

  let subline = "";
  if (availableCount === 0) {
    subline = "Nu ai nicio mașină publicată.";
  } else if (availableCount === 1) {
    subline = "Ai o singură mașină în stoc.";
  } else {
    subline = `Ai ${availableCount} mașini în stoc.`;
  }

  return (
    <Card className="border-card-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-foreground">
          Hai să pornim
        </CardTitle>
        <p className="text-[13px] text-muted-foreground mt-1">
          {subline}
        </p>
      </CardHeader>
      <CardContent className="p-0 border-t border-border">
        <div className="divide-y divide-border">
          {showRowA && (
            <div
              onClick={() => navigate("/listings/new")}
              className="flex items-center justify-between min-h-[64px] py-3 px-6 cursor-pointer hover:bg-muted/50 transition-colors gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-primary-light flex items-center justify-center flex-shrink-0 text-primary">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[15px] font-medium text-foreground">
                    Adaugă o mașină
                  </div>
                  <div className="text-[13px] text-muted-foreground">
                    Poze, preț, detalii
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/60 flex-shrink-0" />
            </div>
          )}
          {showRowB && (
            <div
              onClick={() => navigate("/listings")}
              className="flex items-center justify-between min-h-[64px] py-3 px-6 cursor-pointer hover:bg-muted/50 transition-colors gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[15px] font-medium text-foreground">
                    Publică pe Autovit
                  </div>
                  <div className="text-[13px] text-muted-foreground">
                    {unpublishedCount === 1
                      ? "O mașină nepublicată"
                      : `${unpublishedCount} mașini nepublicate`}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/60 flex-shrink-0" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
