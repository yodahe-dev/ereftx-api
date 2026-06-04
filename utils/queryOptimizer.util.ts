import { Op, WhereOptions, Order, col, fn } from 'sequelize';
import { ExpenseQueryInput } from '../validations/expense.schema';

export interface OptimizedQueryResult {
  where: WhereOptions;
  order: Order;
  offset: number;
  limit: number;
}

export class ExpenseQueryOptimizer {
  static buildWhereClause(query: ExpenseQueryInput): WhereOptions {
    const where: WhereOptions = {};

    if (query.startDate || query.endDate) {
      where.expenseDate = {};
      if (query.startDate) where.expenseDate[Op.gte] = query.startDate;
      if (query.endDate) where.expenseDate[Op.lte] = query.endDate;
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.referenceType) where.referenceType = query.referenceType;
    if (query.productId) where.productId = query.productId;

    if (query.minAmount || query.maxAmount) {
      where.amount = {};
      if (query.minAmount) where.amount[Op.gte] = query.minAmount;
      if (query.maxAmount) where.amount[Op.lte] = query.maxAmount;
    }

    return where;
  }

  static buildOrder(query: ExpenseQueryInput): Order {
    const sortField = query.sortBy === 'expenseDate' ? 'expenseDate' 
                    : query.sortBy === 'amount' ? 'amount' 
                    : 'createdAt';
    return [[sortField, query.sortOrder]];
  }

  static buildPagination(query: ExpenseQueryInput): { offset: number; limit: number } {
    const page = Math.max(1, query.page);
    const limit = Math.min(500, Math.max(1, query.limit));
    return { offset: (page - 1) * limit, limit };
  }
}