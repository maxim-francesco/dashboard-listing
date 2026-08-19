import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpDown, Check, Filter, Search, X } from "lucide-react";
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
import { TYPE_LABELS, STATUS_LABELS } from "@/components/leads/LeadDetailPanel";
import { cn } from "@/lib/utils";

export type MessagesSortOption = "newest" | "oldest" | "name_asc";
export type LeadTypeFilter = "GENERAL" | "STOCK" | "ORDER" | "BUYBACK" | "FINANCING";
export type LeadStatusFilter = "NEW" | "CONTACTED" | "VIEWING" | "OFFER" | "WON" | "LOST";

export interface MessagesSortOptionItem {
  value: MessagesSortOption;
  label: string;
}

export const DEFAULT_MESSAGES_SORT_OPTIONS: MessagesSortOptionItem[] = [
  { value: "newest", label: "Cele mai noi" },
  { value: "oldest", label: "Cele mai vechi" },
  { value: "name_asc", label: "Nume A–Z" },
];

export const LEAD_TYPES: LeadTypeFilter[] = ["GENERAL", "STOCK", "ORDER", "BUYBACK", "FINANCING"];
export const LEAD_STATUSES: LeadStatusFilter[] = ["NEW", "CONTACTED", "VIEWING", "OFFER", "WON", "LOST"];

export interface BaseMessageItem {
  id: string;
  name?: string;
  phone?: string;
  message?: string;
  type: LeadTypeFilter;
  status: LeadStatusFilter;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
  };
}

export interface MessagesHeaderProps {
  backHref?: string;
  backAriaLabel?: string;
  title?: string;
  countText: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchPlaceholder?: string;
  showSort?: boolean;
  sortBy?: MessagesSortOption;
  onSortByChange?: (sort: MessagesSortOption) => void;
  sortOptions?: MessagesSortOptionItem[];
  selectedTypes: LeadTypeFilter[];
  onSelectedTypesChange: (types: LeadTypeFilter[]) => void;
  selectedStatuses: LeadStatusFilter[];
  onSelectedStatusesChange: (statuses: LeadStatusFilter[]) => void;
  baseMessages?: BaseMessageItem[];
}

export default function MessagesHeader({
  backHref = "/customers",
  backAriaLabel = "Înapoi la clienți",
  title = "Lead-uri",
  countText,
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder = "Caută după nume, telefon sau mașină...",
  showSort = true,
  sortBy = "newest",
  onSortByChange,
  sortOptions = DEFAULT_MESSAGES_SORT_OPTIONS,
  selectedTypes,
  onSelectedTypesChange,
  selectedStatuses,
  onSelectedStatusesChange,
  baseMessages = [],
}: MessagesHeaderProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const hasActiveFilters = selectedTypes.length > 0 || selectedStatuses.length > 0;

  const handleClearFilters = () => {
    onSelectedTypesChange([]);
    onSelectedStatusesChange([]);
  };

  return (
    <>
      {/* Desktop Header (1 row, 36px chrome) */}
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
            id="messages-search-desktop"
            name="messages-search-desktop"
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
              <DropdownMenuRadioGroup
                value={sortBy}
                onValueChange={(val) => onSortByChange(val as MessagesSortOption)}
              >
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

      {/* Mobile Header (2 bands) */}
      <div className="flex flex-col gap-2.5 lg:hidden px-1">
        {/* Band 1: back button · title over count · filter control · sort control */}
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
                <DropdownMenuRadioGroup
                  value={sortBy}
                  onValueChange={(val) => onSortByChange(val as MessagesSortOption)}
                >
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
            id="messages-search-mobile"
            name="messages-search-mobile"
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

          {selectedStatuses.map((statusKey) => (
            <div
              key={statusKey}
              className="flex items-center gap-1.5 bg-card border border-border rounded-full px-2.5 py-1 text-[12px] text-muted-foreground"
            >
              <span>Status: {STATUS_LABELS[statusKey] || statusKey}</span>
              <button
                type="button"
                aria-label={`Șterge filtrul ${STATUS_LABELS[statusKey] || statusKey}`}
                onClick={() => onSelectedStatusesChange(selectedStatuses.filter((s) => s !== statusKey))}
                className="hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

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
            <SheetTitle>Filtrează lead-urile</SheetTitle>
            <SheetDescription>Filtrează lead-urile după tip de cerere și status</SheetDescription>
          </SheetHeader>

          {/* Dimension 1: Tip cerere */}
          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
              Tip cerere
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {LEAD_TYPES.map((typeKey, index) => {
                const isSelected = selectedTypes.includes(typeKey);
                const count = baseMessages.filter(
                  (m) =>
                    m.type === typeKey &&
                    (selectedStatuses.length === 0 || selectedStatuses.includes(m.status))
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
                    {/* Check mark left slot */}
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

          {/* Dimension 2: Status */}
          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
              Status
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {LEAD_STATUSES.map((statusKey, index) => {
                const isSelected = selectedStatuses.includes(statusKey);
                const count = baseMessages.filter(
                  (m) =>
                    m.status === statusKey &&
                    (selectedTypes.length === 0 || selectedTypes.includes(m.type))
                ).length;
                const isZero = count === 0;

                return (
                  <button
                    type="button"
                    key={statusKey}
                    data-action={`filter-status-${statusKey}`}
                    onClick={() => {
                      const next = selectedStatuses.includes(statusKey)
                        ? selectedStatuses.filter((s) => s !== statusKey)
                        : [...selectedStatuses, statusKey];
                      onSelectedStatusesChange(next);
                    }}
                    className={cn(
                      "w-full min-h-[44px] px-3.5 flex items-center gap-2.5 text-[13px] text-left select-none transition-colors hover:bg-muted/50 cursor-pointer",
                      index > 0 && "border-t border-border"
                    )}
                  >
                    {/* Check mark left slot */}
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
                      {STATUS_LABELS[statusKey] || statusKey}
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
