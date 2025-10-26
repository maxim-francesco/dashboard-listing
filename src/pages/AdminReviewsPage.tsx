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
import { Loader2, Star, Check, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import { Button } from "@/components/ui/button";

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

  const handleApprove = async (reviewId: string) => {
    const promise = api.put(`/reviews/${reviewId}/approve`);

    toast.promise(promise, {
      loading: "Se aprobă recenzia...",
      success: () => {
        setReviews((prevReviews) =>
          prevReviews.map((r) =>
            r.id === reviewId ? { ...r, isApproved: true } : r
          )
        );
        return "Recenzia a fost aprobată.";
      },
      error: "Nu s-a putut aproba recenzia.",
    });
  };

  const handleDelete = async (reviewId: string) => {
    if (window.confirm("Ești sigur că vrei să ștergi această recenzie?")) {
      const promise = api.delete(`/reviews/${reviewId}`);
      
      toast.promise(promise, {
        loading: "Se șterge recenzia...",
        success: () => {
          setReviews((prevReviews) =>
            prevReviews.filter((r) => r.id !== reviewId)
          );
          return "Recenzia a fost ștearsă.";
        },
        error: "Nu s-a putut șterge recenzia.",
      });
    }
  };


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
                    <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!review.isApproved && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-success text-success hover:bg-success-light"
                              onClick={() => handleApprove(review.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Aprobă
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive text-destructive hover:bg-destructive-light"
                            onClick={() => handleDelete(review.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Șterge
                          </Button>
                        </div>
                      </TableCell>
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
