"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainerType = void 0;
const sequelize_1 = require("sequelize");
var ContainerType;
(function (ContainerType) {
    ContainerType["BOX"] = "box";
    ContainerType["SINGLE"] = "single";
})(ContainerType || (exports.ContainerType = ContainerType = {}));
exports.default = (sequelize) => {
    class Stock extends sequelize_1.Model {
    }
    Stock.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        productId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            unique: true, // A product only ever has ONE stock row
            references: {
                model: "products",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        boxQuantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
        },
        singleQuantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
        },
        containerType: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(ContainerType)),
            allowNull: false,
            defaultValue: ContainerType.BOX,
        },
    }, {
        sequelize,
        tableName: "stocks",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["productId"],
            },
        ],
    });
    return Stock;
};
