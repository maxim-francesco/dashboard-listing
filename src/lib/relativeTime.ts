import { format, isToday, isTomorrow } from "date-fns";
import { ro } from "date-fns/locale";

export const relativeTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  
  if (diffSecs < 60) {
    return "chiar acum";
  }
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) {
    const n = diffMins;
    if (n === 1) return "acum 1 minut";
    if (n >= 2 && n <= 19) return `acum ${n} minute`;
    return `acum ${n} de minute`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    const n = diffHours;
    if (n === 1) return "acum 1 oră";
    if (n >= 2 && n <= 19) return `acum ${n} ore`;
    return `acum ${n} de ore`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 48) {
    return "ieri";
  }
  
  if (diffHours < 168) {
    const n = diffDays;
    if (n === 1) return "acum 1 zi";
    if (n >= 2 && n <= 19) return `acum ${n} zile`;
    return `acum ${n} de zile`;
  }
  
  return format(d, "d MMMM", { locale: ro });
};

export const relativeDay = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isToday(d)) return "azi";
  if (isTomorrow(d)) return "mâine";
  return format(d, "d MMMM", { locale: ro });
};
