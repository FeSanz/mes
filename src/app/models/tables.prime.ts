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
