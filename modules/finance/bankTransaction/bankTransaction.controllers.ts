// modules/finance/bankTransaction/bankTransaction.controllers.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { searchTransactions } from './bankTransaction.query';
import { transactionSearchSchema } from './bankTransaction.schema';

export async function searchTransactionsHandler(req: Request, res: Response) {
  try {
    const query = transactionSearchSchema.parse(req.query);
    const { data, total } = await searchTransactions(query);
    res.json({
      success: true,
      data,
      pagination: { total, limit: query.limit, offset: query.offset, hasMore: query.offset + query.limit < total },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid query', errors: error.flatten() });
    console.error('SEARCH TRANSACTIONS ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}