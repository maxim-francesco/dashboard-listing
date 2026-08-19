import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpDown, Check, Filter, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TYPE_LABELS } from "@/components/leads/LeadDetailPanel";
import { CustomerListItem } from "@/services/api";
import { getDeadline, getBucket } from "@/components/customers/CustomerRow";
import { cn } from "@/lib/utils";

export type CustomersSortOption = "recent" | "deadline_asc" | "name_asc";
export type LeadTypeFilter = "GENERAL" | "STOCK" | "ORDER" | "BUYBACK" | "FINANCING";
export type DeadlineFilter = "expirat" | "azi_maine" | "saptamana" | "fara_termen";

export interface CustomersSortOptionItem {
  value: CustomersSortOption;
  label: string;
}

export const DEFAULT_CUSTOMERS_SORT_OPTIONS: CustomersSortOptionItem[] = [
  { value: "recent", label: "Ultima interacțiere" },
  { value: "deadline_asc", label: "Termen apropiat" },
  { value: "name_asc", label: "Nume A–Z" },
];

export const LEAD_TYPES: LeadTypeFilter[] = ["GENERAL", "STOCK", "ORDER", "BUYBACK", "FINANCING"];

export const DEADLINE_OPTIONS: { value: DeadlineFilter; label: string }[] = [
  { value: "expirat", label: "Expirat" },
  { value: "azi_maine", label: "Azi – Mâine" },
  { value: "saptamana", label: "Săptămâna asta" },
  { value: "fara_termen", label: "Fără termen" },
];

export function matchesLeadTypes(c: CustomerListItem, types: LeadTypeFilter[]): boolean {
  if (types.length === 0) return true;
  return types.some((t) => c.leadTypes?.includes(t) || (c.openLead && c.openLead.type === t));
}

export function matchesDeadline(c: CustomerListItem, deadlineFilter: DeadlineFilter | null): boolean {
  if (!deadlineFilter) return true;
  const deadline = getDeadline(c);
  if (deadlineFilter === "fara_termen") {
    return deadline === null;
  }
  if (deadline === null) {
    return false;
  }
  const bucket = getBucket(deadline);
  if (deadlineFilter === "expirat") {
    return bucket === "expirat";
  }
  if (deadlineFilter === "azi_maine") {
    return bucket === "azi" || bucket === "maine";
  }
  if (deadlineFilter === "saptamana") {
    return bucket === "saptamana";
  }
  return true;
}

export interface CustomersHeaderProps {
  backHref?: string;
  backAriaLabel?: string;
  title: string;
  countText: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchPlaceholder?: string;
  showSort?: boolean;
  sortBy?: CustomersSortOption;
  onSortByChange?: (sort: CustomersSortOption) => void;
  sortOptions?: CustomersSortOptionItem[];
  selectedTypes: LeadTypeFilter[];
  onSelectedTypesChange: (types: LeadTypeFilter[]) => void;
  selectedDeadline: DeadlineFilter | null;
  onSelectedDeadlineChange: (deadline: DeadlineFilter | null) => void;
  baseCustomers?: CustomerListItem[];
  onNewLead?: () => void;
  primaryActionLabel?: string;
}

