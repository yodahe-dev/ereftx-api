import { Op } from 'sequelize';
import db from '../../../models';
import { CustomerSearchInput } from './customer.schema';

const { Customer } = db;

export async function searchCustomers(input: CustomerSearchInput) {
  const { query, sortBy, sortOrder, limit, offset } = input;

  const where: any = {};
  if (query && query.trim().length > 0) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query}%` } },
      { phone: { [Op.like]: `%${query}%` } },
    ];
  }

  const { count, rows } = await Customer.findAndCountAll({
    where,
    order: [[sortBy, sortOrder]],
    limit,
    offset,
  });
  return { data: rows, total: count };
}