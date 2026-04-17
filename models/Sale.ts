import { DataTypes, Model, Sequelize, Optional } from "sequelize";

/**
 * =====================
 * ENUM
 * =====================
 */
export enum PaymentType {
  CASH = "cash",
  CREDIT = "credit",
}

/**
 * =====================
 * TYPES
 * =====================
 */
interface SaleAttributes {
  id: string;

  totalAmount: number;
  totalCost: number;
  profit: number;

  paymentType: PaymentType;

  createdAt?: Date;
  updatedAt?: Date;
}

type SaleCreationAttributes = Optional<
  SaleAttributes,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * =====================
 * MODEL
 * =====================
 */
export default (sequelize: Sequelize) => {
  class Sale
    extends Model<SaleAttributes, SaleCreationAttributes>
    implements SaleAttributes
  {
    public id!: string;

    public totalAmount!: number;
    public totalCost!: number;
    public profit!: number;

    public paymentType!: PaymentType;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Sale.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,

        validate: {
          min: 0,
        },
      },

      totalCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,

        validate: {
          min: 0,
        },
      },

      profit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      paymentType: {
        type: DataTypes.ENUM(...Object.values(PaymentType)),
        allowNull: false,

        validate: {
          isIn: {
            args: [Object.values(PaymentType)],
            msg: "Invalid payment type",
          },
        },
      },
    },
    {
      sequelize,
      tableName: "sales",
      timestamps: true,
    }
  );

  return Sale;
};