import { DataTypes, Model, Sequelize, Optional } from "sequelize";

/**
 * =====================
 * ENUM (STRICT)
 * =====================
 */
export enum PackagingType {
  BOTTLE = "bottle",
  CAN = "can",
  PLASTIC = "plastic",
}

/**
 * =====================
 * TYPES
 * =====================
 */
interface PackagingAttributes {
  id: string;
  type: PackagingType;
  createdAt?: Date;
  updatedAt?: Date;
}

type PackagingCreationAttributes = Optional<
  PackagingAttributes,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * =====================
 * MODEL
 * =====================
 */
export default (sequelize: Sequelize) => {
  class Packaging
    extends Model<PackagingAttributes, PackagingCreationAttributes>
    implements PackagingAttributes
  {
    public id!: string;
    public type!: PackagingType;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Packaging.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      type: {
        type: DataTypes.ENUM(...Object.values(PackagingType)),
        allowNull: false,
        unique: true,

        validate: {
          isIn: {
            args: [Object.values(PackagingType)],
            msg: "Invalid packaging type",
          },
        },
      },
    },
    {
      sequelize,
      tableName: "packagings",
      timestamps: true,
    }
  );

  return Packaging;
};