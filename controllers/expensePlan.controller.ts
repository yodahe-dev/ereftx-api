import { Request, Response } from 'express';
import { ExpensePlanService } from '../service/expensePlan.service';
import {
  createExpensePlanSchema,
  updateExpensePlanSchema,
  expensePlanQuerySchema,
} from '../validations/expensePlan.schema';
import { ZodError } from 'zod';

export class ExpensePlanController {
  private static getId(req: Request): string {
    const { id } = req.params;
    if (Array.isArray(id) || !id) throw new Error('Invalid expense plan ID');
    return id;
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validated = createExpensePlanSchema.parse(req.body);
      const plan = await ExpensePlanService.create(validated);
      res.status(201).json({ success: true, data: plan });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const includeExpenses = req.query.includeExpenses === 'true';
      const plan = await ExpensePlanService.getById(id, includeExpenses);
      res.json({ success: true, data: plan });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const validated = updateExpensePlanSchema.parse({ ...req.body, id });
      const plan = await ExpensePlanService.update(id, validated);
      res.json({ success: true, data: plan });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      await ExpensePlanService.delete(id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const query = expensePlanQuerySchema.parse(req.query);
      const result = await ExpensePlanService.list(query);
      res.json({ success: true, ...result });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async refreshAllocation(req: Request, res: Response): Promise<void> {
    try {
      const id = this.getId(req);
      const newAmount = await ExpensePlanService.refreshAllocatedAmount(id);
      res.json({ success: true, data: { currentAllocatedAmount: newAmount } });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  static async autoCancelOverdue(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      const count = await ExpensePlanService.batchUpdateStatusByCondition(
        (plan) => plan.targetDate && new Date(plan.targetDate) < today && plan.status !== 'completed',
        'cancelled',
        500
      );
      res.json({ success: true, message: `Cancelled ${count} overdue plans` });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private static handleError(error: unknown, res: Response): void {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, errors: error.flatten() });
    } else if (error instanceof Error) {
      // Use 409 for linked expenses conflict
      const status = error.message.includes('Cannot delete plan with linked expenses') ? 409 : 400;
      res.status(status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}