export default function CustomersHeader({
  backHref = "/customers",
  backAriaLabel = "Înapoi la categorii",
  title,
  countText,
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder = "Caută după nume sau telefon...",
  showSort = true,
  sortBy = "recent",
  onSortByChange,
  sortOptions = DEFAULT_CUSTOMERS_SORT_OPTIONS,
  selectedTypes,
  onSelectedTypesChange,
  selectedDeadline,
  onSelectedDeadlineChange,
  baseCustomers = [],
  onNewLead,
  primaryActionLabel = "Lead nou",
}: CustomersHeaderProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const hasActiveFilters = selectedTypes.length > 0 || selectedDeadline !== null;

  const handleClearFilters = () => {
    onSelectedTypesChange([]);
    onSelectedDeadlineChange(null);
  };

  return (
    <>
      {/* Desktop Header (1 row) */}
      <div className="hidden lg:flex items-center gap-3 w-full">
        {/* 1. Back button (icon, square) */}
        <Link
          to={backHref}
          aria-label={backAriaLabel}
          className="w-9 h-9 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* 2 & 3. Title & count (baseline-aligned) */}
        <div className="flex items-baseline gap-2 shrink-0">
          <h1 className="text-[17px] font-semibold text-foreground leading-none">
            {title}
          </h1>
          <span className="text-[13px] text-muted-foreground tabular-nums">
            {countText}
          </span>
        </div>

        {/* 4. Search (flexes to fill) */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="customers-search-desktop"
            name="customers-search-desktop"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-9 bg-card border-border rounded-lg w-full h-9 text-[13px] focus-visible:ring-0 focus-visible:border-border"
          />
        </div>

        {/* 5. Filter button */}
        <Button
          variant="ghost"
          aria-label="Filtrează lista"
          onClick={() => setFilterOpen(true)}
          className={cn(
            "w-9 h-9 p-0 border rounded-lg flex items-center justify-center shrink-0 transition-colors",
            hasActiveFilters
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-foreground hover:bg-muted"
          )}
        >
          <Filter className="w-4 h-4" />
        </Button>

        {/* 6. Sort control (icon, square) */}
        {showSort && onSortByChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Sortează lista"
                className="w-9 h-9 p-0 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground"
              >
                <ArrowUpDown className="h-4 w-4 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border min-w-[200px]">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Sortare
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(val) => onSortByChange(val as CustomersSortOption)}>
                {sortOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="cursor-pointer text-[13px]">
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 7. Primary action (labelled, desktop only) */}
        {onNewLead && (
          <Button
            onClick={onNewLead}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[13px] h-9 px-3 rounded-lg flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{primaryActionLabel}</span>
          </Button>
        )}
      </div>

      {/* Mobile Header (2 bands) */}
      <div className="flex flex-col gap-2.5 lg:hidden px-1">
        {/* Band 1: back button · title over count on two lines · filter control · sort control */}
        <div className="flex items-center gap-2">
          {/* Back button (clears 44px) */}
          <Link
            to={backHref}
            aria-label={backAriaLabel}
            className="w-11 h-11 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Title over count on two lines */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-medium text-foreground leading-tight truncate">
              {title}
            </h1>
            <p className="text-[12px] text-muted-foreground leading-tight truncate mt-0.5 tabular-nums">
              {countText}
            </p>
          </div>

          {/* Filter button (clears 44px) */}
          <Button
            variant="ghost"
            aria-label="Filtrează lista"
            onClick={() => setFilterOpen(true)}
            className={cn(
              "w-11 h-11 p-0 border rounded-lg flex items-center justify-center shrink-0 transition-colors",
              hasActiveFilters
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-foreground hover:bg-muted"
            )}
          >
            <Filter className="w-5 h-5" />
          </Button>

          {/* Sort control (icon, square, clears 44px) */}
          {showSort && onSortByChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label="Sortează lista"
                  className="w-11 h-11 p-0 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground"
                >
                  <ArrowUpDown className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border min-w-[220px]">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Sortare
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(val) => onSortByChange(val as CustomersSortOption)}>
                  {sortOptions.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value} className="cursor-pointer text-[13px]">
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Band 2: search full width */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="customers-search-mobile"
            name="customers-search-mobile"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-9 bg-card border-border rounded-lg w-full h-11 text-[15px] focus-visible:ring-0 focus-visible:border-border"
          />
        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1">
          {selectedTypes.map((typeKey) => (
            <div
              key={typeKey}
              className="flex items-center gap-1.5 bg-card border border-border rounded-full px-2.5 py-1 text-[12px] text-muted-foreground"
            >
              <span>Tip: {TYPE_LABELS[typeKey] || typeKey}</span>
              <button
                type="button"
                aria-label={`Șterge filtrul ${TYPE_LABELS[typeKey] || typeKey}`}
                onClick={() => onSelectedTypesChange(selectedTypes.filter((t) => t !== typeKey))}
                className="hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedDeadline && (
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-2.5 py-1 text-[12px] text-muted-foreground">
              <span>
                Termen: {DEADLINE_OPTIONS.find((o) => o.value === selectedDeadline)?.label || selectedDeadline}
              </span>
              <button
                type="button"
                aria-label="Șterge filtrul de termen"
                onClick={() => onSelectedDeadlineChange(null)}
                className="hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            aria-label="Resetează toate filtrele"
            onClick={handleClearFilters}
            className="text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
          >
            Șterge toate
          </button>
        </div>
      )}

      {/* Compact Filter Bottom Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto [&>button.absolute]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Filtrează clienții</SheetTitle>
            <SheetDescription>Filtrează clienții după tip de cerere și termen</SheetDescription>
          </SheetHeader>

          {/* Dimension 1: Tip cerere */}
          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
              Tip cerere
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {LEAD_TYPES.map((typeKey, index) => {
                const isSelected = selectedTypes.includes(typeKey);
                const count = baseCustomers.filter(
                  (c) => matchesLeadTypes(c, [typeKey]) && matchesDeadline(c, selectedDeadline)
                ).length;
                const isZero = count === 0;

                return (
                  <button
                    type="button"
                    key={typeKey}
                    data-action={`filter-type-${typeKey}`}
                    onClick={() => {
                      const next = selectedTypes.includes(typeKey)
                        ? selectedTypes.filter((t) => t !== typeKey)
                        : [...selectedTypes, typeKey];
                      onSelectedTypesChange(next);
                    }}
                    className={cn(
                      "w-full min-h-[44px] px-3.5 flex items-center gap-2.5 text-[13px] text-left select-none transition-colors hover:bg-muted/50 cursor-pointer",
                      index > 0 && "border-t border-border"
                    )}
                  >
                    {/* Check mark left slot (fixed width so labels never shift) */}
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>

                    {/* Label */}
                    <span
                      data-role="label"
                      className={cn(
                        "flex-1 min-w-0 truncate",
                        isSelected
                          ? "text-primary font-medium"
                          : isZero
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {TYPE_LABELS[typeKey] || typeKey}
                    </span>

                    {/* Count */}
                    <span
                      className={cn(
                        "text-[13px] tabular-nums shrink-0 ml-2",
                        isSelected
                          ? "text-primary/70 font-normal"
                          : "text-muted-foreground font-normal"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension 2: Termen */}
          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
              Termen
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {DEADLINE_OPTIONS.map((opt, index) => {
                const isSelected = selectedDeadline === opt.value;
                const count = baseCustomers.filter(
                  (c) => matchesLeadTypes(c, selectedTypes) && matchesDeadline(c, opt.value)
                ).length;
                const isZero = count === 0;

                return (
                  <button
                    type="button"
                    key={opt.value}
                    data-action={`filter-deadline-${opt.value}`}
                    onClick={() => {
                      const next = selectedDeadline === opt.value ? null : opt.value;
                      onSelectedDeadlineChange(next);
                    }}
                    className={cn(
                      "w-full min-h-[44px] px-3.5 flex items-center gap-2.5 text-[13px] text-left select-none transition-colors hover:bg-muted/50 cursor-pointer",
                      index > 0 && "border-t border-border"
                    )}
                  >
                    {/* Check mark left slot (fixed width so labels never shift) */}
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>

                    {/* Label */}
                    <span
                      data-role="label"
                      className={cn(
                        "flex-1 min-w-0 truncate",
                        isSelected
                          ? "text-primary font-medium"
                          : isZero
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {opt.label}
                    </span>

                    {/* Count */}
                    <span
                      className={cn(
                        "text-[13px] tabular-nums shrink-0 ml-2",
                        isSelected
                          ? "text-primary/70 font-normal"
                          : "text-muted-foreground font-normal"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
