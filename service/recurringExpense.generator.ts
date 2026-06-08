import { Op, Transaction } from 'sequelize';
import db from '../models';
const { RecurringExpense, Expense, RecurringExpenseLastGenerated } = db;

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export class RecurringExpenseGenerator {
  /**
   * Generate due expenses up to the current date.
   * Uses lastGeneratedDate + checks existing expenses to avoid duplicates.
   */
  static async generateDueExpenses(
    asOfDate: Date = new Date(),
    dryRun: boolean = false
  ): Promise<{ generated: number; skipped: number; errors: string[] }> {
    const result = { generated: 0, skipped: 0, errors: [] as string[] };
    const activeRecurrings = await db.RecurringExpense.findAll({
      where: { isActive: true },
    });

    for (const recurring of activeRecurrings) {
      try {
        const lastGen = await db.RecurringExpenseLastGenerated.findByPk(recurring.id);
        const lastDate = lastGen?.lastGeneratedDate || new Date(0);

        // Generate all missing occurrences between lastDate+1 and asOfDate
        const datesToGenerate = this.getDatesInRange(recurring, lastDate, asOfDate);

        for (const targetDate of datesToGenerate) {
          const alreadyExists = await this.expenseExistsForPeriod(recurring, targetDate);
          if (alreadyExists) {
            result.skipped++;
            continue;
          }

          if (!dryRun) {
            await this.createExpenseFromRecurring(recurring, targetDate);
            // Update lastGeneratedDate to this target date after successful generation
            await db.RecurringExpenseLastGenerated.upsert({
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
   * @param dryRun if true, only returns count without inserting.
   */
  static async generateBacklog(
    recurringId: string,
    startDate: Date,
    endDate: Date,
    dryRun: boolean = false
  ): Promise<number> {
    const recurring = await db.RecurringExpense.findByPk(recurringId);
    if (!recurring) throw new Error('Recurring expense not found');

    const allDates = this.getDatesInRange(recurring, startDate, endDate);
    let generatedCount = 0;

    for (const targetDate of allDates) {
      const exists = await this.expenseExistsForPeriod(recurring, targetDate);
      if (exists) continue;

      if (!dryRun) {
        await this.createExpenseFromRecurring(recurring, targetDate);
        // Update lastGeneratedDate only if this date is newer
        const lastGen = await db.RecurringExpenseLastGenerated.findByPk(recurring.id);
        if (!lastGen || lastGen.lastGeneratedDate < targetDate) {
          await db.RecurringExpenseLastGenerated.upsert({
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
  // PRIVATE HELPERS (AI‑level duplicate detection & date logic)
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
    const start = new Date(fromDate);
    // Move start to the next possible occurrence
    let current = this.getNextOccurrenceAfter(recurring, start);
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

      case 'weekly':
        // Move to next same weekday? For simplicity, we use 7‑day step.
        // More accurate: find next Monday (or day of week) – but billingDay not used.
        // We'll assume weekly means every 7 days from first occurrence.
        // To keep it simple and deterministic, we just add 7 days.
        return new Date(candidate.getTime() + 7 * 86400000);

      case 'monthly': {
        let target = new Date(candidate);
        target.setDate(billingDay);
        if (target <= candidate) {
          target.setMonth(target.getMonth() + 1);
          target.setDate(billingDay);
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

  /**
   * AI‑level duplicate check:
   * For monthly expenses – checks if an expense already exists for the same month.
   * For weekly/daily – checks exact date.
   * Also considers that two different recurring expenses with same category/amount/billingDay
   * might be considered duplicates? Here we check ONLY the same recurringExpenseId.
   * If you want cross‑template duplicate detection (e.g., same category+amount+billingDay), uncomment the optional block.
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

    const whereClause: any = {
      recurringExpenseId: recurring.id,
      expenseDate: {
        [Op.between]: [startOfPeriod, endOfPeriod],
      },
    };

    // Optional AI enhancement: also detect duplicates across different recurringExpenseId
    // that have same category, amount, and expenseDate (if you consider them "same").
    // Uncomment below if needed:


    const crossCheck = await db.Expense.findOne({
      where: {
        categoryId: recurring.categoryId,
        amount: recurring.amount,
        expenseDate: {
          [Op.between]: [startOfPeriod, endOfPeriod],
        },
        referenceType: 'recurring',
        recurringExpenseId: { [Op.ne]: recurring.id },
      },
    });
    if (crossCheck) return true;

    const exists = await db.Expense.findOne({ where: whereClause });
    return !!exists;
  }

  private static async createExpenseFromRecurring(
    recurring: any,
    expenseDate: Date
  ): Promise<any> {
    return await db.Expense.create({
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