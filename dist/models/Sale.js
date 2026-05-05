"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    class Sale extends sequelize_1.Model {
    }
    Sale.init({
        id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
        invoiceNumber: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
            defaultValue: () => `INV-${Date.now()}`
        },
        customerName: {
            type: sequelize_1.DataTypes.STRING(120),
            allowNull: false,
            set(value) { this.setDataValue("customerName", value.trim()); }
        },
        description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        totalAmount: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        totalCost: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        profit: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        paymentType: { type: sequelize_1.DataTypes.ENUM("cash", "credit"), allowNull: false },
        paymentStatus: { type: sequelize_1.DataTypes.ENUM("paid", "pending"), allowNull: false, defaultValue: "paid" },
    }, {
        sequelize,
        tableName: "sales",
        timestamps: true,
        indexes: [
            { fields: ["invoiceNumber"], unique: true },
            { fields: ["createdAt"] },
            { fields: ["paymentStatus"] }
        ]
    });
    return Sale;
};
