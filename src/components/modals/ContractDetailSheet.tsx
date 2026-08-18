import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Download, ClipboardCheck, FileText, ExternalLink, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import api, { ContractListItem } from "@/services/api";
import { formatRoPhone, telLink, hasUsablePhone } from "@/utils/phone";

interface ContractDetailSheetProps {
  row: ContractListItem | null;
  open: boolean;
  onClose: () => void;
  onContract: (row: ContractListItem) => void;
  onHandover: (row: ContractListItem) => void;
  onViewPv: (row: ContractListItem) => void;
}

export default function ContractDetailSheet({
  row,
  open,
  onClose,
  onContract,
  onHandover,
  onViewPv,
}: ContractDetailSheetProps) {
  const { data: detailData, isLoading } = useQuery({
    queryKey: ["contract", row?.id],
    queryFn: () => api.get(`/contracts/${row?.id}`).then((r) => r.data),
    enabled: open && !!row?.id,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (!row) return null;

  const priceFmt = (n: number) =>
    new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(n || 0) + " €";

  const kmFmt = (n: number | null | undefined) => {
    if (n == null) return null;
    return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(n) + " km";
  };

  const isHandedOver = !!(detailData?.handoverDate ?? row.handoverDate);
  const contractNum = detailData?.contractNumber ?? row.contractNumber;
  const saleDateStr = detailData?.saleDate ?? row.saleDate;
  const rawPlate = detailData?.plateNumber ?? row.plateNumber ?? "";
  const plateNum = rawPlate.trim().toUpperCase();
  const v = detailData?.vehicleSnapshot ?? row.vehicleSnapshot ?? {};
  const carTitle = v.title || "Mașină";
  const listingId = detailData?.listingId;

  // Buyer data extraction
  const bSnap = detailData?.buyerSnapshot || {};
  const bFull = detailData?.buyer || {};
  const buyerName = bSnap.name || bFull.name || row.buyer?.name;

  const cnpVal = bSnap.cnp || bFull.cnp;

  const ciSer = bSnap.ciSeries || bFull.ciSeries;
  const ciNum = bSnap.ciNumber || bFull.ciNumber;
  const ciVal = (ciSer || ciNum) ? `${ciSer || ""} ${ciNum || ""}`.trim() : null;

  const phoneVal = bFull.phone || bSnap.phone;

  const addrVal = bSnap.address || bFull.address || (row.buyer as any)?.address;

  // Car & Sale data extraction
  const salePriceVal = detailData?.salePrice ?? row.salePrice;
  const mileageVal = detailData?.mileageAtSale ?? v.mileage;
  const vinVal = v.vin;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between pb-2 border-b border-border text-left">
          <div>
            <SheetTitle className="text-[17px] font-medium text-foreground leading-tight">
              Contract #{contractNum}
            </SheetTitle>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {saleDateStr ? format(new Date(saleDateStr), "dd MMM yyyy", { locale: ro }) : "—"}
              {" · "}
              {plateNum || "nespecificat"}
            </p>
          </div>
          {isHandedOver ? (
            <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-success/15 text-success whitespace-nowrap shrink-0 mr-6">
              Predat
            </span>
          ) : (
            <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-warning-light text-warning whitespace-nowrap shrink-0 mr-6">
              Fără predare
            </span>
          )}
        </SheetHeader>

        {/* Car Title Link */}
        <div className="pb-2 border-b border-border">
          {listingId ? (
            <Link
              to={`/listings/${listingId}`}
              className="text-[15px] font-medium text-foreground hover:underline inline-flex items-center gap-1.5 leading-snug"
            >
              <span>{carTitle}</span>
              <ExternalLink className="w-4 h-4 text-primary shrink-0" />
            </Link>
          ) : (
            <h3 className="text-[15px] font-medium text-foreground leading-snug">
              {carTitle}
            </h3>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </div>
        ) : (
          <>
            {/* GROUP 1: Cumpărător */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
                Cumpărător
              </p>
              <div className="space-y-2.5 text-[14px] bg-background/50 p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Nume</span>
                  {buyerName ? (
                    <span className="font-medium text-foreground text-right truncate">
                      {buyerName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">nespecificat</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">CNP</span>
                  {cnpVal ? (
                    <span className="text-foreground tabular-nums text-right">
                      {cnpVal}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">nespecificat</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">CI</span>
                  {ciVal ? (
                    <span className="text-foreground text-right">
                      {ciVal}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">nespecificat</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Telefon</span>
                  {hasUsablePhone(phoneVal) ? (
                    <a
                      href={telLink(phoneVal)}
                      className="font-medium text-primary hover:underline text-right"
                    >
                      {formatRoPhone(phoneVal)}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Adresă</span>
                  {addrVal ? (
                    <span className="text-foreground text-right truncate max-w-[200px]">
                      {addrVal}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">nespecificat</span>
                  )}
                </div>
              </div>
            </div>

            {/* GROUP 2: Vehicul & vânzare */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
                Vehicul & vânzare
              </p>
              <div className="space-y-2.5 text-[14px] bg-background/50 p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Preț vânzare</span>
                  <span className="text-[15px] font-medium text-foreground">
                    {priceFmt(salePriceVal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Km la vânzare</span>
                  {mileageVal != null ? (
                    <span className="text-foreground text-right">
                      {kmFmt(mileageVal)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">nespecificat</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Nr. înmatriculare</span>
                  {plateNum ? (
                    <span className="text-foreground text-right font-medium">
                      {plateNum}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">nespecificat</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">VIN</span>
                  {vinVal ? (
                    <span className="text-foreground text-right font-mono text-xs">
                      {vinVal}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">nespecificat</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => {
              onClose();
              onContract(row);
            }}
            className="flex-1 h-11 min-h-[44px] rounded-xl border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Contract</span>
          </button>
          {isHandedOver ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewPv(row);
              }}
              className="flex-1 h-11 min-h-[44px] rounded-xl border border-border bg-card text-foreground text-[14px] font-medium hover:bg-accent/50 transition-colors inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Vezi PV</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onHandover(row);
              }}
              className="flex-1 h-11 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Predare</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
