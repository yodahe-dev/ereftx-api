import { Request, Response } from 'express';
import { ExpenseCategoryService } from '../service/expenseCategory.service';
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  expenseCategoryQuerySchema,
} from '../validations/expenseCategory.schema';
import { ZodError } from 'zod';

export class ExpenseCategoryController {
  private static getId(req: Request): string {
    const { id } = req.params;
    if (Array.isArray(id) || !id) throw new Error('Invalid category ID');
    return id;
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validated = createExpenseCategorySchema.parse(req.body);
      const category = await ExpenseCategoryService.create(validated);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const query = expenseCategoryQuerySchema.parse(req.query);
      const category = await ExpenseCategoryService.getById(id, query);
      res.json({ success: true, data: category });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const validated = updateExpenseCategorySchema.parse({ ...req.body, id });
      const category = await ExpenseCategoryService.update(id, validated);
      res.json({ success: true, data: category });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      await ExpenseCategoryService.delete(id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const query = expenseCategoryQuerySchema.parse(req.query);
      const categories = await ExpenseCategoryService.list(query);
      res.json({ success: true, data: categories });
    } catch (error) {
      this.handleError(error, res);
    }
  }

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