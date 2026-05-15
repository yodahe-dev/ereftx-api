// modules/finance/customerDeposit/customerDeposit.controllers.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { createDeposit, updateDeposit, deleteDeposit } from './customerDeposit.service';
import { searchDeposits } from './customerDeposit.query';
import { createDepositSchema, updateDepositSchema, depositSearchSchema } from './customerDeposit.schema';
import { isUUID } from 'validator';

function getId(req: Request): string | null {
  const id = req.params.id;
  return typeof id === 'string' && isUUID(id, 4) ? id : null;
}

export async function createDepositHandler(req: Request, res: Response) {
  try {
    const validated = createDepositSchema.parse(req.body);
    const deposit = await createDeposit(validated);
    res.status(201).json({ success: true, data: deposit });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('CREATE DEPOSIT ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function updateDepositHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const validated = updateDepositSchema.parse(req.body);
    const deposit = await updateDeposit(id, validated);
    res.json({ success: true, data: deposit });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('UPDATE DEPOSIT ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function deleteDepositHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const result = await deleteDeposit(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DELETE DEPOSIT ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function searchDepositsHandler(req: Request, res: Response) {
  try {
    const query = depositSearchSchema.parse(req.query);
    const { data, total } = await searchDeposits(query);
    res.json({
      success: true,
      data,
      pagination: { total, limit: query.limit, offset: query.offset, hasMore: query.offset + query.limit < total },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid query', errors: error.flatten() });
    console.error('SEARCH DEPOSITS ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}