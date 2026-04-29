import { DataTypes, Model, Sequelize, Optional } from "sequelize";
import type { SaleItem } from "./SaleItems";

export type PaymentType = "cash" | "credit";
export type PaymentStatus = "paid" | "pending";

interface SaleAttributes {
  id: string;
  invoiceNumber: string;
  customerName: string;
  description?: string | null;
  totalAmount: number;
  totalCost: number;
  profit: number;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

type SaleCreationAttributes = Optional<
  SaleAttributes,
  "id" | "createdAt" | "updatedAt" | "totalAmount" | "totalCost" | "profit" | "description" | "invoiceNumber"
>;

export default (sequelize: Sequelize) => {
  class Sale extends Model<SaleAttributes, SaleCreationAttributes> implements SaleAttributes {
    public id!: string;
    public invoiceNumber!: string;
    public customerName!: string;
    public description!: string | null;
    public totalAmount!: number;
    public totalCost!: number;
    public profit!: number;
    public paymentType!: PaymentType;
    public paymentStatus!: PaymentStatus;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // ✅ ADD THIS (FIX)
    public items?: SaleItem[];
  }

  Sale.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: () => `INV-${Date.now()}`
    },
    customerName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      set(value: string) { this.setDataValue("customerName", value.trim()); }
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    totalCost: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    profit: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    paymentType: { type: DataTypes.ENUM("cash", "credit"), allowNull: false },
    paymentStatus: { type: DataTypes.ENUM("paid", "pending"), allowNull: false, defaultValue: "paid" },
  }, {
    sequelize,
    tableName: "sales",
    timestamps: true,
    indexes: [
      { fields: ["invoiceNumber"], unique: true },
      { fields: ["createdAt"] },
      { fields: ["paymentStatus"] }
    ]
  });

  return Sale;
};