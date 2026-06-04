import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface ExpenseCategoryAttributes {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null; // Self-referencing field for parent/subcategories
  createdAt?: Date;
  updatedAt?: Date;
}

type ExpenseCategoryCreationAttributes = Optional<
  ExpenseCategoryAttributes,
  "id" | "description" | "parentId" | "createdAt" | "updatedAt"
>;

export default (sequelize: Sequelize) => {
  class ExpenseCategory
    extends Model<ExpenseCategoryAttributes, ExpenseCategoryCreationAttributes>
    implements ExpenseCategoryAttributes
  {
    public id!: string;
    public name!: string;
    public description!: string | null;
    public parentId!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  ExpenseCategory.init(
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
          notEmpty: { msg: "Category name is required" },
        },
        set(value: string) {
          this.setDataValue("name", value.trim().toLowerCase());
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "expense_categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      sequelize,
      tableName: "expense_categories",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["name", "parentId"],
          name: "expense_categories_unique_name_per_parent",
        },
      ],
    }
  );

  return ExpenseCategory;
};