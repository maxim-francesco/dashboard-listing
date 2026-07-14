
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Settings, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

interface Category {
  id: string;
  name: string;
  businessId: string;
  _count?: {
    listings: number;
  };
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // State for editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const navigate = useNavigate();

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (error) {
      toast.error("Nu s-au putut încărca categoriile de pe server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Numele categoriei nu poate fi gol.");
      return;
    }

    const promise = api.post("/categories", { name: newCategoryName });

    toast.promise(promise, {
        loading: 'Se adaugă categoria...',
        success: (res) => {
            fetchCategories(); // Refresh the list
            setNewCategoryName("");
            setIsAddDialogOpen(false);
            return `Categoria "${newCategoryName}" a fost adăugată cu succes.`;
        },
        error: (err) => {
            return "Nu s-a putut salva noua categorie.";
        }
    });
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (
      window.confirm(
        `Ești sigur că vrei să ștergi "${categoryName}"? Aceasta va șterge și toate anunțurile asociate.`
      )
    ) {
      const promise = api.delete(`/categories/${categoryId}`);
      toast.promise(promise, {
          loading: `Se șterge "${categoryName}"...`,
          success: () => {
            fetchCategories(); // Refresh the list
            return `"${categoryName}" a fost ștearsă cu succes.`;
          },
          error: (err) => {
            return `Nu s-a putut șterge "${categoryName}". Te rugăm să încerci din nou.`;
          }
      });
    }
  };
  
  const handleOpenEditDialog = (category: Category) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Numele categoriei nu poate fi gol.");
      return;
    }

    const promise = api.put(`/categories/${editingCategory.id}`, { name: editingCategory.name });

    toast.promise(promise, {
        loading: 'Se actualizează categoria...',
        success: () => {
            fetchCategories();
            setEditingCategory(null);
            setIsEditDialogOpen(false);
            return `Categoria a fost actualizată la "${editingCategory.name}".`;
        },
        error: (err) => {
            return "Nu s-au putut salva modificările.";
        }
    });
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestionează Categoriile</h1>
          <p className="text-muted-foreground mt-2">
            Organizează anunțurile prin gestionarea categoriilor de produse și servicii.
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Adaugă Categorie Nouă
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Adaugă Categorie Nouă</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName" className="text-foreground">
                  Numele Categoriei
                </Label>
                <Input
                  id="categoryName"
                  placeholder="Introdu numele categoriei"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="bg-background border-border focus:border-primary"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-border hover:bg-secondary"
                >
                  Anulează
                </Button>
                <Button
                  onClick={handleAddCategory}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  Salvează Categoria
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editează Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName" className="text-foreground">
                Numele Categoriei
              </Label>
              <Input
                id="editCategoryName"
                placeholder="Introdu numele categoriei"
                value={editingCategory?.name || ""}
                onChange={(e) => 
                  editingCategory && setEditingCategory({ ...editingCategory, name: e.target.value })
                }
                className="bg-background border-border focus:border-primary"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-border hover:bg-secondary"
              >
                Anulează
              </Button>
              <Button
                onClick={handleUpdateCategory}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                Actualizează Categoria
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories Content */}
      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Categorii</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă categoriile...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-foreground font-medium">Nume Categorie</TableHead>
                      <TableHead className="text-foreground font-medium">Nr. Anunțuri</TableHead>
                      <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {category.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {category._count?.listings ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/categories/${category.id}/attributes`, { state: { categoryName: category.name } })}
                              className="border-border hover:bg-secondary"
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Atribute
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditDialog(category)}
                              className="border-border hover:bg-secondary"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editează
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              className="border-destructive text-destructive hover:bg-destructive-light"
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{category._count?.listings ?? 0}</span> anunțuri
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/categories/${category.id}/attributes`, { state: { categoryName: category.name } })}
                        className="border-border hover:bg-secondary w-full justify-start"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Atribute
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditDialog(category)}
                        className="border-border hover:bg-secondary w-full justify-start"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editează
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="border-destructive text-destructive hover:bg-destructive-light w-full justify-start"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Șterge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Categories;
