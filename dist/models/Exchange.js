"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    class Exchange extends sequelize_1.Model {
    }
    Exchange.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        sourceProductId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "products", key: "id" }
        },
        targetProductId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "products", key: "id" }
        },
        sourcePriceId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "product_prices", key: "id" }
        },
        targetPriceId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "product_prices", key: "id" }
        },
        sourceQuantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 } // You can't exchange 0 items
        },
        targetQuantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 }
        },
        exchangeType: {
            type: sequelize_1.DataTypes.ENUM("box", "single"),
            allowNull: false
        },
        balanceAmount: {
            type: sequelize_1.DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            comment: "Financial difference between source and target total value",
            get() {
                return Number(this.getDataValue("balanceAmount"));
            }
        },
        notes: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true
        },
    }, {
        sequelize,
        tableName: "exchanges",
        timestamps: true,
        updatedAt: false // Exchanges are immutable logs
    });
    return Exchange;
};
