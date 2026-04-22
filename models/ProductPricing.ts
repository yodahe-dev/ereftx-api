import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface ProductPriceAttributes {
  id: string;
  productId: string;

  buyPricePerBox: number;
  sellPricePerBox: number;
  sellPricePerUnit: number;

  startAt: Date;
  endAt?: Date | null;

  allowLoss: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

type ProductPriceCreationAttributes = Optional<
  ProductPriceAttributes,
  "id" | "createdAt" | "updatedAt" | "endAt" | "allowLoss"
>;

export default (sequelize: Sequelize) => {
  class ProductPrice
    extends Model<ProductPriceAttributes, ProductPriceCreationAttributes>
    implements ProductPriceAttributes
  {
    public id!: string;
    public productId!: string;

    public buyPricePerBox!: number;
    public sellPricePerBox!: number;
    public sellPricePerUnit!: number;

    public startAt!: Date;
    public endAt!: Date | null;

    public allowLoss!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  ProductPrice.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      buyPricePerBox: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("buyPricePerBox"));
        },
      },

      sellPricePerBox: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("sellPricePerBox"));
        },
      },

      sellPricePerUnit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          return Number(this.getDataValue("sellPricePerUnit"));
        },
      },

      startAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      endAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      allowLoss: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: "product_prices",
      timestamps: true,

      validate: {
        pricingGuard() {
          const buy = Number(this.buyPricePerBox);
          const sellBox = Number(this.sellPricePerBox);
          const sellUnit = Number(this.sellPricePerUnit);

          if (!this.allowLoss && sellBox < buy) {
            throw new Error("Sell price cannot be lower than buy price");
          }

          if (!this.allowLoss && sellUnit <= 0) {
            throw new Error("Invalid unit price");
          }
        },
      },
    }
  );

  return ProductPrice;
};