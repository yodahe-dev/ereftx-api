import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum HistoryActionType {
  RESTOCK = "restock",
  ADJUST = "adjust",
  EXCHANGE = "exchange",
  INITIAL = "initial",
}

interface StockHistoryAttributes {
  id: string;
  productId: string;
  actionType: HistoryActionType;
  boxQuantityBefore: number;
  singleQuantityBefore: number;
  boxQuantityAfter: number;
  singleQuantityAfter: number;
  boxQuantityChange: number;
  singleQuantityChange: number;
  notes?: string | null;
  isFree: boolean;                 // new field
  createdAt?: Date;
  updatedAt?: Date;
}

type StockHistoryCreationAttributes = Optional<
  StockHistoryAttributes,
  "id" | "createdAt" | "updatedAt" | "isFree"
>;

export default (sequelize: Sequelize) => {
  class StockHistory
    extends Model<StockHistoryAttributes, StockHistoryCreationAttributes>
    implements StockHistoryAttributes
  {
    public id!: string;
    public productId!: string;
    public actionType!: HistoryActionType;
    public boxQuantityBefore!: number;
    public singleQuantityBefore!: number;
    public boxQuantityAfter!: number;
    public singleQuantityAfter!: number;
    public boxQuantityChange!: number;
    public singleQuantityChange!: number;
    public notes!: string | null;
    public isFree!: boolean;       // new field
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  StockHistory.init(
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
      actionType: {
        type: DataTypes.ENUM(...Object.values(HistoryActionType)),
        allowNull: false,
      },
      boxQuantityBefore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      singleQuantityBefore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      boxQuantityAfter: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      singleQuantityAfter: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      boxQuantityChange: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      singleQuantityChange: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isFree: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: "stock_history",
      timestamps: true,
    }
  );

  return StockHistory;
};