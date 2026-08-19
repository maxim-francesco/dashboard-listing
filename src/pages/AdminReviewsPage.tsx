import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, MessageSquare, Loader2, Star, Check, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { roCount } from "@/lib/plural";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ReviewDetailSheet from "@/components/modals/ReviewDetailSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  isApproved: boolean;
  createdAt?: string;
  businessId?: string;
}

const AdminReviewsPage = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "approved">("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Review | null>(null);

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
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/firma");
    }
  };

  const getStatusBadge = (isApproved: boolean) => {
    if (isApproved) {
      return (
        <Badge className="bg-success/15 text-success border border-success/20">
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

  const renderRating = (rating: number, size: string = "w-4 h-4") => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              size,
              star <= rating
                ? "fill-current text-warning"
                : "text-muted-foreground/40"
            )}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: ro });
    } catch {
      return "";
    }
  };

  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;

  const visible =
    tab === "all"
      ? reviews
      : tab === "pending"
      ? reviews.filter((r) => !r.isApproved)
      : reviews.filter((r) => r.isApproved);

  const openDetail = (review: Review) => {
    setSelectedReview(review);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Înapoi"
          onClick={handleBack}
          className="w-9 h-9 min-h-[44px] min-w-[44px] border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-medium text-foreground leading-tight">
            Recenzii
          </h1>
          <p className="text-[12px] text-muted-foreground leading-tight mt-0.5">
            {pendingCount > 0
              ? roCount(pendingCount, "în așteptare", "în așteptare")
              : "Ce spun clienții despre tine"}
          </p>
        </div>
      </div>

      {/* STATUS TAB FILTER */}
      <div className="bg-card border border-border rounded-lg p-0.5 flex items-center">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={cn(
            "flex-1 min-h-[44px] text-[13px] font-medium rounded-md transition-colors flex items-center justify-center gap-1",
            tab === "all"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Toate <span className="tabular-nums">{reviews.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={cn(
            "flex-1 min-h-[44px] text-[13px] font-medium rounded-md transition-colors flex items-center justify-center gap-1",
            tab === "pending"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          În Așteptare{" "}
          <span
            className={cn(
              "tabular-nums",
              pendingCount > 0 ? "text-warning font-semibold" : ""
            )}
          >
            {pendingCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("approved")}
          className={cn(
            "flex-1 min-h-[44px] text-[13px] font-medium rounded-md transition-colors flex items-center justify-center gap-1",
            tab === "approved"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Aprobate <span className="tabular-nums">{approvedCount}</span>
        </button>
      </div>

      {/* MOBILE CARD LIST (lg:hidden) */}
      <div className="lg:hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Se încarcă recenziile...</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-[15px] font-medium text-foreground">
              {tab === "all"
                ? "Nicio recenzie încă"
                : tab === "pending"
                ? "Nicio recenzie în așteptare"
                : "Nicio recenzie aprobată încă"}
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">
              {tab === "all"
                ? "Recenziile clienților vor apărea aici."
                : tab === "pending"
                ? "Toate recenziile au fost moderate."
                : "Recenziile aprobate vor apărea aici."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {visible.map((review) => (
              <div
                key={review.id}
                onClick={() => openDetail(review)}
                className="bg-card border border-border rounded-xl p-3.5 space-y-2 cursor-pointer hover:border-border/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-medium text-foreground">
                      {review.name}
                    </h3>
                    <div className="mt-0.5">{renderRating(review.rating)}</div>
                  </div>
                  <div>{getStatusBadge(review.isApproved)}</div>
                </div>

                <p className="text-[14px] text-muted-foreground line-clamp-2 break-words">
                  {review.text}
                </p>

                {review.createdAt && (
                  <div className="text-[12px] text-muted-foreground pt-1.5 border-t border-border/50">
                    {formatDate(review.createdAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP TABLE (hidden lg:block) - Desktop stays as-is */}
      <div className="hidden lg:block">
        <Card className="border-border bg-card">
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
                      <TableHead className="text-foreground font-medium">Data</TableHead>
                      <TableHead className="text-foreground font-medium">Status</TableHead>
                      <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((review) => (
                      <TableRow key={review.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {review.name}
                        </TableCell>
                        <TableCell>{renderRating(review.rating)}</TableCell>
                        <TableCell className="text-muted-foreground max-w-sm break-words">
                          {review.text}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[13px]">
                          {formatDate(review.createdAt)}
                        </TableCell>
                        <TableCell>{getStatusBadge(review.isApproved)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!review.isApproved && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-success text-success hover:bg-success-light min-h-[44px]"
                                onClick={() => handleApprove(review.id)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Aprobă
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive text-destructive hover:bg-destructive-light min-h-[44px]"
                              onClick={() => setPendingDelete(review)}
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

      {/* DETAIL SHEET */}
      <ReviewDetailSheet
        review={selectedReview}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onApprove={handleApprove}
        onDelete={(r) => setPendingDelete(r)}
      />

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi recenzia?</AlertDialogTitle>
            <AlertDialogDescription>
              Recenzia de la {pendingDelete?.name} va fi ștearsă definitiv. Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  handleDelete(pendingDelete.id);
                  setPendingDelete(null);
                }
              }}
              className={cn(buttonVariants({ variant: "destructive" }), "min-h-[44px]")}
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReviewsPage;
