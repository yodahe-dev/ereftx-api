import { DataTypes, Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class RecurringExpenseLastGenerated extends Model {
    public recurringExpenseId!: string;
    public lastGeneratedDate!: Date;
  }
  RecurringExpenseLastGenerated.init(
    {
      recurringExpenseId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: "recurring_expenses", key: "id" },
        onDelete: "CASCADE",
      },
      lastGeneratedDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "recurring_expense_last_generated", timestamps: false }
  );
  return RecurringExpenseLastGenerated;
};