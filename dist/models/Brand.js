"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    class Brand extends sequelize_1.Model {
    }
    Brand.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: { msg: "Brand name is required" },
                len: {
                    args: [2, 100],
                    msg: "Brand name must be between 2 and 100 characters",
                },
            },
            set(value) {
                this.setDataValue("name", value.trim().toLowerCase());
            },
        },
        categoryId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "categories",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },
    }, {
        sequelize,
        tableName: "brands",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["name", "deletedAt"],
            },
        ],
    });
    return Brand;
};
