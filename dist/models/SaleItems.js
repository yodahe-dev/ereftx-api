"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleItem = void 0;
const sequelize_1 = require("sequelize");
// ✅ EXPORT CLASS (IMPORTANT FOR TYPES)
class SaleItem extends sequelize_1.Model {
}
exports.SaleItem = SaleItem;
// ✅ DEFAULT EXPORT (SEQUELIZE INIT)
exports.default = (sequelize) => {
    SaleItem.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        saleId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "sales",
                key: "id",
            },
            onDelete: "CASCADE",
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
            references: {
                model: "product_prices",
                key: "id",
            },
        },
        unitType: {
            type: sequelize_1.DataTypes.ENUM("box", "single"),
            allowNull: false,
        },
        quantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        totalUnits: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        productName: {
            type: sequelize_1.DataTypes.STRING(150),
            allowNull: false,
        },
        unitPrice: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        costPrice: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        totalPrice: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        totalCost: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: "sale_items",
        timestamps: true,
        indexes: [
            { fields: ["saleId"] },
            { fields: ["productId"] },
        ],
    });
    return SaleItem;
};
