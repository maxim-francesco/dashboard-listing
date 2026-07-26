// Romanian requires "de" before the noun from 20 upward: 1 mesaj, 5 mesaje,
// 20 de mesaje. This helper encodes that rule.
export const roCount = (n: number, one: string, few: string): string => {
  if (n === 1) return `${n} ${one}`;
  if (n < 20) return `${n} ${few}`;
  return `${n} de ${few}`;
};
