// models/BankAccount.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export enum AccountType {
  BANK = "bank",
  CASH = "cash",
}

interface BankAccountAttributes {
  id: string;
  name: string;               // e.g. "Main Bank", "Cash Pocket"
  type: AccountType;
  bankName?: string | null;   // for bank accounts only
  accountNumber?: string | null;
  balance: number;            // current balance in ETB (computed, updated by service)
  createdAt?: Date;
  updatedAt?: Date;
}

type BankAccountCreationAttributes = Optional<
  BankAccountAttributes,
  "id" | "createdAt" | "updatedAt" | "bankName" | "accountNumber"
>;

export default (sequelize: Sequelize) => {
  class BankAccount
    extends Model<BankAccountAttributes, BankAccountCreationAttributes>
    implements BankAccountAttributes
  {
    public id!: string;
    public name!: string;
    public type!: AccountType;
    public bankName!: string | null;
    public accountNumber!: string | null;
    public balance!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  BankAccount.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(...Object.values(AccountType)),
        allowNull: false,
      },
      bankName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      accountNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      balance: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
    },
    {
      sequelize,
      tableName: "bank_accounts",
      timestamps: true,
    }
  );

  return BankAccount;
};