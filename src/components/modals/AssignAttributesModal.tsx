
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
import { Loader2 } from "lucide-react";

interface AttributeGroup {
  id: string;
  name: string;
}

interface AssignAttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  group: AttributeGroup | null;
}

const AssignAttributesModal = ({ isOpen, onClose, onSave, group }: AssignAttributesModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !group) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Alocă Atribute pentru '{group.name}'</DialogTitle>
          <DialogDescription>
            Selectează atributele pe care vrei să le adaugi în acest grup. Vor fi afișate doar atributele care nu aparțin niciunui grup.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 min-h-[200px] max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
             <div className="text-muted-foreground text-center">
                Aici va fi lista de atribute...
            </div>
          )}
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
            onClick={onSave}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
            disabled={isLoading}
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
