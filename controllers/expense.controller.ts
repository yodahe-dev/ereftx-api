import { Request, Response } from 'express';
import { ExpenseService } from '../service/expense.service';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
} from '../validations/expense.schema';
import { ZodError } from 'zod';

export class ExpenseController {
  /**
   * Helper: Extract single string ID from req.params
   */
  private static getId(req: Request): string {
    const { id } = req.params;
    if (Array.isArray(id) || !id) {
      throw new Error('Invalid expense ID');
    }
    return id;
  }

  /**
   * Create a new expense
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validated = createExpenseSchema.parse(req.body);
      const expense = await ExpenseService.createExpense(validated);
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get expense by ID
   */
  static async get(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const expense = await ExpenseService.getExpenseById(id);
      res.json({ success: true, data: expense });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Update an existing expense
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const validated = updateExpenseSchema.parse({ ...req.body, id });
      const expense = await ExpenseService.updateExpense(id, validated);
      res.json({ success: true, data: expense });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Delete an expense
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      await ExpenseService.deleteExpense(id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * List expenses with pagination, filters, sorting
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const query = expenseQuerySchema.parse(req.query);
      const result = await ExpenseService.listExpenses(query);
      res.json({ success: true, ...result });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get summary stats (total, by category, by reference type)
   */
  static async summary(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const summary = await ExpenseService.getSummary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Centralized error handler
   */
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