import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, Plus, User, Download, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api, { getContracts, createContract, getContract, updateHandover, ContractListItem } from "@/services/api";
import { roCount } from "@/lib/plural";
import PickCarSheet from "@/components/modals/PickCarSheet";
import GenerateContractModal, { ContractFormData } from "@/components/modals/GenerateContractModal";
import HandoverModal from "@/components/modals/HandoverModal";
import { PrintableContract } from "@/components/contracts/PrintableContract";
import { PrintablePV } from "@/components/contracts/PrintablePV";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function elementToPdf(elementId: string, filename: string, okMsg: string) {
  await sleep(500);
  const el = document.getElementById(elementId);
  if (!el) { toast.error("A apărut o eroare la generarea PDF-ului."); return; }
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pw / canvas.width, ph / canvas.height);
  pdf.addImage(imgData, "PNG", (pw - canvas.width * ratio) / 2, 0, canvas.width * ratio, canvas.height * ratio);
  pdf.save(filename);
  toast.success(okMsg);
}

export default function ContractsPage() {
  const queryClient = useQueryClient();
  const [businessSettings, setBusinessSettings] = useState<any | null>(null);

  const { data: contracts = [], isLoading } = useQuery<ContractListItem[]>({
    queryKey: ["contracts"],
    queryFn: getContracts,
    refetchOnWindowFocus: false,
  });

  const [pickOpen, setPickOpen] = useState(false);
  const [genListing, setGenListing] = useState<any | null>(null);
  const [genOpen, setGenOpen] = useState(false);

  const [contractPdf, setContractPdf] = useState<null | { listing: any; contract: any; filename: string }>(null);
  const [pvModal, setPvModal] = useState<null | { id: string; contractNumber: number }>(null);
  const [pvOpen, setPvOpen] = useState(false);
  const [pvPdf, setPvPdf] = useState<null | { contract: any; handover: any }>(null);

  useEffect(() => {
    api.get("/business/me").then((r) => setBusinessSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!contractPdf) return;
    (async () => {
      try { await elementToPdf("offscreen-contract", contractPdf.filename, "Contract descărcat."); }
      catch (e) { console.error(e); toast.error("Eroare la generarea contractului."); }
      finally { setContractPdf(null); }
    })();
  }, [contractPdf]);

  useEffect(() => {
    if (!pvPdf) return;
    (async () => {
      try { await elementToPdf("offscreen-pv", "PV-Contract-" + pvPdf.contract.contractNumber + ".pdf", "Proces-verbal descărcat."); }
      catch (e) { console.error(e); toast.error("Eroare la generarea PV-ului."); }
      finally { setPvPdf(null); }
    })();
  }, [pvPdf]);

  const dePredat = contracts.filter((c) => !c.handoverDate);
  const finalizate = contracts.filter((c) => c.handoverDate);

  const handlePick = (listing: any) => {
    setPickOpen(false);
    setGenListing(listing);
    setGenOpen(true);
  };

  const handleGenerate = async (form: ContractFormData) => {
    if (!genListing) return;
    try {
      const created = await createContract({
        listingId: genListing.id,
        buyerType: form.buyerType,
        buyerName: form.buyerName,
        buyerAddress: form.buyerAddress || undefined,
        buyerPhone: form.buyerPhone || undefined,
        buyerEmail: form.buyerEmail || undefined,
        buyerCnp: form.buyerCnp || undefined,
        buyerCiSeries: form.buyerCiSeries || undefined,
        buyerCiNumber: form.buyerCiNumber || undefined,
        buyerCui: form.buyerCui || undefined,
        buyerRegCom: form.buyerRegCom || undefined,
        buyerLegalRep: form.buyerLegalRep || undefined,
        salePrice: form.salePrice,
        saleDate: form.saleDate,
        plateNumber: form.plateNumber || undefined,
        mileageAtSale: form.mileageAtSale,
        clauses: form.clauses || undefined,
      });
      const buyerClean = (form.buyerName || "client").replace(/[\/\\\s]+/g, "-");
      setContractPdf({
        listing: genListing,
        contract: {
          buyerType: form.buyerType, buyerName: form.buyerName, buyerAddress: form.buyerAddress,
          buyerPhone: form.buyerPhone, buyerEmail: form.buyerEmail, buyerCnp: form.buyerCnp,
          buyerCiSeries: form.buyerCiSeries, buyerCiNumber: form.buyerCiNumber, buyerCui: form.buyerCui,
          buyerRegCom: form.buyerRegCom, buyerLegalRep: form.buyerLegalRep, salePrice: form.salePrice,
          saleDate: form.saleDate, plateNumber: form.plateNumber, mileageAtSale: form.mileageAtSale,
          clauses: form.clauses, contractNumber: created.contractNumber,
        },
        filename: "Contract-" + created.contractNumber + "-" + buyerClean + ".pdf",
      });
      toast.success("Contract #" + created.contractNumber + " salvat. Se generează PDF-ul...");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Nu s-a putut salva contractul.");
    }
  };

  const handleReprint = async (row: ContractListItem) => {
    try {
      const full: any = await getContract(row.id);
      const v = full.vehicleSnapshot || {};
      const b = full.buyerSnapshot || {};
      const buyerClean = (b.name || "client").replace(/[\/\\\s]+/g, "-");
      setContractPdf({
        listing: { title: v.title, make: { name: v.make }, model: { name: v.model }, variant: v.variant, year: v.year, vin: v.vin, colorDetail: v.color, mileage: v.mileage },
        contract: {
          buyerType: b.type, buyerName: b.name, buyerAddress: b.address, buyerPhone: b.phone, buyerEmail: b.email,
          buyerCnp: b.cnp, buyerCiSeries: b.ciSeries, buyerCiNumber: b.ciNumber, buyerCui: b.cui, buyerRegCom: b.regCom,
          buyerLegalRep: b.legalRep, salePrice: full.salePrice, saleDate: full.saleDate, plateNumber: full.plateNumber,
          mileageAtSale: full.mileageAtSale, clauses: full.clauses, contractNumber: full.contractNumber,
        },
        filename: "Contract-" + full.contractNumber + "-" + buyerClean + ".pdf",
      });
    } catch (e) {
      console.error(e);
      toast.error("Nu s-a putut încărca contractul.");
    }
  };

  const openHandover = (row: ContractListItem) => {
    setPvModal({ id: row.id, contractNumber: row.contractNumber });
    setPvOpen(true);
  };

  const handlePvSubmit = async (data: any) => {
    if (!pvModal) return;
    try {
      await updateHandover(pvModal.id, {
        handoverDate: data.handoverDate,
        handoverMileage: data.handoverMileage ?? null,
        handoverNotes: data.handoverNotes || null,
        handoverItems: {
          carteIdentitate: data.itemCarteIdentitate,
          talon: data.itemTalon,
          cheiRezerva: data.itemCheiRezerva,
          roataRezerva: data.itemRoataRezerva,
          setCauciucuri: data.itemSetCauciucuri,
        },
      });
      const full: any = await getContract(pvModal.id);
      setPvPdf({
        contract: full,
        handover: {
          handoverDate: data.handoverDate,
          handoverMileage: data.handoverMileage,
          items: {
            carteIdentitate: data.itemCarteIdentitate,
            talon: data.itemTalon,
            cheiRezerva: data.itemCheiRezerva,
            roataRezerva: data.itemRoataRezerva,
            setCauciucuri: data.itemSetCauciucuri,
          },
          notes: data.handoverNotes,
        },
      });
      toast.success("Predare salvată. Se generează PV-ul...");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    } catch (e) {
      console.error(e);
      toast.error("Nu s-a putut salva predarea.");
    }
  };

  const handleViewPv = async (row: ContractListItem) => {
    try {
      const full: any = await getContract(row.id);
      const items = full.handoverItems || {};
      setPvPdf({
        contract: full,
        handover: {
          handoverDate: full.handoverDate,
          handoverMileage: full.handoverMileage,
          items: items,
          notes: full.handoverNotes,
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Nu s-a putut încărca PV-ul.");
    }
  };

  const priceFmt = (n: number) => new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(n || 0) + " €";

  const renderCard = (c: ContractListItem, done: boolean) => {
    const v: any = c.vehicleSnapshot || {};
    return (
      <div key={c.id} className="bg-card border border-border rounded-xl p-3.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-medium text-muted-foreground bg-muted rounded-md px-1.5 py-0.5 shrink-0">#{c.contractNumber}</span>
            <span className="text-[16px] font-semibold text-foreground truncate">{v.title || "Mașină"}</span>
          </div>
          {done ? (
            <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-success/15 text-success whitespace-nowrap">Predat</span>
          ) : (
            <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-warning-light text-warning whitespace-nowrap">Fără predare</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[14px] text-muted-foreground">
          <User className="w-4 h-4 shrink-0" />
          <span className="text-foreground truncate">{c.buyer?.name || "Cumpărător"}</span>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
            {c.buyer?.type === "INDIVIDUAL" ? "PF" : "PJ"}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-[18px] font-semibold text-foreground">{priceFmt(c.salePrice)}</span>
          <span className="text-[12px] text-muted-foreground ml-auto">{format(new Date(c.saleDate), "dd MMM yyyy", { locale: ro })}</span>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => handleReprint(c)} className="flex-1 h-10 rounded-lg border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50 inline-flex items-center justify-center gap-1.5">
            <Download className="w-4 h-4" /> Contract
          </button>
          {done ? (
            <button onClick={() => handleViewPv(c)} className="flex-1 h-10 rounded-lg border border-border bg-card text-muted-foreground text-[14px] font-medium hover:bg-accent/50 inline-flex items-center justify-center gap-1.5">
              <ClipboardCheck className="w-4 h-4" /> Vezi PV
            </button>
          ) : (
            <button onClick={() => openHandover(c)} className="flex-1 h-10 rounded-lg border border-primary/40 bg-primary/5 text-primary text-[14px] font-medium hover:bg-primary/10 inline-flex items-center justify-center gap-1.5">
              <ClipboardCheck className="w-4 h-4" /> Predare
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-[390px] mx-auto md:max-w-full pb-24">
      <div className="px-1 pt-1">
        <Link to="/listings" className="inline-flex items-center text-[13px] text-primary hover:underline mb-1">
          ← Toate categoriile
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Contracte</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {dePredat.length > 0 ? roCount(dePredat.length, "de predat", "de predat") : "Contracte și procese-verbale"}
        </p>
      </div>

      <div className="px-1">
        <button onClick={() => setPickOpen(true)} className="flex items-center gap-3 w-full min-h-[60px] py-4 px-4 bg-primary/5 border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-primary bg-primary/10">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-[16px] font-semibold text-foreground leading-snug">Contract nou</div>
            <div className="text-[13px] text-muted-foreground leading-none mt-0.5">Alegi mașina, apoi cumpărătorul</div>
          </div>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-1">
          <FileText className="w-12 h-12 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-[15px] font-medium text-foreground">Niciun contract încă</h3>
          <p className="text-xs text-muted-foreground mt-1">Apasă „Contract nou" ca să generezi primul contract.</p>
        </div>
      ) : (
        <>
          {dePredat.length > 0 && (
            <div className="px-1">
              <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground mb-2">De predat</p>
              <div className="flex flex-col gap-2.5">{dePredat.map((c) => renderCard(c, false))}</div>
            </div>
          )}
          {finalizate.length > 0 && (
            <div className="px-1">
              <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground mb-2 mt-2">Finalizate</p>
              <div className="flex flex-col gap-2.5">{finalizate.map((c) => renderCard(c, true))}</div>
            </div>
          )}
        </>
      )}

      <PickCarSheet isOpen={pickOpen} onClose={() => setPickOpen(false)} onPick={handlePick} statuses={["AVAILABLE", "RESERVED"]} />

      <GenerateContractModal
        isOpen={genOpen}
        onClose={() => { setGenOpen(false); setGenListing(null); }}
        listing={genListing}
        onGenerate={handleGenerate}
      />

      <HandoverModal
        isOpen={pvOpen}
        onClose={() => { setPvOpen(false); setPvModal(null); }}
        contract={pvModal}
        onSubmit={handlePvSubmit}
      />

      <div style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1 }}>
        <div id="offscreen-contract">
          {contractPdf && (
            <PrintableContract listing={contractPdf.listing} business={businessSettings} contract={contractPdf.contract} />
          )}
        </div>
        <div id="offscreen-pv">
          {pvPdf && (
            <PrintablePV business={businessSettings} contract={pvPdf.contract} handover={pvPdf.handover} />
          )}
        </div>
      </div>
    </div>
  );
}
