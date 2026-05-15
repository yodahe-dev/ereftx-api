// modules/finance/customerDeposit/customerDeposit.query.ts
import { Op, WhereOptions } from 'sequelize';
import db from '../../../models';
import { DepositSearchInput } from './customerDeposit.schema';

const { CustomerDeposit, Customer } = db;

export async function searchDeposits(input: DepositSearchInput) {
  const { query, customerId, status, minAmount, maxAmount, sortBy, sortOrder, limit, offset } = input;

  const where: WhereOptions = {};
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  if (minAmount !== undefined || maxAmount !== undefined) {
    const amountFilter: any = {};
    if (minAmount !== undefined) amountFilter[Op.gte] = minAmount;
    if (maxAmount !== undefined) amountFilter[Op.lte] = maxAmount;
    where.amount = amountFilter;
  }

  if (query && query.trim().length > 0) {
    (where as any)[Op.or] = [
      { notes: { [Op.like]: `%${query}%` } },
    ];
  }

  const { count, rows } = await CustomerDeposit.findAndCountAll({
    where,
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
  });
  return { data: rows, total: count };
}