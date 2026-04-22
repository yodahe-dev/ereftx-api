import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface ProductAttributes {
  id: string;

  name: string;

  categoryId: string;
  brandId: string;
  packagingId: string;

  unitsPerBox: number;

  createdAt?: Date;
  updatedAt?: Date;
}

type ProductCreationAttributes = Optional<
  ProductAttributes,
  "id" | "createdAt" | "updatedAt"
>;

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

    public unitsPerBox!: number;

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
        type: DataTypes.STRING(120),
        allowNull: false,
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

      unitsPerBox: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 24,
        validate: { min: 1 },
      },
    },
    {
      sequelize,
      tableName: "products",
      timestamps: true,
    }
  );

  return Product;
};