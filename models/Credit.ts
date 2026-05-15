// models/Credit.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum CreditStatus {
  PENDING = "pending",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  OVERDUE = "overdue",
}

interface CreditAttributes {
  id: string;
  customerId: string;
  saleId?: string | null;       // if the credit came from a specific sale
  totalAmount: number;           // original credit amount
  paidAmount: number;            // total paid so far
  remainingAmount: number;       // computed (total - paid)
  dueDate: Date;
  status: CreditStatus;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type CreditCreationAttributes = Optional<
  CreditAttributes,
  "id" | "createdAt" | "updatedAt" | "saleId" | "notes" | "paidAmount" | "remainingAmount" | "status"
>;

export default (sequelize: Sequelize) => {
  class Credit
    extends Model<CreditAttributes, CreditCreationAttributes>
    implements CreditAttributes
  {
    public id!: string;
    public customerId!: string;
    public saleId!: string | null;
    public totalAmount!: number;
    public paidAmount!: number;
    public remainingAmount!: number;
    public dueDate!: Date;
    public status!: CreditStatus;
    public notes!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Credit.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "customers", key: "id" },
        onDelete: "CASCADE",
      },
      saleId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "sales", key: "id" },
        onDelete: "SET NULL",
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paidAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      remainingAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(CreditStatus)),
        allowNull: false,
        defaultValue: CreditStatus.PENDING,
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: "credits",
      timestamps: true,
      indexes: [
        { fields: ["customerId"] },
        { fields: ["status"] },
        { fields: ["dueDate"] },
      ],
    }
  );

  return Credit;
};