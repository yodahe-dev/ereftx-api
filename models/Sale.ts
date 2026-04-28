import { DataTypes, Model, Sequelize, Optional } from "sequelize";
// Import the model class to use its instance type
import SaleItemModel from "./SaleItems"; // default export is the class

export type PaymentType = "cash" | "credit";
export type PaymentStatus = "paid" | "pending";

interface SaleAttributes {
  id: string;
  name: string;                     // required
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
  "id" | "createdAt" | "updatedAt" | "totalAmount" | "totalCost" | "profit" | "description"
>;

export default (sequelize: Sequelize) => {
  class Sale
    extends Model<SaleAttributes, SaleCreationAttributes>
    implements SaleAttributes
  {
    public id!: string;
    public name!: string;
    public description!: string | null;
    public totalAmount!: number;
    public totalCost!: number;
    public profit!: number;
    public paymentType!: PaymentType;
    public paymentStatus!: PaymentStatus;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // 👇 Properly typed association
    public items?: InstanceType<ReturnType<typeof SaleItemModel>>[];
  }

  Sale.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        set(value: string) {
          this.setDataValue("name", value.trim());
        },
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        get() { return Number(this.getDataValue("totalAmount")); },
      },
      totalCost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        get() { return Number(this.getDataValue("totalCost")); },
      },
      profit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        get() { return Number(this.getDataValue("profit")); },
      },
      paymentType: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: { isIn: [["cash", "credit"]] },
      },
      paymentStatus: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "paid",
        validate: { isIn: [["paid", "pending"]] },
      },
    },
    {
      sequelize,
      tableName: "sales",
      timestamps: true,
      indexes: [
        { fields: ["createdAt"] },
        { fields: ["paymentType"] },
        { fields: ["paymentStatus"] },
      ],
    }
  );

  return Sale;
};