import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Loader2, RotateCcw, RotateCw, X, UploadCloud, Trash2, Archive, Check, Plus, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import api, { rotateImage, getMakes, getModelsByMake, getFeatures, generateDescription } from "@/services/api";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { DndContext, closestCenter, DragEndEvent, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableImage } from '@/components/SortableImage';
import AutovitPublishPanel from "@/components/listings/AutovitPublishPanel";
import MarketingModal from "@/components/modals/MarketingModal";
import { downloadImagesAsZip } from '@/utils/downloadImagesAsZip';
import { cn } from "@/lib/utils";
import {
  FUEL_TYPES,
  FUEL_TYPE_LABELS,
  GEARBOX_TYPES,
  GEARBOX_LABELS,
  DRIVETRAINS,
  DRIVETRAIN_LABELS,
  BODY_TYPES,
  BODY_TYPE_LABELS,
  POLLUTION_NORMS,
  POLLUTION_NORM_LABELS,
  COLORS,
  COLOR_LABELS,
  UPHOLSTERIES,
  UPHOLSTERY_LABELS,
  AIR_CONDITIONINGS,
  AIR_CONDITIONING_LABELS,
  LISTING_STATUSES,
  STATUS_LABELS,
  getOptions,
  normalizeString,
  mapFuelType,
  mapGearbox,
  mapDrivetrain,
  mapBodyType,
  mapPollutionNorm,
  mapColor,
  mapUpholstery,
  mapAirConditioning
} from "@/lib/enums";

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

interface AttributeValueFromServer {
    attributeId: string;
    stringValue?: string | null;
    numberValue?: number | null;
    booleanValue?: boolean | null;
    attribute?: {
      name: string;
      type: string;
    } | null;
}

interface FullListingData {
    id: string;
    title: string;
    description: string;
    internalNotes: string | null;
    purchasePrice: number | null;
    otherCosts: number | null;
    images: ExistingImage[];
    attributeValues: AttributeValueFromServer[];
    youtubeVideoId?: string | null;
}

