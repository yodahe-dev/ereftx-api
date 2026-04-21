import { DataTypes, Model, Sequelize, Optional } from "sequelize";

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

  allowLoss: boolean; // ✅ NEW

  readonly singleBuyingPrice?: number;
  readonly profitPerBox?: number;
  readonly profitPerBottle?: number;

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
  | "profitPerBox"
  | "profitPerBottle"
  | "allowLoss"
>;

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

    public allowLoss!: boolean;

    public readonly singleBuyingPrice!: number;
    public readonly profitPerBox!: number;
    public readonly profitPerBottle!: number;

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
        defaultValue: 24,
      },

      boxBuyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("boxBuyPrice"));
        },
      },

      boxSellPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("boxSellPrice"));
        },
      },

      singleSellPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("singleSellPrice"));
        },
      },

      priceStartDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      priceEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // ✅ NEW
      allowLoss: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // ✅ computed
      singleBuyingPrice: {
        type: DataTypes.VIRTUAL,
        get() {
          const boxBuy = Number(this.getDataValue("boxBuyPrice"));
          const bottles = this.getDataValue("bottlesPerBox") || 1;
          return boxBuy / bottles;
        },
      },

      profitPerBox: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            Number(this.getDataValue("boxSellPrice")) -
            Number(this.getDataValue("boxBuyPrice"))
          );
        },
      },

      profitPerBottle: {
        type: DataTypes.VIRTUAL,
        get() {
          const singleSell = Number(this.getDataValue("singleSellPrice"));
          const buy = this.getDataValue("singleBuyingPrice") || 0;
          return singleSell - buy;
        },
      },
    },
    {
      sequelize,
      tableName: "products",
      timestamps: true,

      validate: {
        pricingGuard() {
          const boxBuy = Number(this.boxBuyPrice);
          const boxSell = Number(this.boxSellPrice);
          const singleSell = Number(this.singleSellPrice);
          const bottles = Number(this.bottlesPerBox || 1);

          const singleBuy = boxBuy / bottles;

          const isLoss =
            boxSell < boxBuy || singleSell < singleBuy;

          // ✅ only block if allowLoss = false
          if (isLoss && !this.allowLoss) {
            throw new Error(
              "Selling below cost is not allowed unless allowLoss = true"
            );
          }
        },
      },
    }
  );

  return Product;
};