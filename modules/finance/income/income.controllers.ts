import { Request, Response } from 'express';
import { z } from 'zod';
import { createIncome, updateIncome, deleteIncome } from './income.service';
import { searchIncome } from './income.query';
import { createIncomeSchema, updateIncomeSchema, incomeSearchSchema } from './income.schema';
import { isUUID } from 'validator';

function getId(req: Request): string | null {
  const id = req.params.id as string | undefined;
  return id && isUUID(id, 4) ? id : null;
}

export async function createIncomeHandler(req: Request, res: Response) {
  try {
    const validated = createIncomeSchema.parse(req.body);
    const income = await createIncome(validated);
    res.status(201).json({ success: true, data: income });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('CREATE INCOME ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function updateIncomeHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const validated = updateIncomeSchema.parse(req.body);
    const income = await updateIncome(id, validated);
    res.json({ success: true, data: income });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('UPDATE INCOME ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function deleteIncomeHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const result = await deleteIncome(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DELETE INCOME ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function searchIncomeHandler(req: Request, res: Response) {
  try {
    const query = incomeSearchSchema.parse(req.query);
    const { data, total } = await searchIncome(query);
    res.json({
      success: true,
      data,
      pagination: { total, limit: query.limit, offset: query.offset, hasMore: query.offset + query.limit < total },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid query', errors: error.flatten() });
    console.error('SEARCH INCOME ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}