const AddEditListing = () => {
  const { listingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: genDescription, isPending: isGenerating } = useMutation({
    mutationFn: generateDescription,
    onSuccess: (data) => {
      handleFieldChange("description", data.description);
      toast.success("Descriere generată.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Nu s-a putut genera descrierea.");
    },
  });

  const runGenerateDescription = () => {
    genDescription({ ...fields, featureIds: selectedFeatures });
  };
  const handleGenerateDescription = () => {
    if (!fields.makeId || !fields.modelId) {
      toast.error("Selectează marca și modelul înainte de generare.");
      return;
    }
    if (fields.description && fields.description.trim().length > 0) {
      setOverwriteDialogOpen(true);
      return;
    }
    runGenerateDescription();
  };

  const handleOpenMarketing = () => {
    if (!fields.makeId || !fields.modelId) {
      toast.error("Selectează marca și modelul înainte de generare.");
      return;
    }
    setIsMarketingModalOpen(true);
  };

  const isEditing = !!listingId;
  const [isLoading, setIsLoading] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);

  // Makes, Models, Features catalogs
  const [makes, setMakes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [features, setFeatures] = useState<Record<string, any[]>>({});
  
  // Search combobox popover state
  const [makeSearchOpen, setMakeSearchOpen] = useState(false);
  const [modelSearchOpen, setModelSearchOpen] = useState(false);

  // Form State
  const [fields, setFields] = useState({
    title: "",
    description: "",
    internalNotes: "",
    makeId: "",
    modelId: "",
    variant: "",
    year: "" as number | "",
    mileage: "" as number | "",
    vin: "",
    firstRegistrationAt: "",
    countryOfOrigin: "",
    registeredInRo: false,
    fuelType: "",
    gearbox: "",
    drivetrain: "",
    bodyType: "",
    engineCapacity: "" as number | "",
    powerHp: "" as number | "",
    pollutionNorm: "",
    co2Emissions: "" as number | "",
    color: "",
    colorDetail: "",
    upholstery: "",
    airConditioning: "",
    doors: "" as number | "",
    seats: "" as number | "",
    vatDeductible: false,
    noAccidents: false,
    serviceBook: false,
    firstOwner: false,
    ownerCount: "" as number | "",
    warrantyMonths: "" as number | "",
    price: "" as number | "",
    purchasePrice: "" as number | "",
    sellingPrice: "" as number | "",
    otherCosts: "" as number | "",
    status: "AVAILABLE",
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<string>("AVAILABLE");
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  // Image & Video State
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imageFiles, setImageFiles] = useState<ImageFileState[]>([]);
  const [pendingRotations, setPendingRotations] = useState<{ [key: string]: number }>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  
  const hasVideoFeature = localStorage.getItem('userEmail') === 'contact@vlc.ro' || localStorage.getItem('userEmail') === 'contact@nitu.ro';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  // Field change helper
  const handleFieldChange = (key: keyof typeof fields, value: any) => {
    setFields(prev => ({ ...prev, [key]: value }));
    if (["vatDeductible", "noAccidents", "serviceBook", "firstOwner", "registeredInRo"].includes(key)) {
      setTouchedFields(prev => ({ ...prev, [key]: true }));
    }
  };

  // Feature Toggle helper
  const handleFeatureToggle = (id: string) => {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  // Dynamic make and model handling
  const handleMakeChange = async (makeId: string) => {
    handleFieldChange("makeId", makeId);
    handleFieldChange("modelId", "");
    setModels([]);
    if (makeId) {
      try {
        const modelsData = await getModelsByMake(makeId);
        setModels(modelsData);
      } catch (err) {
        toast.error("Nu s-au putut încărca modelele pentru marca selectată.");
      }
    }
  };

  // Fetch catalogs and populate listing data on mount / edit
  useEffect(() => {
    const loadCatalogAndListing = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch makes and features catalogs
        const [makesData, featuresData] = await Promise.all([
          getMakes(),
          getFeatures()
        ]);
        setMakes(makesData);
        setFeatures(featuresData);
        
        const allFeaturesList = Object.values(featuresData).flat() as { id: string; name: string; slug: string }[];

        // 2. If editing, fetch listing and map legacy attributes to fixed schema
        if (isEditing && listingId) {
          const fetched = (await api.get<FullListingData>(`/listings/${listingId}`)).data;
          setYoutubeVideoId(fetched.youtubeVideoId || null);
          const sortedImages = (fetched.images || []).sort((a, b) => a.order - b.order);
          setExistingImages(sortedImages.map(img => ({ ...img, rotation: 0 })));

          const updatedFields = {
            title: fetched.title || "",
            description: fetched.description || "",
            internalNotes: fetched.internalNotes || "",
            makeId: "",
            modelId: "",
            variant: "",
            year: "" as number | "",
            mileage: "" as number | "",
            vin: "",
            firstRegistrationAt: "",
            countryOfOrigin: "",
            registeredInRo: false,
            fuelType: "",
            gearbox: "",
            drivetrain: "",
            bodyType: "",
            engineCapacity: "" as number | "",
            powerHp: "" as number | "",
            pollutionNorm: "",
            co2Emissions: "" as number | "",
            color: "",
            colorDetail: "",
            upholstery: "",
            airConditioning: "",
            doors: "" as number | "",
            seats: "" as number | "",
            vatDeductible: false,
            noAccidents: false,
            serviceBook: false,
            firstOwner: false,
            ownerCount: "" as number | "",
            warrantyMonths: "" as number | "",
            price: "" as number | "",
            purchasePrice: fetched.purchasePrice ?? "" as number | "",
            sellingPrice: "" as number | "",
            otherCosts: fetched.otherCosts ?? "" as number | "",
            status: "AVAILABLE",
          };

          const avs = fetched.attributeValues || [];
          const matchedFeatureIds: string[] = [];

          // Retrieve make and models
          const makeAttr = avs.find(a => normalizeString(a.attribute?.name) === "marca");
          if (makeAttr?.stringValue) {
            const matchedMake = makesData.find((m: any) => normalizeString(m.name) === normalizeString(makeAttr.stringValue));
            if (matchedMake) {
              updatedFields.makeId = matchedMake.id;
              
              // Load models synchronously for this make to resolve modelId
              const modelsData = await getModelsByMake(matchedMake.id);
              setModels(modelsData);
              
              const modelAttr = avs.find(a => normalizeString(a.attribute?.name) === "model");
              if (modelAttr?.stringValue) {
                const matchedModel = modelsData.find((m: any) => normalizeString(m.name) === normalizeString(modelAttr.stringValue));
                if (matchedModel) {
                  updatedFields.modelId = matchedModel.id;
                }
              }
            }
          }

          // Map legacy EAV to fields
          for (const av of avs) {
            const name = normalizeString(av.attribute?.name);
            const valStr = av.stringValue;
            const valNum = av.numberValue;
            const valBool = av.booleanValue;
            
            if (name === "variant") {
              updatedFields.variant = valStr || "";
            } else if (name === "an" || name === "an fabricatie" || name === "anul fabricatiei") {
              updatedFields.year = valNum ?? "";
            } else if (name === "kilometraj") {
              updatedFields.mileage = valNum ?? "";
            } else if (name === "pret" || name === "preț") {
              updatedFields.price = valNum ?? "";
            } else if (name === "combustibil") {
              updatedFields.fuelType = mapFuelType(valStr) || "";
            } else if (name === "cutie de viteze") {
              updatedFields.gearbox = mapGearbox(valStr) || "";
            } else if (name === "capacitate cilindrica") {
              updatedFields.engineCapacity = valNum ?? "";
            } else if (name === "putere (cp)" || name === "putere") {
              updatedFields.powerHp = valNum ?? "";
            } else if (name === "caroserie") {
              updatedFields.bodyType = mapBodyType(valStr) || "";
            } else if (name === "tractiune") {
              updatedFields.drivetrain = mapDrivetrain(valStr) || "";
            } else if (name === "norma de poluare" || name === "norma poluare") {
              updatedFields.pollutionNorm = mapPollutionNorm(valStr) || "";
            } else if (name === "culoare") {
              updatedFields.color = mapColor(valStr) || "";
            } else if (name === "culoare detaliu") {
              updatedFields.colorDetail = valStr || "";
            } else if (name === "tapiterie" || name === "tapițerie") {
              updatedFields.upholstery = mapUpholstery(valStr) || "";
            } else if (name === "climatizare") {
              updatedFields.airConditioning = mapAirConditioning(valStr) || "";
            } else if (name === "numar usi" || name === "numar de usi" || name === "usi" || name === "numar portiere") {
              updatedFields.doors = valNum ?? "";
            } else if (name === "numar locuri") {
              updatedFields.seats = valNum ?? "";
            } else if (name === "vin" || name === "serie sasiu (vin)" || name === "serie sasiu") {
              updatedFields.vin = valStr || "";
            } else if (name === "tara de origine" || name === "tara") {
              updatedFields.countryOfOrigin = valStr ? valStr.substring(0, 2).toUpperCase() : "";
            } else if (name === "prima inmatriculare") {
              updatedFields.firstRegistrationAt = valStr ? valStr.substring(0, 10) : "";
            } else if (name === "inmatriculat" || name === "inmatriculata") {
              updatedFields.registeredInRo = valBool ?? false;
            } else if (name === "tva deductibil") {
              updatedFields.vatDeductible = valBool ?? false;
            } else if (name === "fara accident" || name === "fara accident in istoric") {
              updatedFields.noAccidents = valBool ?? false;
            } else if (name === "carte service" || name === "carte de service") {
              updatedFields.serviceBook = valBool ?? false;
            } else if (name === "primul proprietar") {
              updatedFields.firstOwner = valBool ?? false;
            } else if (name === "numar proprietari") {
              updatedFields.ownerCount = valNum ?? "";
            } else if (name === "garantie (luni)" || name === "garantie") {
              updatedFields.warrantyMonths = valNum ?? "";
            } else if (name === "status") {
              updatedFields.status = valStr || "AVAILABLE";
            }
            
            // Map boolean features
            if (valBool === true) {
              const matched = allFeaturesList.find(f => {
                const normF = normalizeString(f.name);
                const normSlug = normalizeString(f.slug);
                return name === normF || name === normSlug || name.includes(normSlug) || normSlug.includes(name);
              });
              if (matched) {
                matchedFeatureIds.push(matched.id);
              }
            }
          }

          updatedFields.status = fetched.status || "AVAILABLE";
          setFields(updatedFields);
          setInitialStatus(updatedFields.status);
          setSelectedFeatures(matchedFeatureIds);
        }
      } catch (err) {
        console.error(err);
        toast.error("Eroare la încărcarea catalogului sau datelor anunțului.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCatalogAndListing();
  }, [listingId, isEditing]);

  useEffect(() => {
    if (!isEditing && searchParams.get("status") === "INCOMING") {
      setFields(prev => ({ ...prev, status: "INCOMING" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, searchParams]);

  // Form Submit Logic
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

        const parseNum = (v: any) => (v === "" || v === null || v === undefined) ? null : Number(v);

        // Build write contract payload
        const listingPayload: any = {
            title: fields.title,
            description: fields.description || null,
            internalNotes: fields.internalNotes || null,
            makeId: fields.makeId || null,
            modelId: fields.modelId || null,
            variant: fields.variant || null,
            year: parseNum(fields.year),
            mileage: parseNum(fields.mileage),
            vin: fields.vin || null,
            firstRegistrationAt: fields.firstRegistrationAt || null,
            countryOfOrigin: fields.countryOfOrigin ? fields.countryOfOrigin.toUpperCase() : null,
            fuelType: fields.fuelType || null,
            gearbox: fields.gearbox || null,
            drivetrain: fields.drivetrain || null,
            bodyType: fields.bodyType || null,
            engineCapacity: parseNum(fields.engineCapacity),
            powerHp: parseNum(fields.powerHp),
            pollutionNorm: fields.pollutionNorm || null,
            co2Emissions: parseNum(fields.co2Emissions),
            color: fields.color || null,
            colorDetail: fields.colorDetail || null,
            upholstery: fields.upholstery || null,
            airConditioning: fields.airConditioning || null,
            doors: parseNum(fields.doors),
            seats: parseNum(fields.seats),
            ownerCount: parseNum(fields.ownerCount),
            warrantyMonths: parseNum(fields.warrantyMonths),
            price: parseNum(fields.price),
            purchasePrice: parseNum(fields.purchasePrice),
            sellingPrice: parseNum(fields.sellingPrice),
            otherCosts: parseNum(fields.otherCosts),
            status: fields.status || "AVAILABLE",
            youtubeVideoId: youtubeVideoId || null,
            featureIds: selectedFeatures,
            extraSpecs: {}
        };

        const booleanKeys = ["vatDeductible", "noAccidents", "serviceBook", "firstOwner", "registeredInRo"];
        for (const key of booleanKeys) {
            if (touchedFields[key]) {
                listingPayload[key] = fields[key as keyof typeof fields];
            }
        }
        
        let savedListingId;
        if (listingId) {
            await api.put(`/listings/${listingId}`, listingPayload);
            savedListingId = listingId;
        } else {
            const response = await api.post('/listings', listingPayload);
            savedListingId = response.data.id;
        }

        // Parallel/Sequential new image uploads
        if (imageFiles && imageFiles.length > 0) {
            for (const imageObject of imageFiles) {
                const imgFormData = new FormData();
                imgFormData.append('image', imageObject.file);
                imgFormData.append('rotation', String(imageObject.rotation));
                await api.post(`/listings/${savedListingId}/images`, imgFormData);
            }
        }
        
        // Reorder images
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
        console.error(error);
        toast.error('A apărut o eroare la salvarea anunțului.');
    } finally {
        setIsLoading(false);
    }
  }, [listingId, fields, selectedFeatures, imageFiles, existingImages, navigate, pendingRotations, queryClient, youtubeVideoId]);

  // Image & Video Handlers
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
            const imgFormData = new FormData();
            imgFormData.append('image', imageObject.file);
            imgFormData.append('rotation', String(imageObject.rotation));
            const response = await api.post(`/listings/${listingId}/images`, imgFormData);
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
    let imgId: string | undefined;
    let newAngle: number = 0;
  
    setExistingImages(currentImages => {
        const newImages = [...currentImages];
        const imageToUpdate = { ...newImages[imageIndex] };
        
        const rotationAmount = direction === 'left' ? -90 : 90;
        const currentRotation = imageToUpdate.rotation || 0;
        let finalAngle = (currentRotation + rotationAmount + 360) % 360;
        
        imageToUpdate.rotation = finalAngle;
        newImages[imageIndex] = imageToUpdate;
        
        imgId = imageToUpdate.id;
        newAngle = finalAngle;
        
        return newImages;
    });

    if (imgId) {
        setPendingRotations(prev => ({ ...prev, [imgId as string]: newAngle }));
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
          error: () => "Nu s-a putut șterge imaginea. Te rugăm să încerci din nou."
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
      const uploadUrl = `/listings/${listingId}/upload-video`;
      const response = await api.post(
        uploadUrl,
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000, 
        }
      );
      
      setYoutubeVideoId(response.data.videoUrl);
      toast.success("Video încărcat cu succes! URL-ul va fi salvat la final.");
    } catch (error: any) {
        if (error.code === 'ECONNABORTED') {
          toast.error("Încărcarea a durat prea mult și a fost anulată. Verifică conexiunea la internet.");
        } else if (error.response?.status === 429) {
            toast.error("Capacitatea de procesare video a fost atinsă pentru astăzi. Această funcționalitate va fi extinsă în curând!", { duration: 6000 });
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

  const handleDownloadZip = async () => {
    if (!existingImages || existingImages.length === 0) {
      toast.error('Acest anunț nu are imagini de descărcat.');
      return;
    }
    setIsZipping(true);
    toast.loading('Se pregătește arhiva...', { id: 'zip-toast' });
    try {
      await downloadImagesAsZip(existingImages, fields.title || 'anunt');
      toast.success('Arhiva a fost descărcată cu succes!', { id: 'zip-toast' });
    } catch (error) {
      toast.error('A apărut o eroare la crearea ararchivei.', { id: 'zip-toast' });
    } finally {
      setIsZipping(false);
    }
  };

  if (isLoading && isEditing && makes.length === 0) {
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
          type="button"
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
        <Accordion type="multiple" defaultValue={["generale", "identitate", "tehnic", "istoric", "dotari"]} className="w-full space-y-6">
          
          {/* SECȚIUNEA 1: DETALII GENERALE */}
          <AccordionItem value="generale" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline py-4">
              Detalii Generale
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground font-medium">Titlul Anunțului</Label>
                  <Input
                    id="title"
                    placeholder="ex: Volkswagen Golf 7"
                    value={fields.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground font-medium">Status</Label>
                  {initialStatus === "AVAILABLE" || initialStatus === "INCOMING" ? (
                    <Select value={fields.status} onValueChange={(val) => handleFieldChange("status", val)}>
                      <SelectTrigger className="bg-background border-border focus:border-primary">
                        <SelectValue placeholder="Alege status" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {getOptions(STATUS_LABELS, ["AVAILABLE", "INCOMING"] as const).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {STATUS_LABELS[fields.status as ListingStatusType] || fields.status}
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        Statusul se schimbă din acțiunile de pe fișa mașinii.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice" className="text-foreground font-medium">Preț Achiziție (€)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    placeholder="ex: 12000"
                    value={fields.purchasePrice}
                    onChange={(e) => handleFieldChange("purchasePrice", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCosts" className="text-foreground font-medium">Alte Costuri/Reparații (€)</Label>
                  <Input
                    id="otherCosts"
                    type="number"
                    placeholder="ex: 350"
                    value={fields.otherCosts}
                    onChange={(e) => handleFieldChange("otherCosts", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-foreground font-medium">Preț Vânzare (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="ex: 14500"
                    value={fields.price}
                    onChange={(e) => handleFieldChange("price", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-foreground font-medium">Descriere Publică</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenMarketing}
                      className="h-8 bg-background border-border text-foreground hover:bg-secondary flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Generează marketing</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={isGenerating}
                      className="h-8 bg-background border-border text-foreground hover:bg-secondary flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Se generează...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span>Generează descriere</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="description"
                  placeholder="Introdu o descriere detaliată a mașinii"
                  value={fields.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  className="bg-background border-border focus:border-primary min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="internalNotes" className="text-foreground font-medium">Notițe Private (Admin Only)</Label>
                <Textarea
                  id="internalNotes"
                  placeholder="Observații private (negociere, defecte nespecificate public etc.)"
                  value={fields.internalNotes}
                  onChange={(e) => handleFieldChange("internalNotes", e.target.value)}
                  className="bg-background border-border focus:border-primary min-h-[80px]"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* SECȚIUNEA 2: IDENTITATE */}
          <AccordionItem value="identitate" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline py-4">
              Identitate Vehicul
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 flex flex-col justify-end">
                  <Label className="text-foreground font-medium mb-1">Marcă</Label>
                  <Popover open={makeSearchOpen} onOpenChange={setMakeSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={makeSearchOpen}
                        className="w-full justify-between bg-background border-border text-foreground hover:bg-secondary font-normal"
                      >
                        {fields.makeId
                          ? makes.find((m) => m.id === fields.makeId)?.name || "Selectează marca"
                          : "Selectează marca"}
                        <span className="ml-2 h-4 w-4 shrink-0 opacity-50">▼</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-popover border-border z-[100]">
                      <Command>
                        <CommandInput placeholder="Căutare marcă..." className="border-none focus:ring-0" />
                        <CommandList className="max-h-[300px] overflow-y-auto">
                          <CommandEmpty>Nu s-a găsit nicio marcă.</CommandEmpty>
                          <CommandGroup>
                            {makes.map((make) => (
                              <CommandItem
                                key={make.id}
                                value={make.name}
                                onSelect={() => {
                                  handleMakeChange(make.id);
                                  setMakeSearchOpen(false);
                                }}
                                className="text-foreground hover:bg-secondary cursor-pointer flex items-center justify-between p-2"
                              >
                                <span>{make.name}</span>
                                {fields.makeId === make.id && <Check className="h-4 w-4 text-primary" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <Label className="text-foreground font-medium mb-1">Model</Label>
                  <Popover open={modelSearchOpen} onOpenChange={setModelSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={modelSearchOpen}
                        disabled={!fields.makeId}
                        className="w-full justify-between bg-background border-border text-foreground hover:bg-secondary font-normal disabled:opacity-50"
                      >
                        {fields.modelId
                          ? models.find((m) => m.id === fields.modelId)?.name || "Selectează modelul"
                          : "Selectează modelul"}
                        <span className="ml-2 h-4 w-4 shrink-0 opacity-50">▼</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-popover border-border z-[100]">
                      <Command>
                        <CommandInput placeholder="Căutare model..." className="border-none focus:ring-0" />
                        <CommandList className="max-h-[300px] overflow-y-auto">
                          <CommandEmpty>Nu s-a găsit niciun model.</CommandEmpty>
                          <CommandGroup>
                            {models.map((model) => (
                              <CommandItem
                                key={model.id}
                                value={model.name}
                                onSelect={() => {
                                  handleFieldChange("modelId", model.id);
                                  setModelSearchOpen(false);
                                }}
                                className="text-foreground hover:bg-secondary cursor-pointer flex items-center justify-between p-2"
                              >
                                <span>{model.name}</span>
                                {fields.modelId === model.id && <Check className="h-4 w-4 text-primary" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variant" className="text-foreground font-medium">Variantă / Motorizare</Label>
                  <Input
                    id="variant"
                    placeholder="ex: 2.0 TDI BlueMotion"
                    value={fields.variant}
                    onChange={(e) => handleFieldChange("variant", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-foreground font-medium">An Fabricație</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="ex: 2018"
                    value={fields.year}
                    onChange={(e) => handleFieldChange("year", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage" className="text-foreground font-medium">Kilometraj (km)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="ex: 145000"
                    value={fields.mileage}
                    onChange={(e) => handleFieldChange("mileage", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin" className="text-foreground font-medium">Serie Șasiu (VIN)</Label>
                  <Input
                    id="vin"
                    placeholder="ex: WVWZZZ1JZ..."
                    value={fields.vin}
                    onChange={(e) => handleFieldChange("vin", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-2">
                  <Label htmlFor="firstRegistrationAt" className="text-foreground font-medium">Data primei înmatriculări</Label>
                  <Input
                    id="firstRegistrationAt"
                    type="date"
                    value={fields.firstRegistrationAt}
                    onChange={(e) => handleFieldChange("firstRegistrationAt", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryOfOrigin" className="text-foreground font-medium">Țară Origine (2 litere)</Label>
                  <Input
                    id="countryOfOrigin"
                    placeholder="ex: DE"
                    maxLength={2}
                    value={fields.countryOfOrigin}
                    onChange={(e) => handleFieldChange("countryOfOrigin", e.target.value.toUpperCase())}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <button
                    type="button"
                    onClick={() => handleFieldChange("registeredInRo", !fields.registeredInRo)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      fields.registeredInRo
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary-hover'
                        : 'bg-background text-foreground border-border hover:border-primary hover:bg-secondary'
                    }`}
                  >
                    {fields.registeredInRo ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
                    <span>Înmatriculat în România</span>
                  </button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* SECȚIUNEA 3: DETALII TEHNICE */}
          <AccordionItem value="tehnic" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline py-4">
              Specificații Tehnic-Mecanice
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Combustibil</Label>
                  <Select value={fields.fuelType} onValueChange={(val) => handleFieldChange("fuelType", val)}>
                    <SelectTrigger className="bg-background border-border focus:border-primary">
                      <SelectValue placeholder="Alege combustibil" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getOptions(FUEL_TYPE_LABELS, FUEL_TYPES).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Cutie de Viteze</Label>
                  <Select value={fields.gearbox} onValueChange={(val) => handleFieldChange("gearbox", val)}>
                    <SelectTrigger className="bg-background border-border focus:border-primary">
                      <SelectValue placeholder="Alege transmisie" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getOptions(GEARBOX_LABELS, GEARBOX_TYPES).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Tracțiune</Label>
                  <Select value={fields.drivetrain} onValueChange={(val) => handleFieldChange("drivetrain", val)}>
                    <SelectTrigger className="bg-background border-border focus:border-primary">
                      <SelectValue placeholder="Alege tracțiune" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getOptions(DRIVETRAIN_LABELS, DRIVETRAINS).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Tip Caroserie</Label>
                  <Select value={fields.bodyType} onValueChange={(val) => handleFieldChange("bodyType", val)}>
                    <SelectTrigger className="bg-background border-border focus:border-primary">
                      <SelectValue placeholder="Alege caroserie" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getOptions(BODY_TYPE_LABELS, BODY_TYPES).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engineCapacity" className="text-foreground font-medium">Capacitate Cilindrică (cm³)</Label>
                  <Input
                    id="engineCapacity"
                    type="number"
                    placeholder="ex: 1998"
                    value={fields.engineCapacity}
                    onChange={(e) => handleFieldChange("engineCapacity", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="powerHp" className="text-foreground font-medium">Putere (CP)</Label>
                  <Input
                    id="powerHp"
                    type="number"
                    placeholder="ex: 150"
                    value={fields.powerHp}
                    onChange={(e) => handleFieldChange("powerHp", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Normă Poluare</Label>
                  <Select value={fields.pollutionNorm} onValueChange={(val) => handleFieldChange("pollutionNorm", val)}>
                    <SelectTrigger className="bg-background border-border focus:border-primary">
                      <SelectValue placeholder="Alege norma" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getOptions(POLLUTION_NORM_LABELS, POLLUTION_NORMS).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="co2Emissions" className="text-foreground font-medium">Emisii CO2 (g/km)</Label>
                  <Input
                    id="co2Emissions"
                    type="number"
                    placeholder="ex: 119"
                    value={fields.co2Emissions}
                    onChange={(e) => handleFieldChange("co2Emissions", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Culoare</Label>
                  <Select value={fields.color} onValueChange={(val) => handleFieldChange("color", val)}>
                    <SelectTrigger className="bg-background border-border focus:border-primary">
                      <SelectValue placeholder="Alege culoare" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getOptions(COLOR_LABELS, COLORS).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="colorDetail" className="text-foreground font-medium">Detaliu Culoare</Label>
                  <Input
                    id="colorDetail"
                    placeholder="ex: Negru Metalizat Pearl"
                    value={fields.colorDetail}
                    onChange={(e) => handleFieldChange("colorDetail", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Tapițerie</Label>
                  <Select value={fields.upholstery} onValueChange={(val) => handleFieldChange("upholstery", val)}>
                    <SelectTrigger className="bg-background border-border focus:border-primary">
                      <SelectValue placeholder="Alege tapițerie" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getOptions(UPHOLSTERY_LABELS, UPHOLSTERIES).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Climatizare</Label>
                  <Select value={fields.airConditioning} onValueChange={(val) => handleFieldChange("airConditioning", val)}>
                    <SelectTrigger className="bg-background border-border focus:border-primary">
                      <SelectValue placeholder="Alege climatizare" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getOptions(AIR_CONDITIONING_LABELS, AIR_CONDITIONINGS).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="doors" className="text-foreground font-medium">Număr Portiere</Label>
                  <Input
                    id="doors"
                    type="number"
                    placeholder="ex: 5"
                    value={fields.doors}
                    onChange={(e) => handleFieldChange("doors", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seats" className="text-foreground font-medium">Număr Locuri</Label>
                  <Input
                    id="seats"
                    type="number"
                    placeholder="ex: 5"
                    value={fields.seats}
                    onChange={(e) => handleFieldChange("seats", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* SECȚIUNEA 4: ISTORIC & COMERCIAL */}
          <AccordionItem value="istoric" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline py-4">
              Istoric, Stare & Garanție
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => handleFieldChange("vatDeductible", !fields.vatDeductible)}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                    fields.vatDeductible
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary-hover'
                      : 'bg-background text-foreground border-border hover:border-primary hover:bg-secondary'
                  }`}
                >
                  {fields.vatDeductible ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
                  <span>TVA Deductibil</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFieldChange("noAccidents", !fields.noAccidents)}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                    fields.noAccidents
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary-hover'
                      : 'bg-background text-foreground border-border hover:border-primary hover:bg-secondary'
                  }`}
                >
                  {fields.noAccidents ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
                  <span>Fără Accidente în Istoric</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFieldChange("serviceBook", !fields.serviceBook)}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                    fields.serviceBook
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary-hover'
                      : 'bg-background text-foreground border-border hover:border-primary hover:bg-secondary'
                  }`}
                >
                  {fields.serviceBook ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
                  <span>Carte Service</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFieldChange("firstOwner", !fields.firstOwner)}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                    fields.firstOwner
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary-hover'
                      : 'bg-background text-foreground border-border hover:border-primary hover:bg-secondary'
                  }`}
                >
                  {fields.firstOwner ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
                  <span>Primul Proprietar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="ownerCount" className="text-foreground font-medium">Număr proprietari anteriori</Label>
                  <Input
                    id="ownerCount"
                    type="number"
                    placeholder="ex: 1"
                    value={fields.ownerCount}
                    onChange={(e) => handleFieldChange("ownerCount", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyMonths" className="text-foreground font-medium">Garanție Dealership (luni)</Label>
                  <Input
                    id="warrantyMonths"
                    type="number"
                    placeholder="ex: 12"
                    value={fields.warrantyMonths}
                    onChange={(e) => handleFieldChange("warrantyMonths", e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* SECȚIUNEA 5: DOTĂRI (CHIPS GROUPED) */}
          <AccordionItem value="dotari" className="border border-border rounded-lg bg-card px-4">
            <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline py-4">
              Dotări & Opționale
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-2">
              {features && Object.keys(features).length > 0 ? (
                Object.entries(features).map(([groupName, groupFeatures]) => (
                  <div key={groupName} className="space-y-2">
                    <h4 className="font-semibold text-primary text-xs uppercase tracking-wider border-b border-border pb-1 mb-3">
                      {groupName}
                    </h4>
                    <div className="flex flex-wrap gap-2 pb-4">
                      {groupFeatures.map((feat: any) => {
                        const isActive = selectedFeatures.includes(feat.id);
                        return (
                          <button
                            key={feat.id}
                            type="button"
                            onClick={() => handleFeatureToggle(feat.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                              isActive
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary-hover'
                                : 'bg-background text-foreground border-border hover:border-primary hover:bg-secondary'
                            }`}
                          >
                            {isActive ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 opacity-60" />
                            )}
                            <span>{feat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Se încarcă lista dotărilor sau nu există dotări disponibile.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* IMAGES CARD */}
        <Card className="border-card-border bg-card my-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Fotografii Anunț</CardTitle>
            {isEditing && existingImages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="border-border hover:bg-secondary"
              >
                {isZipping ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4 mr-2" />
                )}
                {isZipping ? 'Se descarcă...' : 'Descarcă poze (ZIP)'}
              </Button>
            )}
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

        {isEditing && listingId && (
          <AutovitPublishPanel 
            listingId={listingId}
          />
        )}

        {/* VIDEO CARD */}
        {hasVideoFeature && (
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
                        {youtubeVideoId.includes('cloudinary') ? (
                            <video src={youtubeVideoId} controls className="w-full rounded-lg" />
                        ) : (
                            <div className="aspect-video rounded-lg overflow-hidden border bg-black">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen>
                                </iframe>
                            </div>
                        )}
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
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row-reverse justify-start space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse mt-6">
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

        <AlertDialog open={overwriteDialogOpen} onOpenChange={setOverwriteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suprascrii descrierea existentă?</AlertDialogTitle>
              <AlertDialogDescription>
                Câmpul de descriere conține deja text. Generarea unei descrieri noi va înlocui complet textul actual.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulează</AlertDialogCancel>
              <AlertDialogAction onClick={runGenerateDescription}>Suprascrie și generează</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <MarketingModal
          isOpen={isMarketingModalOpen}
          onClose={() => setIsMarketingModalOpen(false)}
          listingPayload={{ ...fields, featureIds: selectedFeatures }}
        />
      </form>
    </div>
  );
};

export default AddEditListing;
