import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, Plus, User, Download, ClipboardCheck, ArrowLeft, Filter } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api, { getContracts, createContract, getContract, updateHandover, ContractListItem } from "@/services/api";
import { roCount } from "@/lib/plural";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import PickCarSheet from "@/components/modals/PickCarSheet";
import GenerateContractModal, { ContractFormData } from "@/components/modals/GenerateContractModal";
import HandoverModal from "@/components/modals/HandoverModal";
import ContractDetailSheet from "@/components/modals/ContractDetailSheet";
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
  const navigate = useNavigate();
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

  const [detailRow, setDetailRow] = useState<ContractListItem | null>(null);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<"DE_PREDAT" | "PREDAT">>(new Set());
  const [carFilter, setCarFilter] = useState<string>("all");

  const hasActiveFilter = statusFilter.size > 0 || carFilter !== "all";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/listings");
    }
  };

  const distinctCars = useMemo(() => {
    const set = new Set<string>();
    contracts.forEach((c) => {
      const t = c.vehicleSnapshot?.title || "Mașină";
      set.add(t);
    });
    return Array.from(set).map((title) => ({ id: title, title }));
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const isDone = !!c.handoverDate;
      let statusMatch = true;
      if (statusFilter.size > 0) {
        statusMatch =
          (statusFilter.has("DE_PREDAT") && !isDone) ||
          (statusFilter.has("PREDAT") && isDone);
      }

      const carTitle = c.vehicleSnapshot?.title || "Mașină";
      const carMatch = carFilter === "all" || carTitle === carFilter;

      return statusMatch && carMatch;
    });
  }, [contracts, statusFilter, carFilter]);

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

  const dePredat = filteredContracts.filter((c) => !c.handoverDate);
  const finalizate = filteredContracts.filter((c) => c.handoverDate);

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
      <div
        key={c.id}
        onClick={() => setDetailRow(c)}
        className="bg-card border border-border rounded-xl p-3.5 cursor-pointer hover:border-border/80 transition-colors"
      >
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReprint(c);
            }}
            className="flex-1 h-11 min-h-[44px] rounded-lg border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50 inline-flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Contract
          </button>
          {done ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleViewPv(c);
              }}
              className="flex-1 h-11 min-h-[44px] rounded-lg border border-border bg-card text-muted-foreground text-[14px] font-medium hover:bg-accent/50 inline-flex items-center justify-center gap-1.5"
            >
              <ClipboardCheck className="w-4 h-4" /> Vezi PV
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openHandover(c);
              }}
              className="flex-1 h-11 min-h-[44px] rounded-lg border border-primary/40 bg-primary/5 text-primary text-[14px] font-medium hover:bg-primary/10 inline-flex items-center justify-center gap-1.5"
            >
              <ClipboardCheck className="w-4 h-4" /> Predare
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-[390px] mx-auto md:max-w-full pb-24">
      {/* HEADER BAR */}
      <div className="flex items-center gap-2.5 px-1 py-1">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Înapoi"
          className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center border border-border rounded-lg text-foreground hover:bg-accent/50 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-medium text-foreground leading-tight">Contracte</h1>
          <p className="text-[12px] text-muted-foreground leading-snug">
            {dePredat.length > 0 ? roCount(dePredat.length, "de predat", "de predat") : "Contracte și procese-verbale"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Filtrează"
          onClick={() => setFilterOpen(true)}
          className={cn(
            "w-9 h-9 min-h-[44px] min-w-[44px] border rounded-lg flex items-center justify-center shrink-0 transition-colors ml-auto",
            hasActiveFilter
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-foreground hover:bg-accent/50"
          )}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="px-1">
        <button
          type="button"
          onClick={() => setPickOpen(true)}
          className="flex items-center gap-3 w-full min-h-[60px] py-4 px-4 bg-primary/5 border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors"
        >
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
      ) : filteredContracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-1">
          <FileText className="w-12 h-12 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-[15px] font-medium text-foreground">Niciun contract pentru acest filtru</h3>
          <p className="text-xs text-muted-foreground mt-1">Încearcă să schimbi starea sau mașina selectată.</p>
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

      {/* FILTER BOTTOM SHEET */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left pb-2 border-b border-border">
            <SheetTitle className="text-[17px] font-semibold text-foreground">
              Filtrează
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-2">Stare</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "DE_PREDAT", label: "De predat" },
                    { value: "PREDAT", label: "Predate" },
                  ] as const
                ).map((item) => {
                  const isSelected = statusFilter.has(item.value);
                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => {
                        setStatusFilter((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.value)) {
                            next.delete(item.value);
                          } else {
                            next.add(item.value);
                          }
                          return next;
                        });
                      }}
                      className={`min-h-[44px] px-3.5 py-2 rounded-full border text-[13px] font-medium transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-2">Mașină</p>
              <select
                value={carFilter}
                onChange={(e) => setCarFilter(e.target.value)}
                className="w-full h-11 min-h-[44px] px-3 bg-card border border-border rounded-xl text-foreground text-[14px] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Toate mașinile</option>
                {distinctCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setStatusFilter(new Set());
                setCarFilter("all");
              }}
              className="flex-1 h-11 min-h-[44px] rounded-xl border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50 transition-colors"
            >
              Resetează
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="flex-1 h-11 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 transition-colors"
            >
              Aplică
            </button>
          </div>
        </SheetContent>
      </Sheet>

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

      <ContractDetailSheet
        row={detailRow}
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        onContract={(r) => {
          setDetailRow(null);
          handleReprint(r);
        }}
        onHandover={(r) => {
          setDetailRow(null);
          openHandover(r);
        }}
        onViewPv={(r) => {
          setDetailRow(null);
          handleViewPv(r);
        }}
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

