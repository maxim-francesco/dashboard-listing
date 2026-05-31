
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Image as ImageIcon, Trash2, Save, Link as LinkIcon, Copy } from "lucide-react";
import api, { deleteBanner } from "@/services/api";
import { toast } from "react-hot-toast";

interface Business {
  id: string;
  name: string;
  bannerUrl: string | null;
  listingUrlPattern: string | null;
}

const BusinessSettings = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [listingUrlPattern, setListingUrlPattern] = useState("");


  const fetchBusinessDetails = async () => {
    try {
      const response = await api.get("/business/me");
      setBusiness(response.data);
      setListingUrlPattern(response.data.listingUrlPattern || "");
    } catch (error) {
      toast.error("Nu s-au putut încărca detaliile afacerii.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessDetails();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Te rugăm să selectezi mai întâi o imagine.");
      return;
    }

    const formData = new FormData();
    formData.append('banner', selectedFile);
    setIsUploading(true);

    const promise = api.post('/business/upload-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    toast.promise(promise, {
      loading: 'Se încarcă șablonul...',
      success: (response) => {
        setBusiness(response.data);
        setListingUrlPattern(response.data.listingUrlPattern || "");
        setSelectedFile(null);
        setIsUploading(false);
        return 'Șablonul a fost actualizat cu succes!';
      },
      error: (err) => {
        setIsUploading(false);
        return 'A apărut o eroare la încărcarea șablonului.';
      }
    });
  };

  const handleDeleteBanner = async () => {
    if (!window.confirm("Ești sigur că vrei să ștergi șablonul? Această acțiune este ireversibilă.")) {
      return;
    }

    const promise = deleteBanner();

    toast.promise(promise, {
      loading: 'Se șterge șablonul...',
      success: () => {
        setBusiness(prev => prev ? { ...prev, bannerUrl: null } : null);
        return 'Șablonul a fost șters cu succes!';
      },
      error: () => {
        return 'A apărut o eroare la ștergerea șablonului.';
      }
    });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const promise = api.put('/business/settings', { listingUrlPattern });

    toast.promise(promise, {
      loading: 'Se salvează setările...',
      success: (response) => {
        setBusiness(response.data);
        setListingUrlPattern(response.data.listingUrlPattern || "");
        setIsSavingSettings(false);
        return 'Setările au fost salvate cu succes!';
      },
      error: () => {
        setIsSavingSettings(false);
        return 'A apărut o eroare la salvarea setărilor.';
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Se încarcă setările...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Setări Afacere</h1>
        <p className="text-muted-foreground mt-2">
          Personalizează aspectul paginii publice a afacerii tale.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Șablon Anunț</CardTitle>
          <CardDescription>
            Încarcă o imagine de fundal (banner) care va fi afișată pe pagina publică a fiecărui anunț.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-foreground font-medium">Previzualizare Șablon Actual</Label>
            <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4 h-64 flex items-center justify-center bg-background">
              {business?.bannerUrl ? (
                <img
                  src={business.bannerUrl}
                  alt="Șablon anunț"
                  className="max-w-full max-h-full object-contain rounded-md"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                  <p>Niciun șablon încărcat.</p>
                </div>
              )}
            </div>
            {business?.bannerUrl && (
              <div className="flex justify-end mt-4">
                <Button variant="destructive" onClick={handleDeleteBanner}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Șterge Șablonul
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-upload" className="text-foreground font-medium">
              Încarcă un Șablon Nou
            </Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                id="banner-upload"
                type="file"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
                className="flex-grow file:text-foreground file:font-medium"
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full sm:w-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se încarcă...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Salvează Șablonul
                  </>
                )}
              </Button>
            </div>
            {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                    Fișier selectat: <span className="font-medium text-foreground">{selectedFile.name}</span>
                </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Configurare Cod QR</CardTitle>
            <CardDescription>Setează modelul URL-ului pentru paginile publice ale anunțurilor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="url-pattern" className="font-medium">Model URL Anunț</Label>
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="url-pattern"
                        value={listingUrlPattern}
                        onChange={(e) => setListingUrlPattern(e.target.value)}
                        placeholder="https://siteul-tau.ro/anunturi/{id}"
                        className="pl-10"
                    />
                </div>
                <p className="text-xs text-muted-foreground">Folosește <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono">{'{id}'}</code> pentru ID sau <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono">{'{slug}'}</code> pentru titlul mașinii.</p>
             </div>
             <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSavingSettings ? 'Se salvează...' : 'Salvează Setările'}
                </Button>
             </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feed Catalog (Facebook / Google)</CardTitle>
          <CardDescription>
            Folosește acest link pentru a sincroniza automat anunțurile active pe Facebook Catalog, Google Merchant Center sau alte platforme de promovare.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feed-url" className="font-medium">Link Feed XML / CSV</Label>
            <div className="flex gap-2">
              <Input
                id="feed-url"
                readOnly
                value={`${api.defaults.baseURL}/public/listings/csv-feed?businessId=${business?.id || ""}`}
                className="bg-muted select-all flex-grow font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(`${api.defaults.baseURL}/public/listings/csv-feed?businessId=${business?.id || ""}`);
                  toast.success("Link copiat în clipboard!");
                }}
                title="Copiază link-ul"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Feed-ul conține automat toate mașinile active (In Stock) cu preț, titlu, descriere, link public și poze, respectând formatul standard de catalog.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessSettings;
