interface ListingIdentityProps {
  title: string;
  price?: number;
  identitySubtitle?: string | null;
}

export default function ListingIdentity({
  title,
  price,
  identitySubtitle,
}: ListingIdentityProps) {
  return (
    <div className="space-y-1 text-left">
      <h1 className="text-[19px] font-semibold text-foreground leading-tight">
        {title}
      </h1>
      <div className="text-[22px] font-semibold text-foreground leading-none pt-1">
        {new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(price || 0)} €
      </div>
      {identitySubtitle && (
        <div className="text-sm text-muted-foreground pt-1.5 leading-snug">
          {identitySubtitle}
        </div>
      )}
    </div>
  );
}
