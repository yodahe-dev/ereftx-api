import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export type UnitType = "box" | "single";

interface SaleItemAttributes {
  id: string;

  saleId: string;
  productId: string;
  priceId: string;

  unitType: UnitType;
  quantity: number;

  totalUnits: number;

  productName: string;

  unitPrice: number;
  costPrice: number;

  totalPrice: number;
  totalCost: number;

  createdAt?: Date;
  updatedAt?: Date;
}

type SaleItemCreationAttributes = Optional<
  SaleItemAttributes,
  "id" | "createdAt" | "updatedAt" | "totalUnits"
>;

export default (sequelize: Sequelize) => {
  class SaleItem
    extends Model<SaleItemAttributes, SaleItemCreationAttributes>
    implements SaleItemAttributes
  {
    public id!: string;

    public saleId!: string;
    public productId!: string;
    public priceId!: string;

    public unitType!: UnitType;
    public quantity!: number;

    public totalUnits!: number;

    public productName!: string;

    public unitPrice!: number;
    public costPrice!: number;

    public totalPrice!: number;
    public totalCost!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  SaleItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      saleId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      priceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      unitType: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          isIn: [["box", "single"]],
        },
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },

      totalUnits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      productName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      unitPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("unitPrice"));
        },
      },

      costPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("costPrice"));
        },
      },

      totalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("totalPrice"));
        },
      },

      totalCost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("totalCost"));
        },
      },
    },
    {
      sequelize,
      tableName: "sale_items",
      timestamps: true,

      indexes: [
        { fields: ["saleId"] },
        { fields: ["productId"] },
        { fields: ["priceId"] },
      ],

      hooks: {
        beforeValidate: (item: SaleItem) => {
          if (item.quantity <= 0) {
            throw new Error("Quantity must be greater than 0");
          }

          if (item.totalUnits < 0) {
            throw new Error("Invalid total units");
          }
        },
      },
    }
  );

  return SaleItem;
};