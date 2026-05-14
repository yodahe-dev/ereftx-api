import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface ProductPriceAttributes {
  id: string;
  productId: string;
  buyPricePerBox: number;
  sellPricePerBox: number;
  sellPricePerUnit: number;
  startAt: Date;
  endAt: Date | null;
  allowLoss: boolean;
}

type ProductPriceCreationAttributes = Optional<
  ProductPriceAttributes,
  "id" | "endAt"
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
    price: any;
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
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      buyPricePerBox: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      sellPricePerBox: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      sellPricePerUnit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      startAt: {
        type: DataTypes.DATE,
        allowNull: false,
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
      timestamps: false, // we manage startAt/endAt manually
    }
  );

  return ProductPrice;
};