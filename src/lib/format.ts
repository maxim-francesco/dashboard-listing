export const formatEur = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(value) + " €";
};
