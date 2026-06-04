import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export type ExpenseReferenceType = "stock" | "personal" | "recurring" | "general" | "plan";
interface ExpenseAttributes {
  id: string;
  title: string;
  amount: number;
  expenseDate: Date;
  categoryId: string;
  recurringExpenseId?: string | null;
  expensePlanId?: string | null;
  productId?: string | null;
  referenceType: ExpenseReferenceType;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type ExpenseCreationAttributes = Optional<
  ExpenseAttributes,
  "id" | "expenseDate" | "recurringExpenseId" | "expensePlanId" | "productId" | "referenceType" | "notes" | "createdAt" | "updatedAt"
>;

export default (sequelize: Sequelize) => {
  class Expense
    extends Model<ExpenseAttributes, ExpenseCreationAttributes>
    implements ExpenseAttributes
  {
    public id!: string;
    public title!: string;
    public amount!: number;
    public expenseDate!: Date;
    public categoryId!: string;
    public recurringExpenseId!: string | null;
    public expensePlanId!: string | null;
    public productId!: string | null;
    public referenceType!: ExpenseReferenceType;
    public notes!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Expense.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
        set(value: string) {
          this.setDataValue("title", value.trim());
        },
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
        get() {
          return Number(this.getDataValue("amount"));
        },
      },
      expenseDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "expense_categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      recurringExpenseId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "recurring_expenses",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      expensePlanId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "expense_plans",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      referenceType: {
        type: DataTypes.ENUM("stock", "personal", "recurring", "general", "plan"),
        allowNull: false,
        defaultValue: "general",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true, // Journal feature to document specific context
      },
    },
    {
      sequelize,
      tableName: "expenses",
      timestamps: true,
      indexes: [
        { fields: ["expenseDate"] },
        { fields: ["categoryId"] },
        { fields: ["referenceType"] },
      ],
    }
  );

  return Expense;
};