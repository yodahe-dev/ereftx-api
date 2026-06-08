import { Op, Transaction } from 'sequelize';
import db from '../models';
import {
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
  RecurringExpenseListQuery,
} from '../validations/recurringExpense.schema';

const { RecurringExpense, Expense, ExpenseCategory, RecurringExpenseLastGenerated } = db;
type RecurringExpenseInstance = InstanceType<typeof RecurringExpense>;

export class RecurringExpenseService {
  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------
  static async create(data: CreateRecurringExpenseInput): Promise<RecurringExpenseInstance> {
    const existing = await RecurringExpense.findOne({
      where: {
        title: data.title,
        categoryId: data.categoryId,
        amount: data.amount,
        frequency: data.frequency,
        billingDay: data.billingDay,
      },
    });
    if (existing) {
      throw new Error('A recurring expense with identical details already exists');
    }
    return await RecurringExpense.create(data);
  }

  static async getById(id: string): Promise<RecurringExpenseInstance> {
    const record = await RecurringExpense.findByPk(id, {
      include: [{ model: ExpenseCategory, as: 'category' }],
    });
    if (!record) throw new Error('Recurring expense not found');
    return record;
  }

  static async update(id: string, data: UpdateRecurringExpenseInput): Promise<RecurringExpenseInstance> {
    const record = await this.getById(id);
    await record.update(data);
    // If frequency or billingDay changed, we should reset lastGeneratedDate
    if (data.frequency || data.billingDay) {
      await RecurringExpenseLastGenerated.upsert({
        recurringExpenseId: id,
        lastGeneratedDate: new Date(0), // force re-generation from beginning
      });
    }
    return record;
  }

  static async delete(id: string): Promise<void> {
    const record = await this.getById(id);
    await record.destroy();
  }

  static async list(query: RecurringExpenseListQuery): Promise<{
    rows: RecurringExpenseInstance[];
    count: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.categoryId) where.categoryId = query.categoryId;

    const { rows, count } = await RecurringExpense.findAndCountAll({
      where,
      include: [{ model: ExpenseCategory, as: 'category' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { rows, count, page, limit };
  }

  // ------------------------------------------------------------------
  // Preview upcoming dates (NO generation)
  // ------------------------------------------------------------------
  static async previewUpcoming(id: string, months: number = 6): Promise<Date[]> {
    const recurring = await this.getById(id);
    const start = new Date();
    const dates: Date[] = [];

    for (let i = 0; i < months; i++) {
      const nextDate = this.calculateNextDate(recurring, start, i);
      if (nextDate) dates.push(nextDate);
    }
    return dates;
  }

  // ------------------------------------------------------------------
  // Helper: calculate next occurrence date for a given offset
  // ------------------------------------------------------------------
  private static calculateNextDate(
    recurring: RecurringExpenseInstance,
    fromDate: Date,
    step: number = 0
  ): Date | null {
    const date = new Date(fromDate);
    switch (recurring.frequency) {
      case 'daily':
        date.setDate(date.getDate() + step);
        return date;
      case 'weekly':
        date.setDate(date.getDate() + step * 7);
        return date;
      case 'monthly':
        date.setMonth(date.getMonth() + step);
        date.setDate(recurring.billingDay);
        if (date.getDate() !== recurring.billingDay) date.setDate(0); // handle month end
        return date;
      case 'yearly':
        date.setFullYear(date.getFullYear() + step);
        return date;
      default:
        return null;
    }
  }
}