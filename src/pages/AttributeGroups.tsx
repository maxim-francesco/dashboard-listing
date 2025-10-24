import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Trash2, Loader2, ListTree } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import ConfirmationModal from "@/components/ConfirmationModal";

interface AttributeGroup {
  id: string;
  name: string;
}

const AttributeGroups = () => {
  const [groups, setGroups] = useState<AttributeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Partial<AttributeGroup>>({
    name: "",
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<AttributeGroup | null>(null);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/attribute-groups");
      setGroups(response.data);
    } catch (error) {
      toast.error("Nu s-au putut încărca grupurile de atribute.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openCreateModal = () => {
    setCurrentGroup({ name: "" });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (group: AttributeGroup) => {
    setCurrentGroup(group);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openDeleteConfirmation = (group: AttributeGroup) => {
    setGroupToDelete(group);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    const promise = api.delete(`/attribute-groups/${groupToDelete.id}`);

    toast.promise(promise, {
      loading: 'Se șterge grupul...',
      success: () => {
          fetchGroups();
          setIsConfirmModalOpen(false);
          setGroupToDelete(null);
          return `Grupul "${groupToDelete.name}" a fost șters cu succes!`;
      },
      error: (err) => {
          setIsConfirmModalOpen(false);
          setGroupToDelete(null);
          const errorMessage = err.response?.data?.message || 'Nu s-a putut șterge grupul.';
          return errorMessage;
      }
    });
  };

  const handleSave = async () => {
    if (!currentGroup.name?.trim()) {
      toast.error("Numele grupului nu poate fi gol.");
      return;
    }

    let promise;
    if (isEditing) {
      promise = api.put(`/attribute-groups/${currentGroup.id}`, { name: currentGroup.name });
    } else {
      promise = api.post('/attribute-groups', { name: currentGroup.name });
    }

    toast.promise(promise, {
        loading: 'Se salvează grupul...',
        success: () => {
            fetchGroups();
            setIsModalOpen(false);
            return `Grupul "${currentGroup.name}" a fost salvat cu succes.`;
        },
        error: (err) => {
            return "A apărut o eroare la salvarea grupului.";
        }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grupuri de Atribute</h1>
          <p className="text-muted-foreground mt-2">
            Organizează atributele în grupuri pentru o mai bună structurare în pagina publică.
          </p>
        </div>
        
        <Button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adaugă Grup Nou
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditing ? 'Editează Grupul' : 'Adaugă Grup Nou'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-foreground">
                Numele Grupului
              </Label>
              <Input
                id="groupName"
                placeholder="ex: Dotări, Siguranță, Confort"
                value={currentGroup.name}
                onChange={(e) => setCurrentGroup({ ...currentGroup, name: e.target.value })}
                className="bg-background border-border focus:border-primary"
              />
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
                Salvează Grupul
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Grupuri Configurate</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă grupurile...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                <ListTree className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">Niciun grup definit</h3>
                <p className="text-sm">Apasă pe "Adaugă Grup Nou" pentru a crea primul tău grup.</p>
              </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Nume Grup</TableHead>
                    <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id} className="border-border">
                      <TableCell className="font-medium text-foreground">
                        {group.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border hover:bg-secondary"
                            onClick={() => openEditModal(group)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editează
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteConfirmation(group)}
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
          )}
        </CardContent>
      </Card>
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmă Ștergerea"
        message={`Ești sigur că vrei să ștergi definitiv grupul "${groupToDelete?.name}"? Această acțiune nu poate fi anulată.`}
      />
    </div>
  );
};

export default AttributeGroups;
