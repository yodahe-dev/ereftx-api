// models/BankTransaction.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  TRANSFER_IN = "transfer_in",
  TRANSFER_OUT = "transfer_out",
  EXPENSE = "expense",
  INCOME = "income",
  LOAN_DISBURSEMENT = "loan_disbursement",
  LOAN_REPAYMENT = "loan_repayment",
  CORRECTION = "correction",
}

interface BankTransactionAttributes {
  id: string;
  bankAccountId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string | null;      // e.g. Expense.id, Income.id, Loan.id
  description?: string | null;
  createdAt?: Date;
}

type BankTransactionCreationAttributes = Optional<
  BankTransactionAttributes,
  "id" | "createdAt" | "referenceId" | "description"
>;

export default (sequelize: Sequelize) => {
  class BankTransaction
    extends Model<BankTransactionAttributes, BankTransactionCreationAttributes>
    implements BankTransactionAttributes
  {
    public id!: string;
    public bankAccountId!: string;
    public type!: TransactionType;
    public amount!: number;
    public balanceBefore!: number;
    public balanceAfter!: number;
    public referenceId!: string | null;
    public description!: string | null;
    public readonly createdAt!: Date;
  }

  BankTransaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bankAccountId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "bank_accounts", key: "id" },
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.ENUM(...Object.values(TransactionType)),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      balanceBefore: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      balanceAfter: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      referenceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "bank_transactions",
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ["bankAccountId"] },
        { fields: ["type"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  return BankTransaction;
};