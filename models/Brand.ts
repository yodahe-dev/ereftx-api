import { DataTypes, Model, Sequelize, Optional } from "sequelize";

/**
 * =====================
 * TYPES
 * =====================
 */
interface BrandAttributes {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type BrandCreationAttributes = Optional<
  BrandAttributes,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * =====================
 * MODEL
 * =====================
 */
export default (sequelize: Sequelize) => {
  class Brand
    extends Model<BrandAttributes, BrandCreationAttributes>
    implements BrandAttributes
  {
    public id!: string;
    public name!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Brand.init(
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

        /**
         * normalize input
         */
        set(value: string) {
          this.setDataValue("name", value.trim().toLowerCase());
        },
      },
    },
    {
      sequelize,
      tableName: "brands",
      timestamps: true,

      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
      ],
    }
  );

  return Brand;
};