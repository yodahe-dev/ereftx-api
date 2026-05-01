import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface ProductAttributes {
  id: string;
  name: string;
  description?: string | null;
  brandId: string;
  packagingId: string;
  unitsPerBox: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type ProductCreationAttributes = Optional<
  ProductAttributes,
  "id" | "createdAt" | "updatedAt" | "description"
>;

export default (sequelize: Sequelize) => {
  class Product
    extends Model<ProductAttributes, ProductCreationAttributes>
    implements ProductAttributes
  {
    public id!: string;
    public name!: string;
    public description!: string | null;
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      brandId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "brands",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      packagingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "packagings",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      unitsPerBox: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 24,
        validate: {
          isInt: { msg: "Units per box must be an integer" },
          min: {
            args: [1],
            msg: "A box must contain at least 1 unit",
          },
        },
      },
    },
    {
      sequelize,
      tableName: "products",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["name", "brandId", "packagingId"],
          name: "products_unique_variant",
        },
      ],
    }
  );

  return Product;
};