import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import ConfirmationModal from "@/components/ConfirmationModal";
import AttributeFormModal from "@/components/modals/AttributeFormModal";

interface Attribute {
  id: string;
  name: string;
  type: "STRING" | "NUMBER" | "BOOLEAN";
  categoryId: string;
  attributeGroupId?: string | null;
  group?: {
      id: string;
      name: string;
  } | null;
}

interface GroupedAttributes {
    [groupName: string]: Attribute[];
}

const CategoryAttributes = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  if (!categoryId) {
      // Or render an error state
      return <div>Category ID is missing.</div>;
  }
  const navigate = useNavigate();
  const location = useLocation();

  const [attributes, setAttributes] = useState<GroupedAttributes>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(null);

  const categoryName = location.state?.categoryName || "Categorie";

  const fetchAttributes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/categories/${categoryId}/attributes`);
      setAttributes(response.data);
    } catch (error) {
      toast.error("Nu s-au putut încărca atributele pentru această categorie.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const openCreateModal = () => {
    setEditingAttribute(null);
    setIsModalOpen(true);
  };

  const openEditModal = (attribute: Attribute) => {
    setEditingAttribute(attribute);
    setIsModalOpen(true);
  };

  const openDeleteConfirmation = (attribute: Attribute) => {
    setAttributeToDelete(attribute);
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!attributeToDelete) return;
    const promise = api.delete(`/categories/${categoryId}/attributes/${attributeToDelete.id}`);
    
    toast.promise(promise, {
      loading: 'Se șterge atributul...',
      success: () => {
          fetchAttributes();
          setIsConfirmModalOpen(false);
          setAttributeToDelete(null);
          return `Atributul "${attributeToDelete.name}" a fost șters cu succes!`;
      },
      error: (err) => {
          setIsConfirmModalOpen(false);
          setAttributeToDelete(null);
          const errorMessage = err.response?.data?.message || 'Nu s-a putut șterge atributul.';
          return errorMessage;
      }
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "NUMBER":
        return "bg-primary-light text-primary border border-primary/20";
      case "STRING":
        return "bg-success-light text-success border border-success/20";
      case "BOOLEAN":
        return "bg-warning-light text-warning border border-warning/20";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/categories")}
              className="border-border hover:bg-secondary flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Atribute pentru '{categoryName}'
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestionează atributele personalizate pentru această categorie.
              </p>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link to={`/settings/attribute-groups?fromCategory=${categoryId}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2">
                Gestionează Grupuri
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">Nou</span>
            </Link>
            <Button
                onClick={openCreateModal}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
                <Plus className="w-4 h-4 mr-2" />
                Adaugă Atribut
            </Button>
        </div>
      </div>
      
      {isModalOpen && (
        <AttributeFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={() => {
              setIsModalOpen(false);
              fetchAttributes();
            }}
            categoryId={categoryId}
            initialData={editingAttribute}
        />
      )}


      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Atribute Configurate</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă atributele...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(attributes).map((groupName) => (
                <div key={groupName}>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{groupName}</h3>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-foreground font-medium">Numele Atributului</TableHead>
                          <TableHead className="text-foreground font-medium">Tip</TableHead>
                          <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attributes[groupName].map((attribute) => (
                          <TableRow key={attribute.id} className="border-border">
                            <TableCell className="font-medium text-foreground">{attribute.name}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(attribute.type)}`}>
                                {attribute.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-border hover:bg-secondary"
                                  onClick={() => openEditModal(attribute)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Editează
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteConfirmation(attribute)}
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
                    {attributes[groupName].map((attribute) => (
                      <div key={attribute.id} className="border border-border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-foreground">{attribute.name}</h3>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(attribute.type)}`}>
                            {attribute.type}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(attribute)}
                            className="border-border hover:bg-secondary w-full justify-start"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editează
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteConfirmation(attribute)}
                            className="border-destructive text-destructive hover:bg-destructive-light w-full justify-start"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Șterge
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmă Ștergerea"
        message={`Ești sigur că vrei să ștergi definitiv atributul "${attributeToDelete?.name}"? Această acțiune nu poate fi anulată.`}
      />
    </div>
  );
};

export default CategoryAttributes;