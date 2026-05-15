// models/Income.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum IncomeSource {
  SALE = "sale",
  INVESTMENT = "investment",
  LOAN = "loan",
  OTHER = "other",
}

interface IncomeAttributes {
  id: string;
  bankAccountId: string;        // into which account money is deposited
  source: IncomeSource;
  amount: number;
  description?: string | null;
  referenceId?: string | null;  // e.g. Sale.id if source = sale
  receivedDate: Date;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type IncomeCreationAttributes = Optional<
  IncomeAttributes,
  "id" | "createdAt" | "updatedAt" | "description" | "referenceId" | "notes"
>;

export default (sequelize: Sequelize) => {
  class Income
    extends Model<IncomeAttributes, IncomeCreationAttributes>
    implements IncomeAttributes
  {
    public id!: string;
    public bankAccountId!: string;
    public source!: IncomeSource;
    public amount!: number;
    public description!: string | null;
    public referenceId!: string | null;
    public receivedDate!: Date;
    public notes!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Income.init(
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
      source: {
        type: DataTypes.ENUM(...Object.values(IncomeSource)),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      description: { type: DataTypes.STRING(200), allowNull: true },
      referenceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      receivedDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: "incomes",
      timestamps: true,
      indexes: [
        { fields: ["bankAccountId"] },
        { fields: ["source"] },
        { fields: ["receivedDate"] },
      ],
    }
  );

  return Income;
};