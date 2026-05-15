import { Request, Response } from 'express';
import { z } from 'zod';
import { createCredit, updateCredit, deleteCredit } from './credit.service';
import { searchCredits } from './credit.query';
import { createCreditSchema, updateCreditSchema, creditSearchSchema } from './credit.schema';
import { isUUID } from 'validator';

function getId(req: Request): string | null {
  const id = req.params.id;
  return typeof id === 'string' && isUUID(id, 4) ? id : null;
}

export async function createCreditHandler(req: Request, res: Response) {
  try {
    const validated = createCreditSchema.parse(req.body);
    const credit = await createCredit(validated);
    res.status(201).json({ success: true, data: credit });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('CREATE CREDIT ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function updateCreditHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const validated = updateCreditSchema.parse(req.body);
    const credit = await updateCredit(id, validated);
    res.json({ success: true, data: credit });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('UPDATE CREDIT ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function deleteCreditHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const result = await deleteCredit(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DELETE CREDIT ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function searchCreditsHandler(req: Request, res: Response) {
  try {
    const query = creditSearchSchema.parse(req.query);
    const { data, total } = await searchCredits(query);
    res.json({
      success: true,
      data,
      pagination: { total, limit: query.limit, offset: query.offset, hasMore: query.offset + query.limit < total },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid query', errors: error.flatten() });
    console.error('SEARCH CREDITS ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}