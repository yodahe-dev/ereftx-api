// modules/finance/expense/expense.controllers.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { createExpense, updateExpense, deleteExpense } from './expense.service';
import { searchExpenses } from './expense.query';
import { createExpenseSchema, updateExpenseSchema, expenseSearchSchema } from './expense.schema';
import { isUUID } from 'validator';

function getId(req: Request): string | null {
  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  return id && isUUID(id, 4) ? id : null;
}

export async function createExpenseHandler(req: Request, res: Response) {
  try {
    const validated = createExpenseSchema.parse(req.body);
    const expense = await createExpense(validated);
    res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('CREATE EXPENSE ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function updateExpenseHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const validated = updateExpenseSchema.parse(req.body);
    const expense = await updateExpense(id, validated);
    res.json({ success: true, data: expense });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('UPDATE EXPENSE ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function deleteExpenseHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const result = await deleteExpense(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DELETE EXPENSE ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function searchExpensesHandler(req: Request, res: Response) {
  try {
    const query = expenseSearchSchema.parse(req.query);
    const { data, total } = await searchExpenses(query);
    res.json({
      success: true,
      data,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid query', errors: error.flatten() });
    console.error('SEARCH EXPENSES ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}