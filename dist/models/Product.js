"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    class Product extends sequelize_1.Model {
    }
    Product.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(120),
            allowNull: false,
            set(value) {
                this.setDataValue("name", value.trim());
            },
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        brandId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "brands",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },
        packagingId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "packagings",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },
        unitsPerBox: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 24,
            validate: {
                isInt: { msg: "Units per box must be an integer" },
                min: {
                    args: [1],
                    msg: "A box must contain at least 1 unit",
                },
            },
        },
    }, {
        sequelize,
        tableName: "products",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["name", "brandId", "packagingId"],
                name: "products_unique_variant",
            },
        ],
    });
    return Product;
};
