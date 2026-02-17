
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axios from 'axios';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Loader2, RotateCcw, RotateCw, X, UploadCloud, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api, { rotateImage } from "@/services/api";
import { DndContext, closestCenter, DragEndEvent, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableImage } from '@/components/SortableImage';

interface Category {
  id: string;
  name: string;
}

interface Attribute {
  id: string;
  name: string;
  type: "STRING" | "NUMBER" | "BOOLEAN";
  group?: { id: string; name: string } | null;
}

interface GroupedAttributes {
    [groupName: string]: Attribute[];
}

interface AttributeValueFromServer {
    attributeId: string;
    stringValue?: string | null;
    numberValue?: number | null;
    booleanValue?: boolean | null;
}

interface ExistingImage {
    id: string;
    url: string;
    order: number;
    rotation: number;
}

interface ImageFileState {
  file: File;
  rotation: number;
  previewUrl: string;
}

interface FullListingData {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    purchasePrice: number | null;
    otherCosts: number | null;
    images: ExistingImage[];
    attributeValues: AttributeValueFromServer[];
    youtubeVideoId?: string | null;
}

const AddEditListing = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!listingId;
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    purchasePrice: "" as number | "",
    otherCosts: "" as number | "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<GroupedAttributes>({});
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});
  
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imageFiles, setImageFiles] = useState<ImageFileState[]>([]);
  const [pendingRotations, setPendingRotations] = useState<{ [key: string]: number }>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Video state
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategories(response.data);
      } catch (error) {
        toast.error("Nu s-au putut încărca categoriile.");
      }
    };

    const fetchListingData = async () => {
        if (!listingId) return;
        setIsLoading(true);
        try {
            const { title, description, categoryId, attributeValues: fetchedAttributeValues, images, purchasePrice, otherCosts, youtubeVideoId: fetchedYoutubeId } = (await api.get<FullListingData>(`/listings/${listingId}`)).data;
            setFormData({ title, description, categoryId, purchasePrice: purchasePrice ?? "", otherCosts: otherCosts ?? "" });
            setYoutubeVideoId(fetchedYoutubeId || null);
            
            const sortedImages = (images || []).sort((a: ExistingImage, b: ExistingImage) => a.order - b.order);
            const imagesWithRotation = sortedImages.map((img: any) => ({ ...img, rotation: 0 }));

            setExistingImages(imagesWithRotation);
            
            const valuesObject = fetchedAttributeValues.reduce((acc: Record<string, any>, val: AttributeValueFromServer) => {
                const rawValue = val.stringValue ?? val.numberValue ?? val.booleanValue;
                acc[val.attributeId] = rawValue === null ? '' : rawValue;
                return acc;
            }, {});
            setAttributeValues(valuesObject);

        } catch (error) {
            toast.error("Nu s-au putut încărca datele anunțului pentru editare.");
            navigate('/listings');
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchCategories();
    if (isEditing) {
        fetchListingData();
    }
  }, [listingId, isEditing, navigate]);

  useEffect(() => {
    const fetchAttributesForCategory = async () => {
      if (formData.categoryId) {
        try {
          const response = await api.get(`/categories/${formData.categoryId}/attributes`);
          
          setAttributes(response.data);

          if (!isEditing || Object.keys(attributeValues).length === 0) {
              const initialValues: Record<string, any> = {};
              Object.values(response.data).flat().forEach((attr: Attribute) => {
                  initialValues[attr.id] = attr.type === 'BOOLEAN' ? false : '';
              });
              setAttributeValues(initialValues);
          }
        } catch (error) {
          toast.error("Nu s-au putut încărca atributele pentru categoria selectată.");
          setAttributes({});
        }
      } else {
        setAttributes({});
      }
    };

    fetchAttributesForCategory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.categoryId, isEditing]);


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const rotationIds = Object.keys(pendingRotations);
        if (rotationIds.length > 0) {
            const rotationPromises = rotationIds.map(id =>
            rotateImage(id, pendingRotations[id])
            );
            const results = await Promise.allSettled(rotationPromises);
            results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Failed to rotate image ${rotationIds[index]}:`, result.reason);
            }
            });
        }

        const attributesPayload = Object.entries(attributeValues)
            .map(([key, value]) => ({ attributeId: key, value }))
            .filter(attr => attr.value !== '' && attr.value !== null && attr.value !== undefined);

        const listingPayload = { 
            title: formData.title, 
            description: formData.description, 
            categoryId: formData.categoryId, 
            attributes: attributesPayload,
            purchasePrice: formData.purchasePrice === '' ? null : Number(formData.purchasePrice),
            otherCosts: formData.otherCosts === '' ? null : Number(formData.otherCosts),
            youtubeVideoId,
        };
        
        let savedListingId;
        if (listingId) {
            await api.put(`/listings/${listingId}`, listingPayload);
            savedListingId = listingId;
        } else {
            const response = await api.post('/listings', listingPayload);
            savedListingId = response.data.id;
        }

        if (imageFiles && imageFiles.length > 0) {
            for (const imageObject of imageFiles) {
                const formData = new FormData();
                formData.append('image', imageObject.file);
                formData.append('rotation', String(imageObject.rotation));
                await api.post(`/listings/${savedListingId}/images`, formData);
            }
        }
        
        if (existingImages && existingImages.length > 0) {
            const currentImages = existingImages;
            const sortedImageIds = [...currentImages]
                .sort((a, b) => a.order - b.order)
                .map(image => image.id);
            const reorderUrl = `/listings/${savedListingId}/reorder-images`;
            const payload = { imageIds: sortedImageIds };
            await api.post(reorderUrl, payload);
        }
        
        setPendingRotations({});
        toast.success('Anunțul a fost salvat cu succes!');
        
        await queryClient.invalidateQueries({ queryKey: ['listings'] });
        navigate('/listings');

    } catch (error) {
        toast.error('A apărut o eroare la salvarea anunțului.');
    } finally {
        setIsLoading(false);
    }
  }, [listingId, formData, attributeValues, imageFiles, existingImages, navigate, pendingRotations, queryClient, youtubeVideoId]);

  const handleAttributeChange = (attributeId: string, value: any) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };
  
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => ({
        file,
        rotation: 0,
        previewUrl: URL.createObjectURL(file)
      }));

      if (!listingId) {
         setImageFiles(prevFiles => [...prevFiles, ...newFiles]);
         return;
      }

      const sequentialUpload = async () => {
          const responses = [];
          for (const imageObject of newFiles) {
            const formData = new FormData();
            formData.append('image', imageObject.file);
            formData.append('rotation', String(imageObject.rotation));
            const response = await api.post(`/listings/${listingId}/images`, formData);
            responses.push(response);
          }
          return responses;
      };
      
      toast.promise(sequentialUpload(), {
        loading: 'Se încarcă imaginile...',
        success: (responses) => {
          const newImages = responses.map(res => ({ ...res.data, rotation: 0 }));
          setExistingImages(prevImages => 
            [...prevImages, ...newImages].sort((a, b) => a.order - b.order)
          );
          return 'Imaginile au fost adăugate.';
        },
        error: 'Eroare la încărcarea imaginilor.'
      });
    }
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    setImageFiles(prevFiles => {
      const fileToRemove = prevFiles[indexToRemove];
      URL.revokeObjectURL(fileToRemove.previewUrl);
      return prevFiles.filter((_, index) => index !== indexToRemove);
    });
  };
  
  const handleRotateImage = (indexToRotate: number, direction: 'left' | 'right') => {
    setImageFiles(prevFiles => prevFiles.map((image, index) => {
      if (index === indexToRotate) {
        const newRotation = direction === 'right' 
          ? (image.rotation + 90) % 360 
          : (image.rotation - 90 + 360) % 360;
        return { ...image, rotation: newRotation };
      }
      return image;
    }));
  };
  
  const handleRotateExistingImage = (imageIndex: number, direction: 'left' | 'right') => {
    let imageId: string | undefined;
    let newAngle: number = 0;
  
    setExistingImages(currentImages => {
        const newImages = [...currentImages];
        const imageToUpdate = { ...newImages[imageIndex] };
        
        const rotationAmount = direction === 'left' ? -90 : 90;
        const currentRotation = imageToUpdate.rotation || 0;
        let finalAngle = (currentRotation + rotationAmount + 360) % 360;
        
        imageToUpdate.rotation = finalAngle;
        newImages[imageIndex] = imageToUpdate;
        
        imageId = imageToUpdate.id;
        newAngle = finalAngle;
        
        return newImages;
    });

    if (imageId) {
        setPendingRotations(prev => ({ ...prev, [imageId as string]: newAngle }));
    }
  };

  const handleDeleteExistingImage = async (imageId: string) => {
      if (!listingId) return;
      if (!window.confirm("Ești sigur că vrei să ștergi această imagine?")) return;

      const promise = api.delete(`/listings/${listingId}/images/${imageId}`);
      
      toast.promise(promise, {
          loading: 'Se șterge imaginea...',
          success: () => {
              setExistingImages(currentImages => currentImages.filter(img => img.id !== imageId));
              return "Imaginea a fost ștearsă cu succes.";
          },
          error: (err) => {
              return "Nu s-a putut șterge imaginea. Te rugăm să încerci din nou.";
          }
      });
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setExistingImages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        return newArray.map((item, index) => ({...item, order: index}));
      });
    }
  }

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setVideoFile(event.target.files[0]);
    } else {
      setVideoFile(null);
    }
  };

  const handleVideoUpload = async () => {
    if (!videoFile || !listingId) return;

    const uploadFormData = new FormData();
    uploadFormData.append('video', videoFile); 

    setIsUploadingVideo(true);
    setUploadProgress(0);

    try {
      const uploadUrl = `https://saas-platform-backend.onrender.com/api/listings/${listingId}/upload-video`;
      
      const response = await axios.post(
        uploadUrl,
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          },
          timeout: 300000, 
        }
      );
      
      setYoutubeVideoId(response.data.youtubeVideoId);
      toast.success("Video încărcat cu succes! URL-ul va fi salvat la final.");
    } catch (error: any) {
        if (error.code === 'ECONNABORTED') {
          toast.error("Încărcarea a durat prea mult și a fost anulată. Verifică conexiunea la internet.");
        } else if (error.response?.status === 429) {
            toast.error("Capacitatea de procesare video a fost atinsă pentru astăzi. Această funcționalitate va fi extinsă în curând!", { duration: 6000 });
        } else if (error.response?.status === 401) {
             toast.error("Sesiune invalidă. Te rugăm să te autentifici din nou.");
             navigate('/login');
        } else {
            console.error("Upload error", error);
            toast.error(error.response?.data?.message || "A apărut o eroare la încărcarea video-ului.");
        }
    } finally {
      setIsUploadingVideo(false);
      setUploadProgress(null);
      setVideoFile(null);
    }
  };

  const handleRemoveVideo = async () => {
    if (!listingId) return;
    if (!window.confirm("Ești sigur că vrei să ștergi acest video? Acesta va fi șters și de pe serverul de stocare.")) {
        return;
    }
    
    setIsDeletingVideo(true);
    try {
        await api.delete(`/listings/${listingId}/video`);
        toast.success("Videoclipul a fost șters");
        setYoutubeVideoId(null);
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Eroare la ștergerea videoclipului.");
    } finally {
        setIsDeletingVideo(false);
    }
  };


  const renderAttributeField = (attribute: Attribute) => {
    const value = attributeValues[attribute.id] ?? '';

    switch (attribute.type) {
      case "NUMBER":
        return (
          <Input
            id={attribute.id}
            type="number"
            value={value}
            onChange={(e) => handleAttributeChange(attribute.id, e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="bg-background border-border focus:border-primary"
          />
        );
      case "STRING":
        return (
          <Input
            id={attribute.id}
            type="text"
            value={value}
            onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
            className="bg-background border-border focus:border-primary"
          />
        );
      case "BOOLEAN":
        return (
          <div className="flex items-center h-10">
            <Checkbox
              id={attribute.id}
              checked={!!value}
              onCheckedChange={(checked) => handleAttributeChange(attribute.id, checked)}
            />
          </div>
        );
      default:
        return null;
    }
  };
  
    if (isLoading && isEditing) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Se încarcă datele anunțului...</p>
            </div>
        );
    }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/listings")}
          className="border-border hover:bg-secondary w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi la Anunțuri
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? "Editează Anunțul" : "Adaugă Anunț Nou"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? "Actualizează detaliile anunțului mai jos." : "Creează un anunț nou pentru platforma ta."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-card-border bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Informații de Bază</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground font-medium">
                    Titlul Anunțului
                </Label>
                <Input
                    id="title"
                    placeholder="ex: Volkswagen Golf 7"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-background border-border focus:border-primary"
                    required
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground font-medium">
                    Categorie
                </Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))} required>
                    <SelectTrigger className="bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Selectează categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="purchasePrice" className="text-foreground font-medium">
                        Preț Achiziție (€)
                    </Label>
                    <Input
                        id="purchasePrice"
                        type="number"
                        placeholder="ex: 12000"
                        value={formData.purchasePrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value === '' ? '' : Number(e.target.value) }))}
                        className="bg-background border-border focus:border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="otherCosts" className="text-foreground font-medium">
                        Alte Costuri (€)
                    </Label>
                    <Input
                        id="otherCosts"
                        type="number"
                        placeholder="ex: 500"
                        value={formData.otherCosts}
                        onChange={(e) => setFormData(prev => ({ ...prev, otherCosts: e.target.value === '' ? '' : Number(e.target.value) }))}
                        className="bg-background border-border focus:border-primary"
                    />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground font-medium">
                Descriere
              </Label>
              <Textarea
                id="description"
                placeholder="Introdu o descriere detaliată a produsului"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background border-border focus:border-primary min-h-[120px]"
              />
            </div>

          </CardContent>
        </Card>

        {formData.categoryId && Object.keys(attributes).length > 0 && (
          <Card className="border-card-border bg-card mb-6">
            <CardHeader>
              <CardTitle className="text-foreground">Detalii Specifice</CardTitle>
              <CardDescription>Completați detaliile specifice categoriei selectate.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full space-y-4">
                {Object.entries(attributes).map(([groupName, groupAttributes]) => (
                  <AccordionItem value={groupName} key={groupName} className="border border-border rounded-lg bg-background/50 px-4">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                      {groupName}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {groupAttributes.map((attribute) => (
                          <div key={attribute.id} className="space-y-2">
                            <Label htmlFor={attribute.id} className="text-foreground font-medium">
                              {attribute.name}
                            </Label>
                            {renderAttributeField(attribute)}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        <Card className="border-card-border bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Fotografii Anunț</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && existingImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Imagini Existente (trage pentru a reordona)</h3>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={existingImages} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {existingImages.map((image, index) => (
                                <SortableImage 
                                    key={image.id} 
                                    image={image} 
                                    onDelete={() => handleDeleteExistingImage(image.id)}
                                    onRotate={(direction) => handleRotateExistingImage(index, direction)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
              </div>
            )}

            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-foreground font-medium">Adaugă imagini noi</p>
                <p className="text-sm text-muted-foreground">
                  Trage fișierele aici sau apasă pentru a naviga.
                </p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleImageChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif, image/webp"
              />
            </div>

            {imageFiles.length > 0 && (
              <div className="mt-6">
                 <h3 className="text-sm font-medium text-muted-foreground mb-4">Imagini Noi de Încărcat</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {imageFiles.map((imageState, index) => (
                      <div key={index} className="relative group">
                          <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                            <img
                              src={imageState.previewUrl}
                              alt={`Previzualizare ${index}`}
                              className="w-full h-full object-cover transition-transform duration-200"
                              style={{ transform: `rotate(${imageState.rotation}deg)` }}
                            />
                          </div>
                          <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                  variant="destructive"
                                  size="icon"
                                  type="button"
                                  className="h-7 w-7"
                                  onClick={() => handleRemoveNewImage(index)}
                              >
                                  <X className="w-4 h-4" />
                              </Button>
                          </div>
                          <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                  variant="secondary"
                                  size="icon"
                                  type="button"
                                  className="h-7 w-7"
                                  onClick={() => handleRotateImage(index, 'left')}
                              >
                                  <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                  variant="secondary"
                                  size="icon"
                                  type="button"
                                  className="h-7 w-7"
                                  onClick={() => handleRotateImage(index, 'right')}
                              >
                                  <RotateCw className="w-4 h-4" />
                              </Button>
                          </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-card-border bg-card mb-6">
            <CardHeader>
                <CardTitle className="text-foreground">Prezentare Video</CardTitle>
                <CardDescription>Încarcă un fișier video pentru anunț.</CardDescription>
            </CardHeader>
            <CardContent>
                {!isEditing ? (
                <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                    Salvează anunțul pentru a putea adăuga un video.
                </div>
                ) : youtubeVideoId ? (
                <div>
                    <div className="aspect-video rounded-lg overflow-hidden border bg-black">
                    {(youtubeVideoId.startsWith('http') || youtubeVideoId.includes('cloudinary')) ? (
                        <video
                            src={youtubeVideoId}
                            controls
                            className="w-full rounded-lg">
                            Browser-ul tău nu suportă tag-ul video.
                        </video>
                    ) : (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen>
                        </iframe>
                    )}
                    </div>
                    <Button variant="outline" onClick={handleRemoveVideo} className="mt-4 border-destructive text-destructive hover:bg-destructive-light" disabled={isDeletingVideo}>
                    {isDeletingVideo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    {isDeletingVideo ? 'Se șterge...' : 'Șterge Video'}
                    </Button>
                </div>
                ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="video-upload">Fișier Video (.mp4, .mov)</Label>
                    <Input
                        id="video-upload"
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={handleVideoFileChange}
                        className="flex-grow file:text-foreground file:font-medium"
                        disabled={isUploadingVideo}
                    />
                    {videoFile && <p className="text-sm text-muted-foreground">Selectat: {videoFile.name}</p>}
                    </div>
                    
                    {isUploadingVideo && uploadProgress !== null && (
                    <div className="space-y-2">
                        <Label>Progres încărcare</Label>
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
                    </div>
                    )}

                    <Button
                    type="button"
                    onClick={handleVideoUpload}
                    disabled={!videoFile || isUploadingVideo}
                    >
                    {isUploadingVideo ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <UploadCloud className="w-4 h-4 mr-2" />
                    )}
                    {isUploadingVideo ? 'Se încarcă...' : 'Încarcă Video'}
                    </Button>
                </div>
                )}
            </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row-reverse justify-start space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
            disabled={isLoading || isUploadingVideo || isDeletingVideo}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isEditing ? "Actualizează Anunțul" : "Salvează Anunțul"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/listings")}
            className="border-border hover:bg-secondary"
            disabled={isUploadingVideo || isDeletingVideo}
          >
            Anulează
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddEditListing;
