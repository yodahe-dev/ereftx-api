import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface BrandAttributes {
  id: string;
  name: string;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

type BrandCreationAttributes = Optional<
  BrandAttributes,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export default (sequelize: Sequelize) => {
  class Brand
    extends Model<BrandAttributes, BrandCreationAttributes>
    implements BrandAttributes
  {
    declare id: string;
    declare name: string;
    declare categoryId: string;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare readonly deletedAt: Date | null;
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
        validate: {
          notEmpty: { msg: "Brand name is required" },
          len: {
            args: [2, 100],
            msg: "Brand name must be between 2 and 100 characters",
          },
        },
        set(value: string) {
          this.setDataValue("name", value.trim().toLowerCase());
        },
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
    },
    {
      sequelize,
      tableName: "brands",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ["name", "deletedAt"],
        },
      ],
    }
  );

  return Brand;
};