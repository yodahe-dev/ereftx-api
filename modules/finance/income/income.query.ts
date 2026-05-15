import { Op, WhereOptions } from 'sequelize';
import db from '../../../models';
import { IncomeSearchInput } from './income.schema';

const { Income } = db;

export async function searchIncome(input: IncomeSearchInput) {
  const { query, bankAccountId, source, minAmount, maxAmount, startDate, endDate, sortBy, sortOrder, limit, offset } = input;

  const where: WhereOptions = {};
  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (source) where.source = source;
  if (minAmount !== undefined || maxAmount !== undefined) {
    const amountFilter: any = {};
    if (minAmount !== undefined) amountFilter[Op.gte] = minAmount;
    if (maxAmount !== undefined) amountFilter[Op.lte] = maxAmount;
    where.amount = amountFilter;
  }
  if (startDate || endDate) {
    where.receivedDate = {};
    if (startDate) where.receivedDate[Op.gte] = startDate;
    if (endDate) where.receivedDate[Op.lte] = endDate;
  }
  if (query && query.trim().length > 0) {
    (where as any)[Op.or] = [
      { description: { [Op.like]: `%${query}%` } },
      { notes: { [Op.like]: `%${query}%` } },
    ];
  }

  const { count, rows } = await Income.findAndCountAll({
    where,
    order: [[sortBy, sortOrder]],
    limit,
    offset,
  });
  return { data: rows, total: count };
}