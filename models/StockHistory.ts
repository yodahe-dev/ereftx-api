import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum HistoryActionType {
  RESTOCK = "restock",
  ADJUST = "adjust",
  EXCHANGE = "exchange",
  INITIAL = "initial",
  SALE = "sale",
}

interface StockHistoryAttributes {
  id: string;
  productId: string;
  priceId: string; // <--- The 100x Link: Which price was active?
  actionType: HistoryActionType;

  boxQuantityBefore: number;
  singleQuantityBefore: number;
  
  boxQuantityAfter: number;
  singleQuantityAfter: number;
  
  boxQuantityChange: number;
  singleQuantityChange: number;

  notes: string | null;
  isFree: boolean;
  saleId?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

type StockHistoryCreationAttributes = Optional<
  StockHistoryAttributes,
  "id" | "createdAt" | "updatedAt" | "saleId" | "priceId"
>;

export default (sequelize: Sequelize) => {
  class StockHistory
    extends Model<StockHistoryAttributes, StockHistoryCreationAttributes>
    implements StockHistoryAttributes
  {
    public id!: string;
    public productId!: string;
    public priceId!: string;
    public actionType!: HistoryActionType;

    public boxQuantityBefore!: number;
    public singleQuantityBefore!: number;
    public boxQuantityAfter!: number;
    public singleQuantityAfter!: number;
    public boxQuantityChange!: number;
    public singleQuantityChange!: number;

    public notes!: string | null;
    public isFree!: boolean;
    public saleId!: string | null;

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
        references: {
          model: "products",
          key: "id",
        },
      },
      priceId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Tracks the specific buy/sell price at the time of this movement",
        references: {
          model: "product_prices",
          key: "id",
        },
      },
      actionType: {
        type: DataTypes.ENUM(...Object.values(HistoryActionType)),
        allowNull: false,
      },
      boxQuantityBefore: { type: DataTypes.INTEGER, allowNull: false },
      singleQuantityBefore: { type: DataTypes.INTEGER, allowNull: false },
      boxQuantityAfter: { type: DataTypes.INTEGER, allowNull: false },
      singleQuantityAfter: { type: DataTypes.INTEGER, allowNull: false },
      boxQuantityChange: { type: DataTypes.INTEGER, allowNull: false },
      singleQuantityChange: { type: DataTypes.INTEGER, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      isFree: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      saleId: { 
        type: DataTypes.UUID, 
        allowNull: true,
        references: {
          model: "sales", // Assuming you have a sales table
          key: "id"
        }
      },
    },
    {
      sequelize,
      tableName: "stock_history",
      timestamps: true,
      indexes: [
        { fields: ["productId"] },
        { fields: ["priceId"] }, // Performance index for financial reports
        { fields: ["actionType"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  return StockHistory;
};