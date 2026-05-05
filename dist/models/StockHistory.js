"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryActionType = void 0;
const sequelize_1 = require("sequelize");
var HistoryActionType;
(function (HistoryActionType) {
    HistoryActionType["RESTOCK"] = "restock";
    HistoryActionType["ADJUST"] = "adjust";
    HistoryActionType["EXCHANGE"] = "exchange";
    HistoryActionType["INITIAL"] = "initial";
    HistoryActionType["SALE"] = "sale";
})(HistoryActionType || (exports.HistoryActionType = HistoryActionType = {}));
exports.default = (sequelize) => {
    class StockHistory extends sequelize_1.Model {
    }
    StockHistory.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        productId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "products",
                key: "id",
            },
        },
        priceId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            comment: "Tracks the specific buy/sell price at the time of this movement",
            references: {
                model: "product_prices",
                key: "id",
            },
        },
        actionType: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(HistoryActionType)),
            allowNull: false,
        },
        boxQuantityBefore: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        singleQuantityBefore: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        boxQuantityAfter: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        singleQuantityAfter: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        boxQuantityChange: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        singleQuantityChange: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        isFree: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        saleId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: "sales", // Assuming you have a sales table
                key: "id"
            }
        },
    }, {
        sequelize,
        tableName: "stock_history",
        timestamps: true,
        indexes: [
            { fields: ["productId"] },
            { fields: ["priceId"] }, // Performance index for financial reports
            { fields: ["actionType"] },
            { fields: ["createdAt"] },
        ],
    });
    return StockHistory;
};
