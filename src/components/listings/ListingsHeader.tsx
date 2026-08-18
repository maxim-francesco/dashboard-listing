import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpDown, MoreVertical, Plus, Search } from "lucide-react";
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

export type SortOption =
  | "age_desc"
  | "age_asc"
  | "views_desc"
  | "views_asc"
  | "price_asc"
  | "price_desc";

export interface SortOptionItem {
  value: SortOption;
  label: string;
}

export const DEFAULT_LISTINGS_SORT_OPTIONS: SortOptionItem[] = [
  { value: "age_desc", label: "Vechime: cele mai vechi" },
  { value: "age_asc", label: "Vechime: cele mai noi" },
  { value: "views_desc", label: "Vizualizări: cele mai multe" },
  { value: "views_asc", label: "Vizualizări: cele mai puține" },
  { value: "price_asc", label: "Preț: crescător" },
  { value: "price_desc", label: "Preț: descrescător" },
];

export interface ListingsHeaderProps {
  backHref?: string;
  backAriaLabel?: string;
  title: string;
  countText: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchPlaceholder?: string;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  sortOptions?: SortOptionItem[];
  primaryActionHref?: string;
  primaryActionLabel?: string;
  overflowMenuItems?: ReactNode;
}

export default function ListingsHeader({
  backHref = "/listings",
  backAriaLabel = "Înapoi la categorii",
  title,
  countText,
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder = "Caută marcă, model, an",
  sortBy,
  onSortByChange,
  sortOptions = DEFAULT_LISTINGS_SORT_OPTIONS,
  primaryActionHref,
  primaryActionLabel,
  overflowMenuItems,
}: ListingsHeaderProps) {
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
            id="listings-search-desktop"
            name="listings-search-desktop"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-9 bg-card border-border rounded-lg w-full h-9 text-[13px] focus-visible:ring-0 focus-visible:border-border"
          />
        </div>

        {/* 5. Sort control (icon, square) */}
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
            <DropdownMenuRadioGroup value={sortBy} onValueChange={(val) => onSortByChange(val as SortOption)}>
              {sortOptions.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="cursor-pointer text-[13px]">
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 6. Primary action (labelled) */}
        {primaryActionHref && primaryActionLabel && (
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[13px] h-9 px-3 rounded-lg flex items-center gap-1.5 shrink-0"
          >
            <Link to={primaryActionHref}>
              <Plus className="w-4 h-4" />
              <span>{primaryActionLabel}</span>
            </Link>
          </Button>
        )}

        {/* 7. Overflow menu (icon, square) */}
        {overflowMenuItems && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Mai multe opțiuni"
                className="w-9 h-9 p-0 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground"
              >
                <MoreVertical className="h-4 w-4 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border min-w-[160px]">
              {overflowMenuItems}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Mobile Header (2 bands) */}
      <div className="flex flex-col gap-2.5 lg:hidden px-1">
        {/* Band 1: back button · title over count on two lines · sort control · overflow menu */}
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

          {/* Sort control (replaces removed duplicate add button, clears 44px) */}
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
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(val) => onSortByChange(val as SortOption)}>
                {sortOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="cursor-pointer text-[13px]">
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Overflow menu (icon, square, clears 44px) */}
          {overflowMenuItems && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label="Mai multe opțiuni"
                  className="w-11 h-11 p-0 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border min-w-[160px]">
                {overflowMenuItems}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Band 2: search full width */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="listings-search-mobile"
            name="listings-search-mobile"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-9 bg-card border-border rounded-lg w-full h-11 text-[15px] focus-visible:ring-0 focus-visible:border-border"
          />
        </div>
      </div>
    </>
  );
}
