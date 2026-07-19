import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, ClipboardCheck, MoreHorizontal, Download } from "lucide-react";
import { format } from "date-fns";
import api, { getContracts, ContractListItem, getContract, updateHandover } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PrintableContract } from "@/components/contracts/PrintableContract";
import { PrintablePV } from "@/components/contracts/PrintablePV";
import HandoverModal from "@/components/modals/HandoverModal";

const ContractsPage = () => {
  const queryClient = useQueryClient();
  const [businessSettings, setBusinessSettings] = useState<any | null>(null);
  
  const [reprintData, setReprintData] = useState<any | null>(null);
  const [pvModalContract, setPvModalContract] = useState<{ id: string; contractNumber: number } | null>(null);
  const [pvModalOpen, setPvModalOpen] = useState(false);
  const [pvRenderData, setPvRenderData] = useState<null | { contract: any; handover: any }>(null);

  const { data: contracts = [], isLoading } = useQuery<ContractListItem[]>({
    queryKey: ['contracts'],
    queryFn: getContracts,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await api.get('/business/me');
        setBusinessSettings(response.data);
      } catch (error) {
        console.error("Failed to fetch business settings.");
      }
    };
    fetchBusinessSettings();
  }, []);

  const handleReprint = async (row: ContractListItem) => {
    try {
      const full = await getContract(row.id);
      setReprintData(full);
      toast.loading(`Se încarcă contractul #${row.contractNumber}...`, { id: "reprint-toast", duration: 1500 });
    } catch (e) {
      console.error(e); 
      toast.error("Nu s-a putut încărca contractul.");
    }
  };

  const handleGeneratePV = (row: ContractListItem) => {
    setPvModalContract({ id: row.id, contractNumber: row.contractNumber });
    setPvModalOpen(true);
  };

  const handlePvSubmit = async (data: any) => {
    if (!pvModalContract) return;
    try {
      await updateHandover(pvModalContract.id, {
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
      const full = await getContract(pvModalContract.id);
      setPvRenderData({
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
      toast.success("PV salvat. Se generează PDF-ul...");
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    } catch (e) {
      console.error(e); 
      toast.error("Nu s-a putut salva PV-ul.");
    }
  };

  // useEffect for contract reprint
  useEffect(() => {
    if (reprintData) {
      const generateReprintPdf = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const element = document.getElementById('offscreen-contract-reprint');
        if (!element) {
          toast.error("A apărut o eroare la generarea contractului.");
          setReprintData(null);
          return;
        }

        try {
          const canvas = await html2canvas(element, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;

          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          
          const buyerNameClean = (reprintData.buyerSnapshot?.name || 'client').replace(/[\/\\\s]+/g, '-');
          pdf.save(`Contract-${reprintData.contractNumber}-${buyerNameClean}.pdf`);
          toast.success(`Contract #${reprintData.contractNumber} descărcat.`);
        } catch (error) {
          console.error("Eroare la generarea contractului:", error);
          toast.error("A apărut o eroare la generarea PDF-ului.");
        } finally {
          setReprintData(null);
        }
      };
      generateReprintPdf();
    }
  }, [reprintData]);

  // useEffect for PV generation
  useEffect(() => {
    if (pvRenderData) {
      const generatePvPdf = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const element = document.getElementById('offscreen-pv');
        if (!element) {
          toast.error("A apărut o eroare la generarea procesului verbal.");
          setPvRenderData(null);
          return;
        }

        try {
          const canvas = await html2canvas(element, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;

          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          
          pdf.save(`PV-Contract-${pvRenderData.contract.contractNumber}.pdf`);
          toast.success("Proces verbal descărcat.");
        } catch (error) {
          console.error("Eroare la generarea procesului verbal:", error);
          toast.error("A apărut o eroare la generarea PDF-ului.");
        } finally {
          setPvRenderData(null);
        }
      };
      generatePvPdf();
    }
  }, [pvRenderData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contracte</h1>
        <p className="text-muted-foreground mt-2">
          Toate contractele de vânzare-cumpărare generate.
        </p>
      </div>

      <Card className="border-card-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Listă Contracte</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Se încarcă contractele...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">Niciun contract generat încă</h3>
              <p className="text-sm">Când vei genera un contract din detalii mașină, acesta va apărea aici.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium">Nr.</TableHead>
                    <TableHead className="text-foreground font-medium">Cumpărător</TableHead>
                    <TableHead className="text-foreground font-medium">Mașină</TableHead>
                    <TableHead className="text-foreground font-medium">Preț</TableHead>
                    <TableHead className="text-foreground font-medium">Data</TableHead>
                    <TableHead className="text-foreground font-medium">Status PV</TableHead>
                    <TableHead className="text-foreground font-medium text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id} className="border-border">
                      <TableCell className="font-semibold text-foreground">
                        #{contract.contractNumber}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{contract.buyer?.name || 'Cumpărător necunoscut'}</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 font-medium">
                            {contract.buyer?.type === 'INDIVIDUAL' ? 'PF' : 'PJ'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contract.vehicleSnapshot?.title || 'Vehicul necunoscut'}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(contract.salePrice)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(contract.saleDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {contract.handoverDate ? (
                          <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/20">
                            PV generat
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                            Fără PV
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Deschide meniu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem
                              onClick={() => handleReprint(contract)}
                              className="cursor-pointer"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              <span>Descarcă contract</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleGeneratePV(contract)}
                              className="cursor-pointer"
                            >
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              <span>Generează PV</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <HandoverModal
        isOpen={pvModalOpen}
        onClose={() => { setPvModalOpen(false); setPvModalContract(null); }}
        contract={pvModalContract}
        onSubmit={handlePvSubmit}
      />

      <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
        <div id="offscreen-contract-reprint">
          {reprintData && (() => {
            const v = reprintData.vehicleSnapshot || {};
            const b = reprintData.buyerSnapshot || {};
            const listingLike = { title: v.title, make: { name: v.make }, model: { name: v.model }, variant: v.variant, year: v.year, vin: v.vin, colorDetail: v.color, mileage: v.mileage };
            const contractProp = {
              buyerType: b.type, buyerName: b.name, buyerAddress: b.address, buyerPhone: b.phone, buyerEmail: b.email,
              buyerCnp: b.cnp, buyerCiSeries: b.ciSeries, buyerCiNumber: b.ciNumber, buyerCui: b.cui, buyerRegCom: b.regCom, buyerLegalRep: b.legalRep,
              salePrice: reprintData.salePrice, saleDate: reprintData.saleDate, plateNumber: reprintData.plateNumber,
              mileageAtSale: reprintData.mileageAtSale, clauses: reprintData.clauses, contractNumber: reprintData.contractNumber,
            };
            return <PrintableContract listing={listingLike} business={businessSettings} contract={contractProp} />;
          })()}
        </div>
        <div id="offscreen-pv">
          {pvRenderData && (
            <PrintablePV business={businessSettings} contract={pvRenderData.contract} handover={pvRenderData.handover} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
