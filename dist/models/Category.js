"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    class Category extends sequelize_1.Model {
    }
    Category.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: "Category name cannot be empty" },
                len: {
                    args: [1, 100],
                    msg: "Name must be between 1 and 100 characters",
                },
            },
            set(value) {
                this.setDataValue("name", value.trim().toLowerCase());
            },
        },
    }, {
        sequelize,
        tableName: "categories",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["name"],
            },
        ],
    });
    return Category;
};
