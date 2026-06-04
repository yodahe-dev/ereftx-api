import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly" | "custom";

interface RecurringExpenseAttributes {
  id: string;
  title: string;
  categoryId: string;
  amount: number;
  frequency: RecurringFrequency;
  billingDay: number;
  isActive: boolean;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type RecurringExpenseCreationAttributes = Optional<
  RecurringExpenseAttributes,
  "id" | "billingDay" | "isActive" | "notes" | "createdAt" | "updatedAt"
>;

export default (sequelize: Sequelize) => {
  class RecurringExpense
    extends Model<RecurringExpenseAttributes, RecurringExpenseCreationAttributes>
    implements RecurringExpenseAttributes
  {
    public id!: string;
    public title!: string;
    public categoryId!: string;
    public amount!: number;
    public frequency!: RecurringFrequency;
    public billingDay!: number;
    public isActive!: boolean;
    public notes!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  RecurringExpense.init(
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
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
        get() {
          return Number(this.getDataValue("amount"));
        },
      },
      frequency: {
        type: DataTypes.ENUM("daily", "weekly", "monthly", "yearly", "custom"),
        allowNull: false,
        defaultValue: "monthly",
      },
      billingDay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1, max: 31 },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "recurring_expenses",
      timestamps: true,
    }
  );

  return RecurringExpense;
};