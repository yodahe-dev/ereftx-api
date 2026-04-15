import { DataTypes, Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class Stock extends Model {}

  Stock.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      productId: {
        type: DataTypes.UUID,  
        allowNull: false,
      },

      boxQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      singleQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      containerType: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "stocks",
      timestamps: true,
    }
  );

  return Stock;
};