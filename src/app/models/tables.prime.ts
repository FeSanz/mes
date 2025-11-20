export function HeightTable(regionHeight:number): string {
  let reductionPercentage = 25;
  if(regionHeight >= 1080) {
    reductionPercentage = 15;
  }
  else if (regionHeight >= 480 && regionHeight <= 720) {
    reductionPercentage = 25;
  }
  else if (regionHeight >= 360 && regionHeight <= 480) {
    reductionPercentage = 35;
  }
  const height = regionHeight - (regionHeight * (reductionPercentage / 100)); //Restar %

  return height + 'px';
}


export function HeightSingleTable(regionHeight:number): string {
  let reductionPercentage = 25;
  if(regionHeight >= 1080) {
    reductionPercentage = 5;
  }
  else if (regionHeight >= 480 && regionHeight <= 720) {
    reductionPercentage = 15;
  }
  else if (regionHeight >= 360 && regionHeight <= 480) {
    reductionPercentage = 25;
  }
  const height = regionHeight - (regionHeight * (reductionPercentage / 100)); //Restar %

  return height + 'px';
}

export function RowsPerPageProduction(viewportHeight: number): number {
  // Si es muy pequeño, retornar 1 fila
  if (viewportHeight < 550) {
    return 1;
  }

  // Fórmula para calcular filas desde 550px en adelante
  const BASE_OFFSET = 520;   // Offset base
  let PIXELS_PER_ROW; // Cada 33px = 1 fila aprox.

  if(viewportHeight <= 800) {
    PIXELS_PER_ROW = 30;
  } else {
    PIXELS_PER_ROW = 33;
  }

  const availableHeight = viewportHeight - BASE_OFFSET;
  const rows = Math.floor(availableHeight / PIXELS_PER_ROW);

  // Límites: mínimo 1, máximo 50
  return Math.max(1, Math.min(rows, 50));
}

export function RowsPerPageFull(viewportHeight: number): number {
  // Si es muy pequeño, retornar 1 fila
  if (viewportHeight < 350) {
    return 1;
  }

  // Fórmula para calcular filas desde 350px en adelante
  const BASE_OFFSET = 320;   // Offset base
  let PIXELS_PER_ROW = 48; // Cada 33px = 1 fila aprox. (CON ICONO)

  const availableHeight = viewportHeight - BASE_OFFSET;
  const rows = Math.floor(availableHeight / PIXELS_PER_ROW);

  // Límites: mínimo 1, máximo 50
  return Math.max(1, Math.min(rows, 50));
}
