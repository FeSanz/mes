//Redondear a 2 decimales
export function Round(numberRaw: number): number {
  if (!numberRaw) return 0.0;

  return Math.round(numberRaw * 100) / 100;
}

//Truncar a 2 decimales
export function Truncate(numberRaw: number): number {
  if (!numberRaw) return 0.0;

  return Math.floor(numberRaw * 100) / 100;
}
