// modules/finance/bankTransaction/bankTransaction.query.ts
import { Op, WhereOptions } from 'sequelize';
import db from '../../../models';
import { TransactionSearchInput } from './bankTransaction.schema';

const { BankTransaction } = db;

export async function searchTransactions(input: TransactionSearchInput) {
  const {
    query,
    bankAccountId,
    type,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    referenceId,
    sortBy,
    sortOrder,
    limit,
    offset,
  } = input;

  const where: WhereOptions = {};

  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (type) where.type = type;
  if (referenceId) where.referenceId = referenceId;

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

  // Search across description and referenceId
  if (query && query.trim().length > 0) {
    (where as any)[Op.or] = [
      { description: { [Op.like]: `%${query}%` } },
      { referenceId: { [Op.like]: `%${query}%` } },
    ];
  }

  const { count, rows } = await BankTransaction.findAndCountAll({
    where,
    order: [[sortBy, sortOrder]],
    limit,
    offset,
  });

  return { data: rows, total: count };
}