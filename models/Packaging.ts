import { DataTypes, Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class Packaging extends Model {}

  Packaging.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      type: {
        type: DataTypes.STRING, // bottle, can, plastic
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      tableName: "packagings",
      timestamps: true,
    }
  );

  return Packaging;
};