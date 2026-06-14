import { Request, Response } from 'express';
import { ExpenseService } from '../service/expense.service';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
} from '../validations/expense.schema';
import { ZodError } from 'zod';

export class ExpenseController {
  // ── Helper ──
  private static getId(req: Request): string {
    const { id } = req.params;
    if (Array.isArray(id) || !id) {
      throw new Error('Invalid expense ID');
    }
    return id;
  }

  // ── Create ──
  static async create(req: Request, res: Response): Promise<void> {
    try {
      console.log('📥 Received POST /expenses with body:', req.body);
      const validated = createExpenseSchema.parse(req.body);
      console.log('✅ Validation passed:', validated);
      const expense = await ExpenseService.createExpense(validated);
      console.log('✅ Expense created:', expense);
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      console.error('❌ Create expense error:', error);
      ExpenseController.handleError(error, res);
    }
  }

  // ── Get ──
  static async get(req: Request, res: Response): Promise<void> {
    try {
      const id = ExpenseController.getId(req);
      const expense = await ExpenseService.getExpenseById(id);
      res.json({ success: true, data: expense });
    } catch (error) {
      ExpenseController.handleError(error, res);
    }
  }

  // ── Update ──
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = ExpenseController.getId(req);
      const validated = updateExpenseSchema.parse({ ...req.body, id });
      const expense = await ExpenseService.updateExpense(id, validated);
      res.json({ success: true, data: expense });
    } catch (error) {
      ExpenseController.handleError(error, res);
    }
  }

  // ── Delete ──
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = ExpenseController.getId(req);
      await ExpenseService.deleteExpense(id);
      res.status(204).send();
    } catch (error) {
      ExpenseController.handleError(error, res);
    }
  }

  // ── List ──
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const query = expenseQuerySchema.parse(req.query);
      const result = await ExpenseService.listExpenses(query);
      res.json({ success: true, ...result });
    } catch (error) {
      ExpenseController.handleError(error, res);
    }
  }

  // ── Summary ──
  static async summary(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const summary = await ExpenseService.getSummary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      ExpenseController.handleError(error, res);
    }
  }

  // ═══════════════════════════════════════════════
  //  STATIC ERROR HANDLER – MUST EXIST
  // ═══════════════════════════════════════════════
  private static handleError(error: unknown, res: Response): void {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, errors: error.flatten() });
    } else if (error instanceof Error) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}