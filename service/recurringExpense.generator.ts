import db from '../models';
import { RecurrenceCalculator } from '../utils/date.util';
import { Op, Sequelize } from 'sequelize';

/**
 * This service runs as a cron job (e.g., daily) to generate actual Expense records
 * for recurring expenses that are due and not yet generated.
 *
 * It uses a tracking table `recurring_expense_last_generated` to avoid duplicates.
 * If you don't want a separate table, you can store lastGeneratedDate in a JSON field,
 * but a tracking table is cleaner and indexable.
 */

interface LastGeneratedRecord {
  recurringExpenseId: string;
  lastGeneratedDate: Date;
}

// We'll assume you have a model `RecurringExpenseLastGenerated` – but if not,
// we can use a simple key-value store or add a column to recurring_expenses.
// For simplicity, we'll add a column `lastGeneratedAt` to `RecurringExpense` via migration.
// However, to keep this self-contained, I'll implement using a separate table.

// For production, add this model in your `models/RecurringExpenseLastGenerated.ts`:
/*
import { DataTypes, Model, Sequelize } from "sequelize";
export default (sequelize: Sequelize) => {
  class RecurringExpenseLastGenerated extends Model {
    public recurringExpenseId!: string;
    public lastGeneratedDate!: Date;
  }
  RecurringExpenseLastGenerated.init({
    recurringExpenseId: { type: DataTypes.UUID, primaryKey: true, references: { model: "recurring_expenses", key: "id" }, onDelete: "CASCADE" },
    lastGeneratedDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { sequelize, tableName: "recurring_expense_last_generated", timestamps: false });
  return RecurringExpenseLastGenerated;
};
*/

// For this service, we'll assume such a model exists as `db.RecurringExpenseLastGenerated`.

export class RecurringExpenseGenerator {
  /**
   * Generates expenses for all active recurring expenses that are due.
   * @param asOfDate - Date to check for due expenses (default: today)
   * @param dryRun - If true, only returns what would be generated without saving.
   * @returns Summary of generated expenses.
   */
  static async generateDueExpenses(asOfDate: Date = new Date(), dryRun = false): Promise<{
    generatedCount: number;
    skippedCount: number;
    errors: string[];
  }> {
    asOfDate.setHours(0, 0, 0, 0);
    const activeRecurring = await db.RecurringExpense.findAll({
      where: { isActive: true },
      include: [{ model: db.ExpenseCategory, as: 'category', attributes: ['id'] }],
    });

    let generatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process in batches to avoid overwhelming DB
    const BATCH_SIZE = 100;
    for (let i = 0; i < activeRecurring.length; i += BATCH_SIZE) {
      const batch = activeRecurring.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (recurring) => {
        try {
          const lastGenerated = await db.RecurringExpenseLastGenerated.findByPk(recurring.id);
          const lastDate = lastGenerated ? new Date(lastGenerated.lastGeneratedDate) : null;
          let nextDueDate: Date | null = lastDate ? RecurrenceCalculator.getNextDueDate(lastDate, recurring.frequency, recurring.billingDay) : new Date();

          // Ensure we don't generate for past dates before the recurring started? We'll assume from creation.
          // Simple logic: if nextDueDate <= asOfDate, generate one expense for that date.
          if (nextDueDate && nextDueDate <= asOfDate) {
            if (!dryRun) {
              // Create expense record
              await db.Expense.create({
                title: recurring.title,
                amount: recurring.amount,
                expenseDate: nextDueDate,
                categoryId: recurring.categoryId,
                recurringExpenseId: recurring.id,
                referenceType: 'recurring',
                notes: `Auto-generated from recurring expense: ${recurring.title}`,
              });
              // Update last generated
              await db.RecurringExpenseLastGenerated.upsert({
                recurringExpenseId: recurring.id,
                lastGeneratedDate: nextDueDate,
              });
            }
            generatedCount++;
          } else {
            skippedCount++;
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          errors.push(`Failed for ${recurring.id}: ${errorMessage}`);
        }
      }));
    }
    return { generatedCount, skippedCount, errors };
  }

  /**
   * One-time backfill for a specific recurring expense.
   */
  static async generateBacklog(recurringId: string, startDate: Date, endDate: Date, dryRun = false): Promise<number> {
    const recurring = await db.RecurringExpense.findByPk(recurringId);
    if (!recurring) throw new Error('Recurring expense not found');
    const dates = RecurrenceCalculator.generateOccurrences(startDate, recurring.frequency, recurring.billingDay, endDate);
    let count = 0;
    for (const date of dates) {
      if (!dryRun) {
        await db.Expense.create({
          title: recurring.title,
          amount: recurring.amount,
          expenseDate: date,
          categoryId: recurring.categoryId,
          recurringExpenseId: recurring.id,
          referenceType: 'recurring',
          notes: `Backfilled from recurring expense`,
        });
        await db.RecurringExpenseLastGenerated.upsert({
          recurringExpenseId: recurring.id,
          lastGeneratedDate: date,
        });
      }
      count++;
    }
    return count;
  }
}