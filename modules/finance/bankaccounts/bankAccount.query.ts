// modules/bankaccounts/bankAccount.query.ts
import { Op, WhereOptions, Order } from 'sequelize';
import db from '../../../models';
import { BankAccountSearchInput } from './bankAccount.schema';
import stringSimilarity from 'string-similarity';   // npm install string-similarity

const { BankAccount } = db;

interface SearchResult {
  data: any[];
  total: number;
}

/**
 * Safe Levenshtein comparison – wraps the library to never throw.
 */
function safeCompare(a: string, b: string): number {
  try {
    return stringSimilarity.compareTwoStrings(a, b);
  } catch {
    return 0;
  }
}

export async function advancedSearch(input: BankAccountSearchInput): Promise<SearchResult> {
  const {
    query,
    type,
    minBalance,
    maxBalance,
    sortBy,
    sortOrder,
    limit = 20,
    offset = 0,
  } = input;

  // ---------- 1. Strict numeric/type filtering ----------
  const where: WhereOptions = {};
  if (type) where.type = type;
  if (minBalance !== undefined || maxBalance !== undefined) {
    const balanceFilter: any = {};
    if (minBalance !== undefined) balanceFilter[Op.gte] = minBalance;
    if (maxBalance !== undefined) balanceFilter[Op.lte] = maxBalance;
    where.balance = balanceFilter;
  }

  // ---------- 2. No search query → direct DB fetch ----------
  if (!query || query.trim().length === 0) {
    const { count, rows } = await BankAccount.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });
    return { data: rows, total: count };
  }

  const queryLower = query.toLowerCase().trim();

  // ---------- 3. Short query (≤2 chars) → SQL LIKE ----------
  if (queryLower.length <= 2) {
    const likeWhere = {
      ...where,
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
      ],
    };
    const { count, rows } = await BankAccount.findAndCountAll({
      where: likeWhere,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });
    return { data: rows, total: count };
  }

  // ---------- 4. Intelligent hybrid search ----------
  // Step 4a: Use an indexed LIKE to drastically reduce the candidate pool.
  // This assumes a FULLTEXT or regular BTREE index on `name` exists.
  const candidateWhere = {
    ...where,
    name: { [Op.like]: `%${query}%` },   // fast indexed pre‑filter
  };

  // Count how many rows match the pre‑filter
  const totalCandidates = await BankAccount.count({ where: candidateWhere });

  // If the candidate set is still huge, we can fall back to pure SQL ordering without similarity.
  // For up to 2000 rows we apply fuzzy scoring; beyond that we rely on the database ordering.
  const MAX_SCORED = 2000;

  if (totalCandidates === 0) {
    return { data: [], total: 0 };
  }

  if (totalCandidates <= MAX_SCORED) {
    // Fetch all pre‑filtered rows (ordered by the user’s preference)
    const candidates = await BankAccount.findAll({
      where: candidateWhere,
      order: [[sortBy, sortOrder]],
      raw: true,
    });

    // Score each candidate
    const scored = candidates.map((account: any) => {
      const nameLower = (account.name as string).toLowerCase();
      const similarity = safeCompare(queryLower, nameLower);
      const substringBonus = nameLower.includes(queryLower) ? 0.3 : 0;
      return { account, score: similarity + substringBonus };
    });

    // Sort by score descending, then by user’s field
    scored.sort((a, b) => {
      const diff = b.score - a.score;
      if (diff !== 0) return diff;
      const aVal = (a.account as any)[sortBy];
      const bVal = (b.account as any)[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'ASC' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    const paginated = scored.slice(offset, offset + limit).map(item => item.account);
    return { data: paginated, total: scored.length };
  } else {
    // Too many candidates – rely on database ordering + LIMIT.
    // We don’t apply fuzzy scoring because it would be too slow.
    const { count, rows } = await BankAccount.findAndCountAll({
      where: candidateWhere,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });
    return { data: rows, total: count };
  }
}