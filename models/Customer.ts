// models/Customer.ts
import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface CustomerAttributes {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  totalCreditLimit: number;    // maximum allowed credit
  currentCreditUsed: number;   // auto‑calculated
  createdAt?: Date;
  updatedAt?: Date;
}

type CustomerCreationAttributes = Optional<
  CustomerAttributes,
  "id" | "createdAt" | "updatedAt" | "phone" | "email" | "address" | "currentCreditUsed"
>;

export default (sequelize: Sequelize) => {
  class Customer
    extends Model<CustomerAttributes, CustomerCreationAttributes>
    implements CustomerAttributes
  {
    public id!: string;
    public name!: string;
    public phone!: string | null;
    public email!: string | null;
    public address!: string | null;
    public totalCreditLimit!: number;
    public currentCreditUsed!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Customer.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      email: { type: DataTypes.STRING(100), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      totalCreditLimit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currentCreditUsed: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: "customers",
      timestamps: true,
    }
  );

  return Customer;
};