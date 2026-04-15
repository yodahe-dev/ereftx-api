import { DataTypes, Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class Sale extends Model {}

  Sale.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      totalAmount: DataTypes.DECIMAL(10, 2),
      totalCost: DataTypes.DECIMAL(10, 2),
      profit: DataTypes.DECIMAL(10, 2),

      paymentType: DataTypes.ENUM("cash", "credit"),
    },
    {
      sequelize,
      tableName: "sales",
      timestamps: true,
    }
  );

  return Sale;
};