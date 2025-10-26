import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";

interface Review {
  id: string;
  clientName: string;
  rating: number;
  text: string;
  isApproved: boolean;
}

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/reviews");
        setReviews(response.data);
      } catch (error) {
        toast.error("Nu s-au putut încărca recenziile.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const getStatusBadge = (isApproved: boolean) => {
    if (isApproved) {
      return (
        <Badge className="bg-success-light text-success border border-success/20">
          Aprobată
        </Badge>
      );
    }
    return (
      <Badge className="bg-warning-light text-warning border border-warning/20">
        În Așteptare
      </Badge>
    );
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Moderează Recenziile</h1>
        <p className="text-muted-foreground mt-2">
          Aprobă sau respinge recenziile lăsate de clienți.
        </p>
      </div>

      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Toate Recenziile</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă recenziile...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Nume Client</TableHead>
                    <TableHead className="text-foreground font-medium">Rating</TableHead>
                    <TableHead className="text-foreground font-medium">Text Recenzie</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id} className="border-border">
                      <TableCell className="font-medium text-foreground">
                        {review.clientName}
                      </TableCell>
                      <TableCell>{renderRating(review.rating)}</TableCell>
                      <TableCell className="text-muted-foreground max-w-sm break-words">
                        {review.text}
                      </TableCell>
                      <TableCell>{getStatusBadge(review.isApproved)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReviewsPage;
