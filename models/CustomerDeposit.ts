// models/CustomerDeposit.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum DepositStatus {
  HELD = "held",
  PARTIALLY_RETURNED = "partially_returned",
  FULLY_RETURNED = "fully_returned",
}

interface CustomerDepositAttributes {
  id: string;
  customerId: string;
  amount: number;                    // total deposit amount held
  remainingAmount: number;           // amount still held (after partial returns)
  status: DepositStatus;
  relatedSaleId?: string | null;     // if the deposit came from a specific sale
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type CustomerDepositCreationAttributes = Optional<
  CustomerDepositAttributes,
  "id" | "createdAt" | "updatedAt" | "relatedSaleId" | "notes" | "remainingAmount"
>;

export default (sequelize: Sequelize) => {
  class CustomerDeposit
    extends Model<CustomerDepositAttributes, CustomerDepositCreationAttributes>
    implements CustomerDepositAttributes
  {
    public id!: string;
    public customerId!: string;
    public amount!: number;
    public remainingAmount!: number;
    public status!: DepositStatus;
    public relatedSaleId!: string | null;
    public notes!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  CustomerDeposit.init(
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
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      remainingAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(DepositStatus)),
        allowNull: false,
        defaultValue: DepositStatus.HELD,
      },
      relatedSaleId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "sales", key: "id" },
        onDelete: "SET NULL",
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: "customer_deposits",
      timestamps: true,
      indexes: [
        { fields: ["customerId"] },
        { fields: ["status"] },
      ],
    }
  );

  return CustomerDeposit;
};