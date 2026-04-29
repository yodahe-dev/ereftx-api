import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export type UnitType = "box" | "single";

export interface SaleItemAttributes {
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

export type SaleItemCreationAttributes = Optional<
  SaleItemAttributes,
  "id" | "createdAt" | "updatedAt" | "totalUnits"
>;

// ✅ EXPORT CLASS (IMPORTANT FOR TYPES)
export class SaleItem
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

// ✅ DEFAULT EXPORT (SEQUELIZE INIT)
export default (sequelize: Sequelize) => {
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
        references: {
          model: "sales",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
      },

      priceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "product_prices",
          key: "id",
        },
      },

      unitType: {
        type: DataTypes.ENUM("box", "single"),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
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
      },

      costPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      totalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      totalCost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "sale_items",
      timestamps: true,
      indexes: [
        { fields: ["saleId"] },
        { fields: ["productId"] },
      ],
    }
  );

  return SaleItem;
};