import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface PackagingAttributes {
  id: string;
  type: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type PackagingCreationAttributes = Optional<
  PackagingAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export default (sequelize: Sequelize) => {
  class Packaging
    extends Model<PackagingAttributes, PackagingCreationAttributes>
    implements PackagingAttributes {
    public id!: string;
    public type!: string;
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
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,

        validate: {
          notEmpty: {
            msg: "Packaging type cannot be empty",
          },
          len: {
            args: [1, 50],
            msg: "Packaging type too long",
          },
        },
        set(value: string) {
          this.setDataValue("type", value.trim());
        }
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