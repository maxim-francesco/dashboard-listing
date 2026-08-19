export const TYPE_LABELS: Record<string, string> = {
  GENERAL: "Contact",
  STOCK: "Stoc",
  ORDER: "Comandă",
  BUYBACK: "Buyback",
  FINANCING: "Finanțare",
};

export const STATUS_LABELS: Record<string, string> = {
  NEW: "Nou",
  CONTACTED: "Contactat",
  VIEWING: "Vizionare",
  OFFER: "Ofertă",
  WON: "Câștigat",
  LOST: "Pierdut",
};

export const LOST_REASON_LABELS: Record<string, string> = {
  PRICE: "Preț",
  BOUGHT_ELSEWHERE: "A cumpărat din altă parte",
  UNREACHABLE: "Nu răspunde",
  NOT_SERIOUS: "Neserios",
  OTHER: "Alt motiv",
};

export const TYPE_COLORS: Record<string, string> = {
  GENERAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  STOCK: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  ORDER: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  BUYBACK: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  FINANCING: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  CONTACTED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  VIEWING: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  OFFER: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  WON: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  LOST: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

