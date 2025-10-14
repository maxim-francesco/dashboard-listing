
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Edit, Trash2, Search, Loader2, ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from 'date-fns';
import api from "@/services/api";

interface Listing {
  id: string;
  title: string;
  category: {
    name: string;
  };
  createdAt: string;
  // This is a placeholder as the backend doesn't seem to provide a status field yet.
  // We'll give it a default value for now.
  status: 'Activ' | 'Inactiv';
  images?: { url: string }[];
}


const Listings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/listings');
      // Adding a default 'Active' status to each listing for display purposes
      const listingsWithStatus = response.data.map((listing: any) => ({
        ...listing,
        status: 'Activ' as const,
      }));
      setListings(listingsWithStatus);
    } catch (error) {
      toast.error("Nu s-au putut încărca anunțurile de pe server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);


  const handleDeleteListing = async (listingId: string, listingTitle: string) => {
    if (window.confirm(`Ești sigur că vrei să ștergi definitiv "${listingTitle}"?`)) {
        const promise = api.delete(`/listings/${listingId}`);

        toast.promise(promise, {
            loading: `Se șterge "${listingTitle}"...`,
            success: () => {
                fetchListings();
                return `"${listingTitle}" a fost șters cu succes.`;
            },
            error: (err) => {
                return "Nu s-a putut șterge anunțul. Te rugăm să încerci din nou.";
            }
        });
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Activ" 
      ? "bg-success-light text-success border-success/20"
      : "bg-muted text-muted-foreground border-border";
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestionează Anunțurile</h1>
          <p className="text-muted-foreground mt-2">
            Vizualizează, editează și gestionează toate anunțurile de pe platforma ta.
          </p>
        </div>
        
        <Button 
          onClick={() => navigate("/listings/new")}
          className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adaugă Anunț Nou
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="border-card-border bg-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută după titlu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Toate Anunțurile</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă anunțurile...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader className="hidden md:table-header-group">
                    <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Imagine</TableHead>
                    <TableHead className="text-foreground font-medium">Titlu</TableHead>
                    <TableHead className="text-foreground font-medium">Categorie</TableHead>
                    <TableHead className="text-foreground font-medium">Dată Creare</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                    <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="block md:table-row-group">
                    {filteredListings.map((listing) => (
                    <TableRow key={listing.id} className="block md:table-row mb-4 md:mb-0 border md:border-b rounded-lg md:rounded-none shadow-md md:shadow-none">
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none">
                            <span className="font-semibold text-foreground md:hidden">Imagine</span>
                            {listing.images && listing.images.length > 0 ? (
                                <img 
                                src={listing.images[0].url} 
                                alt={listing.title} 
                                className="w-16 h-16 object-cover rounded-md"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none font-medium text-foreground">
                            <span className="font-semibold text-foreground md:hidden">Titlu</span>
                            <span>{listing.title}</span>
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none text-muted-foreground">
                            <span className="font-semibold text-foreground md:hidden">Categorie</span>
                            <span>{listing.category.name}</span>
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none text-muted-foreground">
                            <span className="font-semibold text-foreground md:hidden">Dată Creare</span>
                            <span>{format(new Date(listing.createdAt), "dd MMM yyyy")}</span>
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 border-b md:border-none">
                            <span className="font-semibold text-foreground md:hidden">Status</span>
                            <Badge className={getStatusColor(listing.status)}>
                                {listing.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="flex md:table-cell items-center justify-between p-4 md:text-right">
                             <span className="font-semibold text-foreground md:hidden">Acțiuni</span>
                            <div className="flex justify-end space-x-2">
                                <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/listings/${listing.id}/edit`)}
                                className="border-border hover:bg-secondary"
                                >
                                <Edit className="w-4 h-4" />
                                <span className="sr-only">Editează</span>
                                </Button>
                                <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteListing(listing.id, listing.title)}
                                className="border-destructive text-destructive hover:bg-destructive-light"
                                >
                                <Trash2 className="w-4 h-4" />
                                <span className="sr-only">Șterge</span>
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

export default Listings;
