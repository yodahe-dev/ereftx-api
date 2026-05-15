// modules/finance/savingsGoal/savingsGoal.controllers.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { createGoal, updateGoal, deleteGoal } from './savingsGoal.service';
import { searchGoals } from './savingsGoal.query';
import { createGoalSchema, updateGoalSchema, goalSearchSchema } from './savingsGoal.schema';
import { isUUID } from 'validator';

function getId(req: Request): string | null {
  const id = typeof req.params.id === 'string' ? req.params.id : null;
  return id && isUUID(id, 4) ? id : null;
}

export async function createGoalHandler(req: Request, res: Response) {
  try {
    const validated = createGoalSchema.parse(req.body);
    const goal = await createGoal(validated);
    res.status(201).json({ success: true, data: goal });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('CREATE GOAL ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function updateGoalHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const validated = updateGoalSchema.parse(req.body);
    const goal = await updateGoal(id, validated);
    res.json({ success: true, data: goal });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    console.error('UPDATE GOAL ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function deleteGoalHandler(req: Request, res: Response) {
  try {
    const id = getId(req);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });
    const result = await deleteGoal(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DELETE GOAL ERROR:', error);
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
}

export async function searchGoalsHandler(req: Request, res: Response) {
  try {
    const query = goalSearchSchema.parse(req.query);
    const { data, total } = await searchGoals(query);
    res.json({
      success: true,
      data,
      pagination: { total, limit: query.limit, offset: query.offset, hasMore: query.offset + query.limit < total },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid query', errors: error.flatten() });
    console.error('SEARCH GOALS ERROR:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}