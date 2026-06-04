import { Request, Response } from 'express';
import { RecurringExpenseService } from '../service/recurringExpense.service';
import { RecurringExpenseGenerator } from '../service/recurringExpense.generator';
import {
  createRecurringExpenseSchema,
  updateRecurringExpenseSchema,
  recurringExpenseQuerySchema,
} from '../validations/recurringExpense.schema';
import { ZodError } from 'zod';

export class RecurringExpenseController {
  private static getId(req: Request): string {
    const { id } = req.params;
    if (Array.isArray(id) || !id) throw new Error('Invalid recurring expense ID');
    return id;
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validated = createRecurringExpenseSchema.parse(req.body);
      const recurring = await RecurringExpenseService.create(validated);
      res.status(201).json({ success: true, data: recurring });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const recurring = await RecurringExpenseService.getById(id);
      res.json({ success: true, data: recurring });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const validated = updateRecurringExpenseSchema.parse({ ...req.body, id });
      const recurring = await RecurringExpenseService.update(id, validated);
      res.json({ success: true, data: recurring });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      await RecurringExpenseService.delete(id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const query = recurringExpenseQuerySchema.parse(req.query);
      const result = await RecurringExpenseService.list(query);
      res.json({ success: true, ...result });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async preview(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const months = parseInt(req.query.months as string) || 6;
      const dates = await RecurringExpenseService.previewUpcoming(id, months);
      res.json({ success: true, data: dates });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // Manual trigger for automation
  static async generateNow(req: Request, res: Response): Promise<void> {
    try {
      const dryRun = req.query.dryRun === 'true';
      const result = await RecurringExpenseGenerator.generateDueExpenses(new Date(), dryRun);
      res.json({ success: true, ...result });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async backfill(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const { startDate, endDate, dryRun } = req.body;
      const count = await RecurringExpenseGenerator.generateBacklog(id, new Date(startDate), new Date(endDate), dryRun === true);
      res.json({ success: true, message: `Generated ${count} expenses` });
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