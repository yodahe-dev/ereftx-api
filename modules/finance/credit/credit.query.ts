import { Op, WhereOptions } from 'sequelize';
import db from '../../../models';
import { CreditSearchInput } from './credit.schema';

const { Credit } = db;

export async function searchCredits(input: CreditSearchInput) {
  const { query, customerId, status, minAmount, maxAmount, startDate, endDate, sortBy, sortOrder, limit, offset } = input;

  const where: WhereOptions = {};
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  if (minAmount !== undefined || maxAmount !== undefined) {
    const amountFilter: any = {};
    if (minAmount !== undefined) amountFilter[Op.gte] = minAmount;
    if (maxAmount !== undefined) amountFilter[Op.lte] = maxAmount;
    where.totalAmount = amountFilter;
  }

  if (startDate || endDate) {
    where.dueDate = {};
    if (startDate) where.dueDate[Op.gte] = startDate;
    if (endDate) where.dueDate[Op.lte] = endDate;
  }

  if (query && query.trim().length > 0) {
    (where as any)[Op.or] = [
      { notes: { [Op.like]: `%${query}%` } },
      // could also search by customer name via include, but keep it simple
    ];
  }

  const { count, rows } = await Credit.findAndCountAll({
    where,
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    include: [{ model: db.Customer, as: 'customer', attributes: ['name'] }],
  });
  return { data: rows, total: count };
}