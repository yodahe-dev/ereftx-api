import { DataTypes, Model, Sequelize, Optional } from "sequelize";

/**
 * =====================
 * TYPES
 * =====================
 */
interface ProductAttributes {
  id: string;
  name: string;

  sku?: string | null;
  description?: string | null;

  isActive: boolean;

  categoryId: string;
  brandId: string;
  packagingId: string;

  bottlesPerBox: number;

  boxBuyPrice: number;
  boxSellPrice: number;
  singleSellPrice: number;

  priceStartDate: Date;
  priceEndDate?: Date | null;

  readonly singleBuyingPrice?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

type ProductCreationAttributes = Optional<
  ProductAttributes,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "sku"
  | "description"
  | "priceEndDate"
  | "singleBuyingPrice"
>;

/**
 * =====================
 * MODEL
 * =====================
 */
export default (sequelize: Sequelize) => {
  class Product
    extends Model<ProductAttributes, ProductCreationAttributes>
    implements ProductAttributes
  {
    public id!: string;
    public name!: string;

    public sku!: string | null;
    public description!: string | null;

    public isActive!: boolean;

    public categoryId!: string;
    public brandId!: string;
    public packagingId!: string;

    public bottlesPerBox!: number;

    public boxBuyPrice!: number;
    public boxSellPrice!: number;
    public singleSellPrice!: number;

    public priceStartDate!: Date;
    public priceEndDate!: Date | null;

    public readonly singleBuyingPrice!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Name is required" },
          len: {
            args: [1, 150],
            msg: "Name must be between 1 and 150 chars",
          },
        },
        set(value: string) {
          this.setDataValue("name", value.trim());
        },
      },

      sku: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      brandId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      packagingId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      bottlesPerBox: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 24,
        validate: { min: 1 },
      },

      boxBuyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
        get() {
          return Number(this.getDataValue("boxBuyPrice"));
        },
      },

      boxSellPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
        get() {
          return Number(this.getDataValue("boxSellPrice"));
        },
      },

      singleSellPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
        get() {
          return Number(this.getDataValue("singleSellPrice"));
        },
      },

      priceStartDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      priceEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },

      singleBuyingPrice: {
        type: DataTypes.VIRTUAL,
        get() {
          const boxBuy = Number(this.getDataValue("boxBuyPrice"));
          const bottles = this.getDataValue("bottlesPerBox");

          if (!bottles) return 0;

          return boxBuy / bottles;
        },
      },
    },
    {
      sequelize,
      tableName: "products",
      timestamps: true,

      indexes: [
        { unique: true, fields: ["name", "brandId", "packagingId"] },
        { fields: ["categoryId"] },
        { fields: ["brandId"] },
        { fields: ["packagingId"] },
        { fields: ["sku"] },
        { fields: ["isActive"] },
      ],

      validate: {
        validPricing() {
          if (Number(this.boxSellPrice) < Number(this.boxBuyPrice)) {
            throw new Error("Box sell price must be >= buy price");
          }

          const perBottleBuy =
            Number(this.boxBuyPrice) / Number(this.bottlesPerBox);

          if (Number(this.singleSellPrice) < perBottleBuy) {
            throw new Error(
              "Single sell price must not be lower than buying price per bottle"
            );
          }
        },
      },
    }
  );

  return Product;
};