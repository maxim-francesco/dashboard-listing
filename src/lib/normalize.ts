export const norm = (s: string): string =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
