
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Inbox } from "lucide-react";
import api from "@/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-hot-toast";

interface AttributeGroup {
  id: string;
  name: string;
}

interface UngroupedAttribute {
    id: string;
    name: string;
    category: {
        name: string;
    };
}

interface AssignAttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  group: AttributeGroup | null;
}

const AssignAttributesModal = ({ isOpen, onClose, onSave, group }: AssignAttributesModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [attributes, setAttributes] = useState<UngroupedAttribute[]>([]);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const fetchUngroupedAttributes = async () => {
        setIsLoading(true);
        try {
          const response = await api.get('/attributes/ungrouped');
          setAttributes(response.data);
        } catch (error) {
          toast.error("Nu s-au putut încărca atributele disponibile.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchUngroupedAttributes();
    } else {
        // Reset state on close
        setAttributes([]);
        setSelectedAttributeIds(new Set());
    }
  }, [isOpen]);

  const handleToggleAttribute = (attributeId: string) => {
    setSelectedAttributeIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(attributeId)) {
            newSet.delete(attributeId);
        } else {
            newSet.add(attributeId);
        }
        return newSet;
    });
  };

  const handleSaveChanges = () => {
    // This will be implemented in the next step
    onSave();
  };

  if (!isOpen || !group) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border sm:max-w-[600px] flex flex-col h-full max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Alocă Atribute pentru '{group.name}'</DialogTitle>
          <DialogDescription>
            Selectează atributele pe care vrei să le adaugi în acest grup. Vor fi afișate doar atributele care nu aparțin niciunui grup.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4 -mr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : attributes.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
                    <Inbox className="w-12 h-12 mb-4 text-gray-400"/>
                    <h3 className="font-semibold text-lg">Niciun atribut disponibil</h3>
                    <p className="text-sm">Toate atributele existente sunt deja alocate unui grup.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {attributes.map(attr => (
                        <div key={attr.id} className="flex items-center space-x-3 p-3 rounded-md border border-border bg-background/50 transition-colors hover:bg-accent">
                           <Checkbox
                                id={`attr-${attr.id}`}
                                checked={selectedAttributeIds.has(attr.id)}
                                onCheckedChange={() => handleToggleAttribute(attr.id)}
                            />
                            <Label htmlFor={`attr-${attr.id}`} className="flex flex-col w-full cursor-pointer">
                                <span className="font-medium text-foreground">{attr.name}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Package className="w-3 h-3"/> {attr.category.name}
                                </span>
                            </Label>
                        </div>
                    ))}
                </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border hover:bg-secondary"
          >
            Anulează
          </Button>
          <Button
            onClick={handleSaveChanges}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
            disabled={isLoading || selectedAttributeIds.size === 0}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvează Modificările
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignAttributesModal;
