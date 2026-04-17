import { DataTypes, Model, Sequelize, Optional } from "sequelize";

/**
 * =====================
 * ENUMS
 * =====================
 */
export enum UnitType {
  BOX = "box",
  SINGLE = "single",
}

export enum BottleType {
  GLASS = "glass",
  CAN = "can",
  PET = "pet",
}

export enum ProductCategory {
  BEER = "beer",
  WINE = "wine",
  SOFTDRINK = "softdrink",
  LIQUOR = "liquor",
}

/**
 * =====================
 * TYPES
 * =====================
 */
interface SaleItemAttributes {
  id: string;

  saleId: string;
  productId: string;

  productName: string;
  category: ProductCategory;

  brand?: string | null;
  bottleType?: BottleType | null;

  unitType: UnitType;

  quantity: number;

  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  profit: number;

  createdAt?: Date;
  updatedAt?: Date;
}

type SaleItemCreationAttributes = Optional<
  SaleItemAttributes,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * =====================
 * MODEL
 * =====================
 */
export default (sequelize: Sequelize) => {
  class SaleItem
    extends Model<SaleItemAttributes, SaleItemCreationAttributes>
    implements SaleItemAttributes
  {
    public id!: string;

    public saleId!: string;
    public productId!: string;

    public productName!: string;
    public category!: ProductCategory;

    public brand!: string | null;
    public bottleType!: BottleType | null;

    public unitType!: UnitType;

    public quantity!: number;

    public unitPrice!: number;
    public costPrice!: number;
    public totalPrice!: number;
    public profit!: number;

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

      productName: {
        type: DataTypes.STRING(150),
        allowNull: false,

        validate: {
          notEmpty: true,
        },
      },

      category: {
        type: DataTypes.ENUM(...Object.values(ProductCategory)),
        allowNull: false,
      },

      brand: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      bottleType: {
        type: DataTypes.ENUM(...Object.values(BottleType)),
        allowNull: true,
      },

      unitType: {
        type: DataTypes.ENUM(...Object.values(UnitType)),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,

        validate: {
          min: 1,
        },
      },

      /**
       * MONEY SAFE (no FLOAT)
       */
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },

      costPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },

      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },

      profit: {
        type: DataTypes.DECIMAL(10, 2),
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
        { fields: ["category"] },
      ],
    }
  );

  return SaleItem;
};