// modules/finance/savingsGoal/savingsGoal.query.ts
import { Op, WhereOptions } from 'sequelize';
import db from '../../../models';
import { GoalSearchInput } from './savingsGoal.schema';

const { SavingsGoal, BankAccount } = db;

export async function searchGoals(input: GoalSearchInput) {
  const { query, bankAccountId, status, sortBy, sortOrder, limit, offset } = input;

  const where: WhereOptions = {};
  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (status) where.status = status;

  if (query && query.trim().length > 0) {
    Object.assign(where, {
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { notes: { [Op.like]: `%${query}%` } },
      ],
    });
  }

  const { count, rows } = await SavingsGoal.findAndCountAll({
    where,
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    include: [{ model: BankAccount, as: 'account', attributes: ['name'] }],
  });
  return { data: rows, total: count };
}