import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NetworkHeaderProps {
  title: string;
  countText?: string;
  backHref?: string;
  backAriaLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function NetworkHeader({
  title,
  countText,
  backHref,
  backAriaLabel = "Înapoi",
  actions,
  children,
  className,
}: NetworkHeaderProps) {
  return (
    <>
      {/* Desktop Header (1 row, 36px chrome) */}
      <div className={cn("hidden lg:flex items-center justify-between gap-3 w-full", className)}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {backHref && (
            <Link
              to={backHref}
              aria-label={backAriaLabel}
              className="w-9 h-9 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-[17px] font-semibold text-foreground leading-none truncate">
              {title}
            </h1>
            {countText && (
              <span className="text-[13px] text-muted-foreground tabular-nums shrink-0">
                {countText}
              </span>
            )}
          </div>
        </div>
        {children && <div className="flex-1 max-w-sm">{children}</div>}
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Mobile Header (1 or 2 bands) */}
      <div className={cn(children ? "flex flex-col gap-2.5 lg:hidden px-1 w-full" : "flex items-center gap-2 lg:hidden px-1 w-full", className)}>
        <div className="flex items-center gap-2 w-full">
          {backHref && (
            <Link
              to={backHref}
              aria-label={backAriaLabel}
              className="w-11 h-11 border border-border rounded-lg flex items-center justify-center hover:bg-muted shrink-0 text-foreground transition-colors min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-medium text-foreground leading-tight truncate">
              {title}
            </h1>
            {countText && (
              <p className="text-[12px] text-muted-foreground leading-tight truncate mt-0.5 tabular-nums">
                {countText}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        {children && (
          <div className="w-full">
            {children}
          </div>
        )}
      </div>
    </>
  );
}
