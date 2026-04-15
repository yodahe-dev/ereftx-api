import { DataTypes, Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class Product extends Model {}

  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: DataTypes.STRING,

      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      brandId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      packagingId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      bottlesPerBox: {
        type: DataTypes.INTEGER,
        defaultValue: 24,
      },

      boxBuyPrice: DataTypes.FLOAT,
      boxSellPrice: DataTypes.FLOAT,
      singleSellPrice: DataTypes.FLOAT,
    },
    {
      sequelize,
      tableName: "products",
      timestamps: true,
    }
  );

  return Product;
};