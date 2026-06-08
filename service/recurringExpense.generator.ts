import { Op } from 'sequelize';
import db from '../models';

const { RecurringExpense, Expense, RecurringExpenseLastGenerated } = db;

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export class RecurringExpenseGenerator {
  /**
   * Ensure all active recurring expenses have a lastGeneratedDate record.
   * Call this once during system startup or after migrations.
   */
  static async initializeLastGeneratedDates(): Promise<void> {
    const active = await RecurringExpense.findAll({ where: { isActive: true } });
    for (const rec of active) {
      const exists = await RecurringExpenseLastGenerated.findByPk(rec.id);
      if (!exists) {
        await RecurringExpenseLastGenerated.create({
          recurringExpenseId: rec.id,
          lastGeneratedDate: new Date(0),
        });
      }
    }
  }

  /**
   * Generate due expenses up to the current date.
   * Uses lastGeneratedDate + checks existing expenses to avoid duplicates.
   */
  static async generateDueExpenses(
    asOfDate: Date = new Date(),
    dryRun: boolean = false
  ): Promise<{ generated: number; skipped: number; errors: string[] }> {
    // Ensure all active recurring have a lastGenerated entry
    await this.initializeLastGeneratedDates();

    const result = { generated: 0, skipped: 0, errors: [] as string[] };
    const activeRecurrings = await RecurringExpense.findAll({
      where: { isActive: true },
    });

    if (activeRecurrings.length === 0) {
      result.errors.push('No active recurring expenses found.');
      return result;
    }

    for (const recurring of activeRecurrings) {
      try {
        const lastGenRecord = await RecurringExpenseLastGenerated.findByPk(recurring.id);
        let lastDate = lastGenRecord?.lastGeneratedDate || new Date(0);

        // If lastDate is in the future (should not happen), reset to 0
        if (lastDate > asOfDate) {
          lastDate = new Date(0);
          await RecurringExpenseLastGenerated.upsert({
            recurringExpenseId: recurring.id,
            lastGeneratedDate: lastDate,
          });
        }

        // Generate all missing occurrences between lastDate (exclusive) and asOfDate (inclusive)
        const datesToGenerate = this.getDatesInRange(recurring, lastDate, asOfDate);

        for (const targetDate of datesToGenerate) {
          const alreadyExists = await this.expenseExistsForPeriod(recurring, targetDate);
          if (alreadyExists) {
            result.skipped++;
            continue;
          }

          if (!dryRun) {
            await this.createExpenseFromRecurring(recurring, targetDate);
            // Update lastGeneratedDate to this target date
            await RecurringExpenseLastGenerated.upsert({
              recurringExpenseId: recurring.id,
              lastGeneratedDate: targetDate,
            });
          }
          result.generated++;
        }
      } catch (err: any) {
        result.errors.push(`[${recurring.id}] ${err.message}`);
      }
    }
    return result;
  }

  /**
   * Backfill missing expenses for a specific recurring expense between startDate and endDate.
   */
  static async generateBacklog(
    recurringId: string,
    startDate: Date,
    endDate: Date,
    dryRun: boolean = false
  ): Promise<number> {
    const recurring = await RecurringExpense.findByPk(recurringId);
    if (!recurring) throw new Error('Recurring expense not found');

    const allDates = this.getDatesInRange(recurring, startDate, endDate);
    let generatedCount = 0;

    for (const targetDate of allDates) {
      const exists = await this.expenseExistsForPeriod(recurring, targetDate);
      if (exists) continue;

      if (!dryRun) {
        await this.createExpenseFromRecurring(recurring, targetDate);
        // Update lastGeneratedDate if this date is newer than current
        const lastGen = await RecurringExpenseLastGenerated.findByPk(recurring.id);
        if (!lastGen || lastGen.lastGeneratedDate < targetDate) {
          await RecurringExpenseLastGenerated.upsert({
            recurringExpenseId: recurring.id,
            lastGeneratedDate: targetDate,
          });
        }
      }
      generatedCount++;
    }
    return generatedCount;
  }

  // ------------------------------------------------------------------
  // PRIVATE HELPERS
  // ------------------------------------------------------------------

  /**
   * Returns all dates between `fromDate` (exclusive) and `toDate` (inclusive)
   * that match the recurring expense's frequency.
   */
  private static getDatesInRange(
    recurring: any,
    fromDate: Date,
    toDate: Date
  ): Date[] {
    const dates: Date[] = [];
    let current = this.getNextOccurrenceAfter(recurring, fromDate);
    while (current <= toDate) {
      dates.push(new Date(current));
      current = this.getNextOccurrenceAfter(recurring, current);
    }
    return dates;
  }

  /**
   * Get the very next occurrence date strictly after `afterDate`.
   */
  private static getNextOccurrenceAfter(
    recurring: any,
    afterDate: Date
  ): Date {
    const { frequency, billingDay } = recurring;
    const candidate = new Date(afterDate);
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(candidate.getDate() + 1); // start next day

    switch (frequency) {
      case 'daily':
        return candidate;

      case 'weekly': {
        // Weekly: always add 7 days from candidate
        return new Date(candidate.getTime() + 7 * 86400000);
      }

      case 'monthly': {
        let target = new Date(candidate);
        // Set to the billing day, but handle month end
        let targetDay = Math.min(billingDay, this.daysInMonth(target));
        target.setDate(targetDay);
        if (target <= candidate) {
          target = new Date(candidate);
          target.setMonth(target.getMonth() + 1);
          targetDay = Math.min(billingDay, this.daysInMonth(target));
          target.setDate(targetDay);
        }
        return target;
      }

      case 'yearly': {
        let target = new Date(candidate);
        target.setMonth(0, 1); // Jan 1
        if (target <= candidate) target.setFullYear(target.getFullYear() + 1);
        return target;
      }

      default:
        // custom – treat as monthly with billingDay=1
        let target = new Date(candidate);
        target.setDate(1);
        if (target <= candidate) target.setMonth(target.getMonth() + 1);
        return target;
    }
  }

  private static daysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Check if an expense already exists for the same period (month for monthly, date for others)
   * and also cross-check other recurring templates to avoid duplicates.
   */
  private static async expenseExistsForPeriod(
    recurring: any,
    targetDate: Date
  ): Promise<boolean> {
    const startOfPeriod = new Date(targetDate);
    const endOfPeriod = new Date(targetDate);

    switch (recurring.frequency) {
      case 'monthly':
        startOfPeriod.setDate(1);
        startOfPeriod.setHours(0, 0, 0, 0);
        endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
        endOfPeriod.setDate(0);
        endOfPeriod.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        startOfPeriod.setMonth(0, 1);
        startOfPeriod.setHours(0, 0, 0, 0);
        endOfPeriod.setMonth(11, 31);
        endOfPeriod.setHours(23, 59, 59, 999);
        break;
      default:
        startOfPeriod.setHours(0, 0, 0, 0);
        endOfPeriod.setHours(23, 59, 59, 999);
    }

    // Check within the same recurring expense
    const sameTemplateExists = await Expense.findOne({
      where: {
        recurringExpenseId: recurring.id,
        expenseDate: { [Op.between]: [startOfPeriod, endOfPeriod] },
      },
    });
    if (sameTemplateExists) return true;

    // Cross‑template duplicate detection: same category, amount, and period
    const crossExists = await Expense.findOne({
      where: {
        categoryId: recurring.categoryId,
        amount: recurring.amount,
        expenseDate: { [Op.between]: [startOfPeriod, endOfPeriod] },
        referenceType: 'recurring',
        recurringExpenseId: { [Op.ne]: recurring.id },
      },
    });
    return !!crossExists;
  }

  private static async createExpenseFromRecurring(
    recurring: any,
    expenseDate: Date
  ): Promise<any> {
    return await Expense.create({
      title: recurring.title,
      amount: recurring.amount,
      expenseDate,
      categoryId: recurring.categoryId,
      recurringExpenseId: recurring.id,
      referenceType: 'recurring',
      notes: `Auto‑generated from recurring template ${recurring.id}`,
    });
  }
}