
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ArrowLeft, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Separator } from "@/components/ui/separator";

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

interface AttributeGroup {
    id: string;
    name: string;
}

interface GroupedAttributes {
    [groupName: string]: Attribute[];
}

const CategoryAttributes = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [attributes, setAttributes] = useState<GroupedAttributes>({});
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAttribute, setCurrentAttribute] = useState<Partial<Attribute>>({
    name: "",
    type: "STRING",
    attributeGroupId: null,
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(null);

  const categoryName = location.state?.categoryName || "Categorie";

  const fetchAttributes = async () => {
    if (!categoryId) return;
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

  const fetchAttributeGroups = async () => {
    try {
        const response = await api.get("/attribute-groups");
        setAttributeGroups(response.data);
    } catch (error) {
        toast.error("Nu s-au putut încărca grupurile de atribute.");
    }
  };

  useEffect(() => {
    fetchAttributes();
    fetchAttributeGroups();
  }, [categoryId]);

  const openCreateModal = () => {
    setCurrentAttribute({ name: "", type: "STRING", attributeGroupId: null });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (attribute: Attribute) => {
    setCurrentAttribute(attribute);
    setIsEditing(true);
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

  const handleSave = async () => {
    const payload = {
      name: currentAttribute.name,
      type: currentAttribute.type,
      attributeGroupId: currentAttribute.attributeGroupId || null,
    };
    
    let promise;
    if (isEditing) {
      promise = api.put(`/categories/${categoryId}/attributes/${currentAttribute.id}`, payload);
    } else {
      promise = api.post(`/categories/${categoryId}/attributes`, payload);
    }
    
    toast.promise(promise, {
        loading: 'Se salvează atributul...',
        success: () => {
            fetchAttributes();
            setIsModalOpen(false);
            return `Atributul "${currentAttribute.name}" a fost salvat cu succes.`;
        },
        error: (err) => {
            return "A apărut o eroare la salvarea atributului.";
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
        
        <Button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adaugă Atribut
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditing ? 'Editează Atributul' : 'Adaugă Atribut Nou'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="attributeName" className="text-foreground">
                Numele Atributului
              </Label>
              <Input
                id="attributeName"
                placeholder="ex: Culoare, Kilometraj, Suprafață"
                value={currentAttribute.name}
                onChange={(e) => setCurrentAttribute({ ...currentAttribute, name: e.target.value })}
                className="bg-background border-border focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attributeType" className="text-foreground">
                Tipul Atributului
              </Label>
              <Select
                value={currentAttribute.type}
                onValueChange={(value) =>
                  setCurrentAttribute({ ...currentAttribute, type: value as Attribute["type"] })
                }
              >
                <SelectTrigger className="bg-background border-border focus:border-primary">
                  <SelectValue placeholder="Selectează tipul atributului" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="STRING">STRING (Text)</SelectItem>
                  <SelectItem value="NUMBER">NUMBER (ex: 123,45)</SelectItem>
                  <SelectItem value="BOOLEAN">BOOLEAN (Da/Nu)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attributeGroup" className="text-foreground">
                Grup (Opțional)
              </Label>
              <Select
                value={currentAttribute.attributeGroupId || ""}
                onValueChange={(value) =>
                  setCurrentAttribute({ ...currentAttribute, attributeGroupId: value || null })
                }
              >
                <SelectTrigger className="bg-background border-border focus:border-primary">
                  <SelectValue placeholder="Selectează un grup" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                    <SelectItem value="">Fără Grup</SelectItem>
                    {attributeGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-border hover:bg-secondary"
              >
                Anulează
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                Salvează Atributul
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
