"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    class Packaging extends sequelize_1.Model {
    }
    Packaging.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: "Packaging type cannot be empty",
                },
                len: {
                    args: [1, 50],
                    msg: "Packaging type too long",
                },
            },
            set(value) {
                this.setDataValue("name", value.trim().toLowerCase());
            },
        },
    }, {
        sequelize,
        tableName: "packagings",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["name"],
            },
        ],
    });
    return Packaging;
};
