import { DataTypes, Model, Sequelize, Optional } from "sequelize";

/**
 * =====================
 * TYPES
 * =====================
 */

interface CategoryAttributes {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type CategoryCreationAttributes = Optional<
  CategoryAttributes,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * =====================
 * MODEL
 * =====================
 */

export default (sequelize: Sequelize) => {
  class Category
    extends Model<CategoryAttributes, CategoryCreationAttributes>
    implements CategoryAttributes
  {
    public id!: string;
    public name!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Category.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,

        validate: {
          notEmpty: {
            msg: "Name cannot be empty",
          },
          len: {
            args: [1, 100],
            msg: "Name must be between 1 and 100 characters",
          },
        },
        set(value: string) {
          this.setDataValue("name", value.trim().toLowerCase());
        },
      },
    },
    {
      sequelize,
      tableName: "categories",
      timestamps: true,

      /**
       * extra safety
       */
      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
      ],
    }
  );

  return Category;
};