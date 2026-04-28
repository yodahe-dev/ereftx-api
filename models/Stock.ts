// models/Stock.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum ContainerType {
  BOX = "box",
  SINGLE = "single",
}

interface StockAttributes {
  id: string;
  productId: string;
  boxQuantity: number;
  singleQuantity: number;
  containerType: ContainerType;
  createdAt?: Date;
  updatedAt?: Date;
}

type StockCreationAttributes = Optional<
  StockAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export default (sequelize: Sequelize) => {
  class Stock
    extends Model<StockAttributes, StockCreationAttributes>
    implements StockAttributes
  {
    [x: string]: any;
    public id!: string;
    public productId!: string;
    public boxQuantity!: number;
    public singleQuantity!: number;
    public containerType!: ContainerType;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

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
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      singleQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      containerType: {
        type: DataTypes.ENUM(...Object.values(ContainerType)),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "stocks",
      timestamps: true,
      indexes: [{ unique: true, fields: ["productId"] }],
    }
  );

  return Stock;
};