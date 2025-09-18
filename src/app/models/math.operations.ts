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

//Truncar a 2 decimales y formato con comas
export function TruncatePoint(numberRaw: number): string {
  if (!numberRaw) return "0";

  // Truncar a 2 decimales
  const truncated = Math.floor(numberRaw * 100) / 100;

  // Verificar si es un número entero
  const isInteger = truncated % 1 === 0;

  // Formatear con comas
  return truncated.toLocaleString('en-US', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2
  });
}
