"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    class ProductPrice extends sequelize_1.Model {
    }
    ProductPrice.init({
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
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        buyPricePerBox: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        sellPricePerBox: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        sellPricePerUnit: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        startAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        endAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        allowLoss: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        sequelize,
        tableName: "product_prices",
        timestamps: false, // we manage startAt/endAt manually
    });
    return ProductPrice;
};
