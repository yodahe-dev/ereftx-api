export const calculateUnits = {
  toTotalUnits: (boxes: number, singles: number, unitsPerBox: number): number => {
    return (boxes * unitsPerBox) + singles;
  },

  toDisplayUnits: (totalUnits: number, unitsPerBox: number) => {
    return {
      boxes: Math.floor(totalUnits / unitsPerBox),
      singles: totalUnits % unitsPerBox,
    };
  }
};