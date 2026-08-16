interface ListingFiguresProps {
  daysInStock: number;
  viewCount: number | string;
  leadsCount: number;
  getDaysColorClass: (days: number) => string;
}

export default function ListingFigures({
  daysInStock,
  viewCount,
  leadsCount,
  getDaysColorClass,
}: ListingFiguresProps) {
  return (
    <div className="flex gap-2 select-none">
      <div className="flex-1 bg-card border border-border rounded-[var(--radius)] p-2.5 text-center flex flex-col justify-between">
        <span className={`text-[17px] font-semibold ${getDaysColorClass(daysInStock)}`}>
          {daysInStock}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-0.5">
          zile în stoc
        </span>
      </div>
      <div className="flex-1 bg-card border border-border rounded-[var(--radius)] p-2.5 text-center flex flex-col justify-between">
        <span className="text-[17px] font-semibold text-foreground">
          {viewCount}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-0.5">
          vizualizări
        </span>
      </div>
      <div className="flex-1 bg-card border border-border rounded-[var(--radius)] p-2.5 text-center flex flex-col justify-between">
        <span className="text-[17px] font-semibold text-foreground">
          {leadsCount}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-0.5">
          lead-uri
        </span>
      </div>
    </div>
  );
}
