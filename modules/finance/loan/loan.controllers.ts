import { Request, Response } from 'express';
import { z } from 'zod';
import { createLoan, updateLoan, deleteLoan } from './loan.service';
import { searchLoans } from './loan.query';
import { createLoanSchema, updateLoanSchema, loanSearchSchema } from './loan.schema';
import { isUUID } from 'validator';

function getId(req: Request): string | null {
  const id = req.params.id;
  return typeof id === 'string' && isUUID(id, 4) ? id : null;
}

export async function createLoanHandler(req: Request, res: Response) {
  try {
    const validated = createLoanSchema.parse(req.body);
    const loan = await createLoan(validated);
    res.status(201).json({ success: true, data: loan });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('CREATE LOAN ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function updateLoanHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const validated = updateLoanSchema.parse(req.body);
    const loan = await updateLoan(id, validated);
    res.json({ success: true, data: loan });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('UPDATE LOAN ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function deleteLoanHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const result = await deleteLoan(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DELETE LOAN ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function searchLoansHandler(req: Request, res: Response) {
  try {
    const query = loanSearchSchema.parse(req.query);
    const { data, total } = await searchLoans(query);
    res.json({
      success: true,
      data,
      pagination: { total, limit: query.limit, offset: query.offset, hasMore: query.offset + query.limit < total },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid query', errors: error.flatten() });
    console.error('SEARCH LOANS ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}