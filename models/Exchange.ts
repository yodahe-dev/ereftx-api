import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface ExchangeAttributes {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  sourceQuantity: number;
  targetQuantity: number;
  exchangeType: "box" | "single";
  exchangeValue: number;
  notes?: string;
  createdAt?: Date;
}

type ExchangeCreationAttributes = Optional<ExchangeAttributes, "id" | "notes" | "createdAt">;

export default (sequelize: Sequelize) => {
  class Exchange extends Model<ExchangeAttributes, ExchangeCreationAttributes> {
    public id!: string;
    public sourceProductId!: string;
    public targetProductId!: string;
    public sourceQuantity!: number;
    public targetQuantity!: number;
    public exchangeType!: "box" | "single";
    public exchangeValue!: number;
    public notes!: string | null;
    public readonly createdAt!: Date;
  }

  Exchange.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      sourceProductId: { type: DataTypes.UUID, allowNull: false },
      targetProductId: { type: DataTypes.UUID, allowNull: false },
      sourceQuantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
      targetQuantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
      exchangeType: { type: DataTypes.ENUM("box", "single"), allowNull: false },
      exchangeValue: { type: DataTypes.INTEGER, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: "exchanges", timestamps: true, updatedAt: false }
  );
  return Exchange;
};