import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Save,
  Link as LinkIcon,
  ArrowLeft,
  Building2,
  QrCode,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api, { deleteBanner } from "@/services/api";
import { toast } from "react-hot-toast";

interface Business {
  id: string;
  name: string;
  bannerUrl: string | null;
  listingUrlPattern: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyAddress?: string | null;
  companyCui?: string | null;
  companyRegCom?: string | null;
  companyLegalRep?: string | null;
}

const BusinessSettings = () => {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [listingUrlPattern, setListingUrlPattern] = useState("");

  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identity, setIdentity] = useState({
    companyPhone: "",
    companyEmail: "",
    companyAddress: "",
    companyCui: "",
    companyRegCom: "",
    companyLegalRep: "",
  });

  const [isIdentityOpen, setIsIdentityOpen] = useState(true);
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/firma");
    }
  };

  const fetchBusinessDetails = async () => {
    try {
      const response = await api.get("/business/me");
      setBusiness(response.data);
      setListingUrlPattern(response.data.listingUrlPattern || "");
      setIdentity({
        companyPhone: response.data.companyPhone || "",
        companyEmail: response.data.companyEmail || "",
        companyAddress: response.data.companyAddress || "",
        companyCui: response.data.companyCui || "",
        companyRegCom: response.data.companyRegCom || "",
        companyLegalRep: response.data.companyLegalRep || "",
      });
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
      error: () => {
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

  const handleSaveIdentity = async () => {
    setIsSavingIdentity(true);
    const promise = api.put('/business/identity', identity);
    toast.promise(promise, {
      loading: 'Se salvează datele firmei...',
      success: (response) => {
        setBusiness(response.data);
        setIsSavingIdentity(false);
        return 'Datele firmei au fost salvate cu succes!';
      },
      error: () => {
        setIsSavingIdentity(false);
        return 'A apărut o eroare la salvarea datelor firmei.';
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
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Înapoi"
          onClick={handleBack}
          className="w-9 h-9 min-h-[44px] min-w-[44px] border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-medium text-foreground leading-tight">
            Setări firmă
          </h1>
          <p className="text-[12px] text-muted-foreground leading-tight mt-0.5">
            Datele și aspectul firmei tale
          </p>
        </div>
      </div>

      {/* SECTION 1: DATE FIRMĂ */}
      <Collapsible
        open={isIdentityOpen}
        onOpenChange={setIsIdentityOpen}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 min-h-[44px] hover:bg-accent/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-[14px] font-medium text-foreground leading-tight">
                  Date firmă
                </h2>
                <p className="text-[12px] text-muted-foreground leading-tight mt-0.5">
                  Contact și date juridice
                </p>
              </div>
            </div>
            {isIdentityOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-3 border-t border-border space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-phone" className="font-medium">Telefon</Label>
                <Input
                  id="company-phone"
                  value={identity.companyPhone}
                  onChange={(e) => setIdentity({ ...identity, companyPhone: e.target.value })}
                  placeholder="0740 123 456"
                  className="min-h-[44px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-email" className="font-medium">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={identity.companyEmail}
                  onChange={(e) => setIdentity({ ...identity, companyEmail: e.target.value })}
                  placeholder="contact@firma.ro"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-address" className="font-medium">Adresă</Label>
                <Input
                  id="company-address"
                  value={identity.companyAddress}
                  onChange={(e) => setIdentity({ ...identity, companyAddress: e.target.value })}
                  placeholder="Str. Exemplu 10, Oraș, Județ"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-cui" className="font-medium">CUI / CIF</Label>
                <Input
                  id="company-cui"
                  value={identity.companyCui}
                  onChange={(e) => setIdentity({ ...identity, companyCui: e.target.value })}
                  placeholder="RO12345678"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-regcom" className="font-medium">Nr. Reg. Comerțului</Label>
                <Input
                  id="company-regcom"
                  value={identity.companyRegCom}
                  onChange={(e) => setIdentity({ ...identity, companyRegCom: e.target.value })}
                  placeholder="J12/345/2020"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-legalrep" className="font-medium">Reprezentant legal</Label>
                <Input
                  id="company-legalrep"
                  value={identity.companyLegalRep}
                  onChange={(e) => setIdentity({ ...identity, companyLegalRep: e.target.value })}
                  placeholder="Nume Prenume"
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveIdentity} disabled={isSavingIdentity} className="min-h-[44px]">
                {isSavingIdentity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSavingIdentity ? 'Se salvează...' : 'Salvează datele firmei'}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* SECTION 2: ȘABLON ANUNȚ */}
      <Collapsible
        open={isBannerOpen}
        onOpenChange={setIsBannerOpen}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 min-h-[44px] hover:bg-accent/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-[14px] font-medium text-foreground leading-tight">
                  Șablon anunț
                </h2>
                <p className="text-[12px] text-muted-foreground leading-tight mt-0.5">
                  Banner pe pagina publică
                </p>
              </div>
            </div>
            {isBannerOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-3 border-t border-border space-y-6">
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
                  <Button variant="destructive" onClick={handleDeleteBanner} className="min-h-[44px]">
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
                  className="flex-grow file:text-foreground file:font-medium min-h-[44px]"
                />
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full sm:w-auto min-h-[44px]"
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
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* SECTION 3: COD QR */}
      <Collapsible
        open={isQrOpen}
        onOpenChange={setIsQrOpen}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 min-h-[44px] hover:bg-accent/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-[14px] font-medium text-foreground leading-tight">
                  Cod QR
                </h2>
                <p className="text-[12px] text-muted-foreground leading-tight mt-0.5">
                  Model URL pentru anunțuri
                </p>
              </div>
            </div>
            {isQrOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-3 border-t border-border space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-pattern" className="font-medium">Model URL Anunț</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input 
                  id="url-pattern"
                  value={listingUrlPattern}
                  onChange={(e) => setListingUrlPattern(e.target.value)}
                  placeholder="https://siteul-tau.ro/anunturi/{id}"
                  className="pl-10 min-h-[44px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">Folosește <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono">{'{id}'}</code> pentru ID sau <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono">{'{slug}'}</code> pentru titlul mașinii.</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="min-h-[44px]">
                {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSavingSettings ? 'Se salvează...' : 'Salvează Setările'}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default BusinessSettings;
