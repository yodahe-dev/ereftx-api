// models/Expense.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum ExpenseCategory {
  RENT = "rent",
  UTILITIES = "utilities",
  SALARY = "salary",
  TRANSPORT = "transport",
  MARKETING = "marketing",
  STOCK_PURCHASE = "stock_purchase",
  OTHER = "other",
}

export enum ExpenseFrequency {
  ONE_TIME = "one_time",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

interface ExpenseAttributes {
  id: string;
  bankAccountId: string;
  loanId?: string | null;          // <-- NEW: if this expense was financed by a loan
  category: ExpenseCategory;
  description: string;
  amount: number;
  isScheduled: boolean;
  scheduledDate?: Date | null;
  frequency: ExpenseFrequency;
  nextDueDate?: Date | null;
  isPaid: boolean;
  paidDate?: Date | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type ExpenseCreationAttributes = Optional<
  ExpenseAttributes,
  "id" | "createdAt" | "updatedAt" | "scheduledDate" | "nextDueDate" | "paidDate" | "notes" | "loanId"
>;

export default (sequelize: Sequelize) => {
  class Expense
    extends Model<ExpenseAttributes, ExpenseCreationAttributes>
    implements ExpenseAttributes
  {
    public id!: string;
    public bankAccountId!: string;
    public loanId!: string | null;
    public category!: ExpenseCategory;
    public description!: string;
    public amount!: number;
    public isScheduled!: boolean;
    public scheduledDate!: Date | null;
    public frequency!: ExpenseFrequency;
    public nextDueDate!: Date | null;
    public isPaid!: boolean;
    public paidDate!: Date | null;
    public notes!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Expense.init(
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
      loanId: {                              // NEW
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "loans", key: "id" },
        onDelete: "SET NULL",
      },
      category: {
        type: DataTypes.ENUM(...Object.values(ExpenseCategory)),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      isScheduled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      scheduledDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      frequency: {
        type: DataTypes.ENUM(...Object.values(ExpenseFrequency)),
        allowNull: false,
        defaultValue: ExpenseFrequency.ONE_TIME,
      },
      nextDueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      paidDate: { type: DataTypes.DATE, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: "expenses",
      timestamps: true,
      indexes: [
        { fields: ["bankAccountId"] },
        { fields: ["category"] },
        { fields: ["isPaid"] },
        { fields: ["nextDueDate"] },
        { fields: ["loanId"] },            // NEW
      ],
    }
  );

  return Expense;
};