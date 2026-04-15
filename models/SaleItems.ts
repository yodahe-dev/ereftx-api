import { DataTypes, Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class SaleItem extends Model {}

  SaleItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      saleId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      productName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      category: {
        type: DataTypes.ENUM("beer", "wine", "softdrink", "liquor"),
        allowNull: false,
      },

      brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      bottleType: {
        type: DataTypes.ENUM("glass", "can", "pet"),
        allowNull: true,
      },

      unitType: {
        type: DataTypes.ENUM("box", "single"),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      unitPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },

      costPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },

      totalPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },

      profit: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "sale_items",
      timestamps: true,

      indexes: [
        { fields: ["saleId"] },
        { fields: ["productId"] },
        { fields: ["category"] },
      ],
    }
  );

  return SaleItem;
};