// modules/finance/expense/expense.query.ts
import { Op, WhereOptions, Order } from 'sequelize';
import db from '../../../models';
import { ExpenseSearchInput } from './expense.schema';

const { Expense } = db;

export async function searchExpenses(input: ExpenseSearchInput) {
  const {
    query,
    bankAccountId,
    category,
    isPaid,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    limit,
    offset,
  } = input;

  const where: WhereOptions = {};

  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (category) where.category = category;
  if (isPaid !== undefined) where.isPaid = isPaid;

  if (minAmount !== undefined || maxAmount !== undefined) {
    const amountFilter: any = {};
    if (minAmount !== undefined) amountFilter[Op.gte] = minAmount;
    if (maxAmount !== undefined) amountFilter[Op.lte] = maxAmount;
    where.amount = amountFilter;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = startDate;
    if (endDate) where.createdAt[Op.lte] = endDate;
  }

  // Simple LIKE search on description and notes
  if (query && query.trim().length > 0) {
    (where as any)[Op.or] = [
      { description: { [Op.like]: `%${query}%` } },
      { notes: { [Op.like]: `%${query}%` } },
    ];
  }

  const { count, rows } = await Expense.findAndCountAll({
    where,
    order: [[sortBy, sortOrder]],
    limit,
    offset,
  });

  return { data: rows, total: count };
}