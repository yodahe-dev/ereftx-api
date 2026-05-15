import { Op, WhereOptions } from 'sequelize';
import db from '../../../models';
import { LoanSearchInput } from './loan.schema';

const { Loan } = db;

export async function searchLoans(input: LoanSearchInput) {
  const { query, bankAccountId, type, status, minAmount, maxAmount, startDate, endDate, sortBy, sortOrder, limit, offset } = input;

  const where: WhereOptions = {};
  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (type) where.type = type;
  if (status) where.status = status;

  if (minAmount !== undefined || maxAmount !== undefined) {
    const amountFilter: any = {};
    if (minAmount !== undefined) amountFilter[Op.gte] = minAmount;
    if (maxAmount !== undefined) amountFilter[Op.lte] = maxAmount;
    where.principalAmount = amountFilter;
  }

  if (startDate || endDate) {
    (where as any).startDate = {};
    if (startDate) (where as any).startDate[Op.gte] = startDate;
    if (endDate) (where as any).startDate[Op.lte] = endDate;
  }

  if (query && query.trim().length > 0) {
    (where as any)[Op.or] = [
      { counterpartyName: { [Op.like]: `%${query}%` } },
      { notes: { [Op.like]: `%${query}%` } },
    ];
  }

  const { count, rows } = await Loan.findAndCountAll({
    where,
    order: [[sortBy, sortOrder]],
    limit,
    offset,
  });
  return { data: rows, total: count };
}