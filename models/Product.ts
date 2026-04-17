import { DataTypes, Model, Sequelize, Optional } from "sequelize";

/**
 * =====================
 * TYPES
 * =====================
 */
interface ProductAttributes {
  id: string;
  name: string;

  categoryId: string;
  brandId: string;
  packagingId: string;

  bottlesPerBox: number;

  boxBuyPrice: number;
  boxSellPrice: number;
  singleSellPrice: number;

  createdAt?: Date;
  updatedAt?: Date;
}

type ProductCreationAttributes = Optional<
  ProductAttributes,
  "id" | "createdAt" | "updatedAt"
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

    public categoryId!: string;
    public brandId!: string;
    public packagingId!: string;

    public bottlesPerBox!: number;

    public boxBuyPrice!: number;
    public boxSellPrice!: number;
    public singleSellPrice!: number;

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
          notEmpty: {
            msg: "Name is required",
          },
          len: {
            args: [1, 150],
            msg: "Name must be between 1 and 150 chars",
          },
        },

        set(value: string) {
          this.setDataValue("name", value.trim());
        },
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

        validate: {
          min: 1,
        },
      },

      /**
       * IMPORTANT: use DECIMAL for money
       */
      boxBuyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,

        validate: {
          min: 0,
        },
      },

      boxSellPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,

        validate: {
          min: 0,
        },
      },

      singleSellPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,

        validate: {
          min: 0,
        },
      },
    },
    {
      sequelize,
      tableName: "products",
      timestamps: true,

      indexes: [
        {
          fields: ["categoryId"],
        },
        {
          fields: ["brandId"],
        },
        {
          fields: ["packagingId"],
        },
      ],
    }
  );

  return Product;
};