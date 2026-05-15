// models/Loan.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum LoanType {
  BORROW = "borrow",   // we owe money
  LEND = "lend",       // someone owes us
}

export enum LoanStatus {
  ACTIVE = "active",
  PAID = "paid",
  DEFAULTED = "defaulted",
}

interface LoanAttributes {
  id: string;
  type: LoanType;
  counterpartyName: string;           // who is on the other side
  counterpartyId?: string | null;     // e.g. Customer.id or BankAccount.id
  bankAccountId: string;              // which of our accounts is involved
  principalAmount: number;
  interestRate: number;               // annual percentage
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date | null;
  totalRepaid: number;                // sum of all repayments so far
  status: LoanStatus;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type LoanCreationAttributes = Optional<
  LoanAttributes,
  "id" | "createdAt" | "updatedAt" | "counterpartyId" | "actualEndDate" | "notes" | "totalRepaid"
>;

export default (sequelize: Sequelize) => {
  class Loan
    extends Model<LoanAttributes, LoanCreationAttributes>
    implements LoanAttributes
  {
    public id!: string;
    public type!: LoanType;
    public counterpartyName!: string;
    public counterpartyId!: string | null;
    public bankAccountId!: string;
    public principalAmount!: number;
    public interestRate!: number;
    public startDate!: Date;
    public expectedEndDate!: Date;
    public actualEndDate!: Date | null;
    public totalRepaid!: number;
    public status!: LoanStatus;
    public notes!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Loan.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM(...Object.values(LoanType)),
        allowNull: false,
      },
      counterpartyName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      counterpartyId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Optional FK to Customer or BankAccount (polymorphic)",
      },
      bankAccountId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "bank_accounts", key: "id" },
        onDelete: "RESTRICT",
      },
      principalAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      interestRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Annual interest rate in percent",
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expectedEndDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      actualEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalRepaid: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(LoanStatus)),
        allowNull: false,
        defaultValue: LoanStatus.ACTIVE,
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: "loans",
      timestamps: true,
      indexes: [
        { fields: ["bankAccountId"] },
        { fields: ["status"] },
        { fields: ["type"] },
      ],
    }
  );

  return Loan;
};