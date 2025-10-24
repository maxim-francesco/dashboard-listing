import { useState, useEffect } from "react";
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
import { toast } from "react-hot-toast";
import api from "@/services/api";

interface Attribute {
  id: string;
  name: string;
  type: "STRING" | "NUMBER" | "BOOLEAN";
  categoryId: string;
  attributeGroupId?: string | null;
}

interface AttributeGroup {
    id: string;
    name: string;
}

interface AttributeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    categoryId: string;
    initialData?: Partial<Attribute> | null;
    defaultGroupId?: string | null;
}

const AttributeFormModal = ({ isOpen, onClose, onSave, categoryId, initialData, defaultGroupId }: AttributeFormModalProps) => {
    const isEditing = !!initialData?.id;
    const [formData, setFormData] = useState({
        name: "",
        type: "STRING" as Attribute['type'],
        attributeGroupId: null as string | null,
    });
    const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);

    useEffect(() => {
        const fetchAttributeGroups = async () => {
            try {
                const response = await api.get("/attribute-groups");
                setAttributeGroups(response.data);
            } catch (error) {
                toast.error("Nu s-au putut încărca grupurile de atribute.");
            }
        };
        fetchAttributeGroups();
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || "",
                    type: initialData.type || "STRING",
                    attributeGroupId: initialData.attributeGroupId || null
                });
            } else {
                 setFormData({
                    name: "",
                    type: "STRING",
                    attributeGroupId: defaultGroupId || null,
                });
            }
        }
    }, [isOpen, initialData, defaultGroupId]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Numele atributului este obligatoriu.");
            return;
        }

        const finalGroupId = formData.attributeGroupId === 'none' ? null : formData.attributeGroupId;

        const payload = {
            name: formData.name,
            type: formData.type,
            attributeGroupId: finalGroupId,
        };
        
        let promise;
        if (isEditing) {
            promise = api.put(`/categories/${categoryId}/attributes/${initialData?.id}`, payload);
        } else {
            promise = api.post(`/categories/${categoryId}/attributes`, payload);
        }
        
        toast.promise(promise, {
            loading: 'Se salvează atributul...',
            success: () => {
                onSave();
                return `Atributul "${formData.name}" a fost salvat cu succes.`;
            },
            error: () => {
                return "A apărut o eroare la salvarea atributului.";
            }
        });
    };

    const handleValueChange = (field: keyof typeof formData, value: string | null) => {
        setFormData(prev => ({...prev, [field]: value}));
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                        value={formData.name}
                        onChange={(e) => handleValueChange('name', e.target.value)}
                        className="bg-background border-border focus:border-primary"
                    />
                    </div>
                    
                    <div className="space-y-2">
                    <Label htmlFor="attributeType" className="text-foreground">
                        Tipul Atributului
                    </Label>
                    <Select
                        value={formData.type}
                        onValueChange={(value) => handleValueChange('type', value as Attribute['type'])}
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
                        value={formData.attributeGroupId || "none"}
                        onValueChange={(value) => handleValueChange('attributeGroupId', value)}
                        disabled={!!defaultGroupId}
                    >
                        <SelectTrigger className="bg-background border-border focus:border-primary">
                        <SelectValue placeholder="Selectează un grup" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="none">Fără Grup</SelectItem>
                            {attributeGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
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
    );
};

export default AttributeFormModal;
