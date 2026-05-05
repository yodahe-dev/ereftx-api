"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUnits = void 0;
exports.calculateUnits = {
    toTotalUnits: (boxes, singles, unitsPerBox) => {
        return (boxes * unitsPerBox) + singles;
    },
    toDisplayUnits: (totalUnits, unitsPerBox) => {
        return {
            boxes: Math.floor(totalUnits / unitsPerBox),
            singles: totalUnits % unitsPerBox,
        };
    }
};
